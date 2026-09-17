import os, json
from dotenv import load_dotenv
from typing import List, Dict, Any, TypedDict

from langchain_core.messages import SystemMessage
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq

from tools import search_arxiv

load_dotenv()

# Initialize LLM (Groq)
llm = ChatGroq(
    model="openai/gpt-oss-120b",
    temperature=0.2,
    groq_api_key=os.getenv("GROQ_API_KEY")
)

# State Definition
class AgentState(TypedDict):
    user_query: str
    sub_queries: List[str]
    retrieved_papers: List[Dict[str, Any]]
    critique: str
    is_sufficient: bool
    iteration_count: int
    final_report: str


# Use key from state if user provided BYOK key, else fallback to env variable
def get_llm(state: dict):
    
    api_key = state.get("groq_api_key") or os.getenv("GROQ_API_KEY")
    return ChatGroq(
        model_name="openai/gpt-oss-120b",
        groq_api_key=api_key,
        temperature=0.2
    )

# Agent Nodes

#Planner
def planner_node(state:AgentState) -> Dict[str,Any]:
    """Deconstruct the user query into specific academic search queries."""
    print("\n PLANNER AGENT analyzing query and creating research sub-goals...")

    llm = get_llm(state)

    prompt = f"""You are a Senior Academic Research Planner.
    Deconstruct the following research topic into 2-3 specific, targeted academic search queries suitable for ArXiv.
    
    Topic : {state['user_query']}

    Return ONLY a JSON list of strings, like this:
    ["query 1", "query 2"]
    """

    response = llm.invoke([SystemMessage(content=prompt)])
    try:
        sub_queries = json.loads(response.content.strip())
        if not isinstance(sub_queries, list):
            sub_queries = [state['user_query']]

    except Exception:
        sub_queries = [state['user_query']]


    print(f"  Sub-queries generated: {sub_queries}")
    return {"sub_queries": sub_queries, "iteration_count": 0, "retrieved_papers": []}

# Retriever
def retriever_node(state: AgentState) -> Dict[str, Any]:
    """Fetches academic literature for sub-queries using ArXiv."""
    print("\n RETRIEVER AGENT fetching literature from ArXiv...")

    existing_papers = state.get("retrieved_papers",[])
    existing_titles = {p["title"].lower() for p in existing_papers}

    new_papers = []
    for query in state["sub_queries"]:
        print(f"  Searching ArXiv for: '{query}'")
        results = search_arxiv(query,max_results=3)

        for paper in results:
            if paper["title"].lower() not in existing_titles:
                existing_titles.add(paper["title"].lower())
                new_papers.append(paper)

    all_papers = existing_papers + new_papers
    print(f"    Total unique ArXiv papers retrieved so far: {len(all_papers)}")
    return {"retrieved_papers": all_papers}

# Critic
def critic_node(state: AgentState) -> Dict[str, Any]:
    """Evaluate whether retrieved papers provide sufficient context."""
    print("\n CRITIC AGENT evaluating coverage and source quality..")

    llm = get_llm(state)

    iteration = state.get("iteration_count",0)+1
    papers_summary = "\n".join([
        f"- Title: {p['title']} | Summary: {p['summary'][:200]}..." for p in state["retrieved_papers"]
    ])

    prompt = f"""You are a strict and experienced academic journal reviewer.
    User Query: {state['user_query']}

    Retrieved ArXiv Literature:
    {papers_summary}

    Determine if these paper summaries provide enough information to deliver a deep comparative answer.
    Respond in valid JSON format:
    {{
    "is_sufficient": true/false,
    "critique": "Brief explanation of what is missing or well covered",
    "new_search_query": "A refined search query if information is insufficient, else empty string"
    }}
    """

    response = llm.invoke([SystemMessage(content=prompt)])

    try:
        res_json = json.loads(response.content.strip())
        is_sufficient = res_json.get("is_sufficient",True)
        critique = res_json.get("critique","")
        new_query = res_json.get("new_search_query","")
    except Exception:
        is_sufficient = True
        critique = "Default approval due to parsing."
        new_query = ""

    # Force completion after 2 iterations to prevent infinite loops
    if iteration >= 2:
        print("   Reached max iteration (2). Forcing synthesis stage.")
        is_sufficient = True

    sub_queries = state["sub_queries"]
    if not is_sufficient and new_query:
        sub_queries = [new_query]
        print(f"    Critique: {critique}")
        print(f"    Refined Search Query for loop: {new_query}")
    else:
        print(f"    Critic Decision: Approved! (Sufficient context)")

    return {
        "is_sufficient": is_sufficient,
        "critique": critique,
        "sub_queries": sub_queries,
        "iteration_count": iteration
    }

# Synthesizer
def synthesizer_node(state: AgentState) -> Dict[str, Any]:
    """Synthesize all findings into a structured, cited academic literature review."""
    print("\n   SYNTHESIZER AGENT generating structured literature review ...")

    llm = get_llm(state)

    papers_context = ""
    for i,p in enumerate(state["retrieved_papers"],1):
        papers_context += f"\n[{i}] Title: {p['title']}\n   Authors: {', '.join(p['authors'])}\n    Source: {p['source']} ({p.get('published', 'N/A')})\n   Summary: {p['summary']}\n   URL: {p.get('pdf_url', 'N/A')}\n"


    prompt = f"""You are an expert AI research scientist.
    Generate a comprehensive, structured Academic Literature Review responding to the topic below.

    Topic: {state['user_query']}

    Available Research Papers from ArXiv:
    {papers_context}

    Format your output in clean Markdown with:
    1. ## Executive Summary
    2. ## Methodology Comparison
    3. ## Key Findings & Research Gaps
    4. ## Reference & Links ( Explicitly cite papers using numbered brackets like [1], [2] with their PDF URLs)
    """

    response = llm.invoke([SystemMessage(content=prompt)])
    return {"final_report": response.content}


# Graph routing ad Compilation
def should_continue(state: AgentState) -> str:
    """Routes back to retriever if info is insufficient, else goes to synthesizer."""
    if state["is_sufficient"]:
        return "synthesizer"
    return "retriever"



builder = StateGraph(AgentState)

builder.add_node("planner",planner_node)
builder.add_node("retriever",retriever_node)
builder.add_node("critic",critic_node)
builder.add_node("synthesizer",synthesizer_node)

builder.set_entry_point("planner")
builder.add_edge("planner","retriever")
builder.add_edge("retriever","critic")

builder.add_conditional_edges(
    "critic",
    should_continue,
    {
        "retriever": "retriever",
        "synthesizer": "synthesizer"
    }
)

builder.add_edge("synthesizer", END)

# Compiled State Machine
graph = builder.compile()