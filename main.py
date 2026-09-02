import json
import asyncio
from typing import AsyncGenerator, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agent_graph import graph


app = FastAPI(
    title="Agentic RAG API",
    description="Multi-Agent Research Assistant using LangGraph, Groq and ArXiv",
    version="1.0.0"
)

# CORS for local React/Next.js frontend integration

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]      
)

class ResearchRequest(BaseModel):
    query : str
    thread_id: Optional[str] = "default_thread"


@app.get("/")
def read_root():
    return {"status": "online", "message": "Agentic RAG Literature Engine is active."}

async def stream_graph_events(user_query: str, thread_id: str) -> AsyncGenerator[str,None]:
    """
    Asynchronously executes the LangGraph workflow and yields Server-Sent Events (SSE)
    tracking agent progress and token streaming.
    """

    initial_state = {"user_query": user_query}
    config = {"configurable": {"thread_id": thread_id}}

    # Send connection acknowledgement
    yield f"data: {json.dumps({'type': 'status', 'content': 'Starting research pipeline...'})}\n\n"

    try:
        # Stream events from the LangGraph execution graph
        async for event in graph.astream_events(initial_state,config=config, version="v2"):
            kind = event.get("event")
            name = event.get("name", "")

            # Caapture when custom nodes begin processing
            if kind == "on_chain_start" and name in ["planner","retriever","critic","synthesizer"]:
                payload = {
                    "type": "node_start",
                    "node": name,
                    "message": f"Agent '{name.upper()}' is processing..."
                }

                yield f"data: {json.dumps(payload)}\n\n"

            # Capture when custom nodes finish processing
            elif kind == "on_chain_end" and name in ["planner","retriever","critic","synthesizer"]:
                output_data = event.get("data",{}).get("output",{})
                payload = {
                    "type": "node_end",
                    "node": name,
                    "output": output_data
                }

                yield f"data: {json.dumps(payload)}\n\n"

            # Stream LLM tokens live when Synthesizer generates the review
            elif kind == "on_chat_model_stream":
                # Check if stream originates from the Synthesizer stage
                chunk = event.get("data",{}).get("chunk")
                if chunk and hasattr(chunk,"content") and chunk.content:
                    payload = {
                        "type": "token",
                        "content": chunk.content
                    }
                    yield f"data: {json.dumps(payload)}\n\n"
        # Signal completion
        yield f"data: {json.dumps({'type': 'complete', 'message': 'Research finished successfully.'})}\n\n"

    except asyncio.CancelledError:
        print(f"Client disconnected from thread: {thread_id}")

    except Exception as e:
        error_payload = {"type": "error", "message":str(e)}
        yield f"data: {json.dumps(error_payload)}\n\n"


@app.post("/api/research/stream")
async def run_research_stream(request: ResearchRequest):
    """
    POST endpoints that streams real-time updates from the multi-agent graph.
    """

    if not request.query.strip():
        raise HTTPException(status_code=400, detail=" Query string cannot be empty.")

    return StreamingResponse(
        stream_graph_events(request.query, request.thread_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)