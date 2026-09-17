import os
import json
import asyncio
import time
from typing import AsyncGenerator, Optional
from collections import defaultdict
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from agent_graph import graph


app = FastAPI(
    title="Agentic RAG API",
    description="Multi-Agent Research Assistant using LangGraph, Groq and ArXiv",
    version="1.0.0"
)

# CORS middleware for local frontend development or external API clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]      
)

# In-Memory IP Rate Limiter
IP_REQUEST_LOGS = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # seconds
MAX_REQUESTS_PER_WINDOW = 1  # 1 request per minute per IP

def rate_limit_guard(request: Request):
    # Retrieve true client IP behind Render reverse proxy
    client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown").split(",")[0].strip()
    now = time.time()
    
    # Filter timestamps within current window
    timestamps = [ts for ts in IP_REQUEST_LOGS[client_ip] if now - ts < RATE_LIMIT_WINDOW]
    IP_REQUEST_LOGS[client_ip] = timestamps

    if len(timestamps) >= MAX_REQUESTS_PER_WINDOW:
        raise HTTPException(
            status_code=429, 
            detail="Rate limit reached: Demo allows 1 research query per minute per IP. Please wait or use your own Groq API key."
        )
    
    IP_REQUEST_LOGS[client_ip].append(now)


# Request Schema with Optional BYOK (Bring Your Own Key)
class ResearchRequest(BaseModel):
    query: str
    thread_id: Optional[str] = "default_thread"
    api_key: Optional[str] = None


# API Endpoint
@app.get("/api/health")
def health_check():
    """Health check endpoint for API monitoring."""
    return {"status": "online", "message": "Agentic RAG Literature Engine is active."}


async def stream_graph_events(user_query: str, thread_id: str, custom_api_key: Optional[str] = None) -> AsyncGenerator[str, None]:
    """
    Asynchronously executes the LangGraph workflow and yields Server-Sent Events (SSE)
    tracking agent progress and token streaming.
    """

    # Pass user_key down to graph state if provided, otherwise fallback to server env key
    active_api_key = custom_api_key if custom_api_key and custom_api_key.strip() else os.getenv("GROQ_API_KEY")

    initial_state = {"user_query": user_query}
    config = {"configurable": {"thread_id": thread_id}}

    # Send connection acknowledgement
    yield f"data: {json.dumps({'type': 'status', 'content': 'Starting research pipeline...'})}\n\n"

    try:
        # Stream events from the LangGraph execution graph
        async for event in graph.astream_events(initial_state, config=config, version="v2"):
            kind = event.get("event")
            name = event.get("name", "")

            # Capture when custom nodes begin processing
            if kind == "on_chain_start" and name in ["planner", "retriever", "critic", "synthesizer"]:
                payload = {
                    "type": "node_start",
                    "node": name,
                    "message": f"Agent '{name.upper()}' is processing..."
                }
                yield f"data: {json.dumps(payload)}\n\n"

            # Capture when custom nodes finish processing
            elif kind == "on_chain_end" and name in ["planner", "retriever", "critic", "synthesizer"]:
                output_data = event.get("data", {}).get("output", {})
                payload = {
                    "type": "node_end",
                    "node": name,
                    "output": output_data
                }
                yield f"data: {json.dumps(payload)}\n\n"

            # Stream LLM tokens live when Synthesizer generates the review
            elif kind == "on_chat_model_stream":
                chunk = event.get("data", {}).get("chunk")
                if chunk and hasattr(chunk, "content") and chunk.content:
                    payload = {
                        "type": "token",
                        "content": chunk.content
                    }
                    yield f"data: {json.dumps(payload)}\n\n"

        # Signal completion
        yield f"data: {json.dumps({'type': 'complete', 'message': 'Research finished successfully.'})}\n\n"

    except asyncio.CancelledError:
        print(f"Client disconnected from thread: {thread_id}")

# Catch 429 Errors 
    except Exception as e:
        err_msg = str(e)
        if "429" in err_msg or "rate_limit" in err_msg.lower() or "tpm" in err_msg.lower():
            err_msg = "⚠️ Groq API Free-Tier Rate Limit Reached! Please wait 60 seconds before trying again, or provide your own Groq API key in Settings."
            
        error_payload = {"type": "error", "message": err_msg}
        yield f"data: {json.dumps(error_payload)}\n\n"


@app.post("/api/research/stream")
async def run_research_stream(request: ResearchRequest):
    """
    POST endpoint that streams real-time updates from the multi-agent graph.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query string cannot be empty.")

    return StreamingResponse(
        stream_graph_events(request.query, request.thread_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


frontend_dist = os.path.join(os.path.dirname(__file__), "frontend", "dist")

if os.path.exists(frontend_dist):
    # Mount compiled frontend assets folder (/assets)
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # Serve index.html or requested static file for non-API routes
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API route not found.")
        
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    # Development mode fallback if React dist folder hasn't been compiled yet
    @app.get("/")
    def read_root():
        return {
            "status": "online",
            "mode": "development",
            "message": "Agentic RAG Literature Engine active. Run 'npm run build' in frontend/ to serve UI directly."
        }


if __name__ == "__main__":
    import uvicorn
    # Support dynamic PORT environment variable 
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)