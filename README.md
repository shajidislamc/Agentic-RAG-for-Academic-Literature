# 📚 Agentic RAG Academic Literature Assistant

An autonomous multi-agent research engine that breaks down complex scientific queries, searches ArXiv for relevant literature, critically evaluates paper quality and coverage, and streams structured literature reviews in real time.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-2ea44f?style=for-the-badge)](https://agentic-rag-for-academic-literature.onrender.com/)
[![Report Bug](https://img.shields.io/badge/Report%20Bug-Open%20Issue-d73a4a?style=for-the-badge)](https://github.com/shajidislamc/Agentic-RAG-for-Academic-Literature/issues)
[![Request Feature](https://img.shields.io/badge/Request%20Feature-Suggest%20Idea-8957e5?style=for-the-badge)](https://github.com/shajidislamc/Agentic-RAG-for-Academic-Literature/issues)

---

## Overview

### Problem Statement

Conducting literature reviews manually requires searching academic repositories, evaluating papers for domain relevance, filtering out tangential results, and synthesizing findings from multiple sources into a cohesive analysis.

Traditional single-pass RAG (Retrieval-Augmented Generation) pipelines can struggle with complex, multi-faceted research questions because a single retrieval query may miss important aspects of a topic or return fragmented context.

### Solution

This project implements an **autonomous agentic workflow** powered by **LangGraph**. Instead of relying on a single query-response chain, specialized agents operate within a stateful execution graph:

1. **Planner Agent** — Deconstructs the user's research question into focused academic search queries.
2. **ArXiv Retriever** — Searches ArXiv and retrieves paper metadata, abstracts, and author information.
3. **Quality Critic** — Evaluates the retrieved literature for domain relevance and context sufficiency. If coverage is inadequate, it triggers a query-refinement loop.
4. **Synthesizer Agent** — Compiles the retrieved findings into a structured Markdown literature review and streams the generated content to the frontend in real time.

---

## Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                 React Frontend (Vite + TS)                   │
│                                                              │
│        [ Query Input ]       [ Reasoning Drawer ]            │
└──────────────────────────────┬───────────────────────────────┘
                               │
                  POST /api/research/stream
                               │
                               │ SSE
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    FastAPI Backend Server                    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                 LangGraph State Machine                │  │
│  │                                                        │  │
│  │   ┌───────────┐     ┌───────────────┐     ┌─────────┐ │  │
│  │   │  Planner  │ ──► │    ArXiv      │ ──► │ Quality │ │  │
│  │   │   Agent   │     │   Retriever   │     │ Critic  │ │  │
│  │   └───────────┘     └───────────────┘     └────┬────┘ │  │
│  │                                                 │      │  │
│  │                              Context sufficient?│      │  │
│  │                                    ┌────────────┴───┐  │  │
│  │                                    │                │  │  │
│  │                                   No               Yes │  │
│  │                                    │                │  │  │
│  │                                    ▼                ▼  │  │
│  │                            ┌─────────────┐   ┌──────────┐
│  │                            │ Refine Query│   │Synthesis │
│  │                            │      │      │   │  Agent   │
│  │                            └──────┼──────┘   └────┬─────┘
│  │                                   │               │      │
│  │                                   └───────┐       │      │
│  │                                           └───────┘      │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────┬──────────────────────┘
                                        │
                              Server-Sent Events
                                        │
                                        ▼
┌──────────────────────────────────────────────────────────────┐
│          React Markdown Canvas / Real-Time Renderer          │
└──────────────────────────────────────────────────────────────┘
```

### Workflow

```text
User Research Question
          │
          ▼
     Planner Agent
          │
          ▼
   Focused Search Queries
          │
          ▼
    ArXiv Retriever
          │
          ▼
   Retrieved Literature
          │
          ▼
     Quality Critic
          │
       ┌──┴──┐
       │     │
      No    Yes
       │     │
       ▼     ▼
 Refine     Synthesizer
  Query       Agent
       │       │
       └───┐   │
           └───┘
             │
             ▼
   Structured Literature Review
```

---

## Key Features

- **Multi-Agent Orchestration** — Cyclic agent workflow built with LangGraph, including conditional routing and iterative refinement.
- **Real-Time Token & Event Streaming** — Server-Sent Events (SSE) stream agent lifecycle events and LLM token chunks to the frontend.
- **Interactive Reasoning Drawer** — Intermediate workflow information such as generated queries, paper counts, and critic evaluations is displayed separately from the final report.
- **Unified Deployment** — A multi-stage Docker container builds the React frontend and serves the resulting static assets alongside the FastAPI backend.
- **GitHub-Flavored Markdown Rendering** — Generated literature reviews support structured Markdown, including tables and comparative literature summaries.
- **Iterative Query Refinement** — The critic can trigger another retrieval cycle when the retrieved literature does not provide sufficient coverage.

---

## Tech Stack

| Layer | Technology | Primary Role |
| :--- | :--- | :--- |
| **Frontend** | ![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB) ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) | UI components, state management, and SSE consumption |
| **Orchestration** | ![LangGraph](https://img.shields.io/badge/LangGraph-1C3C3C?logo=langchain&logoColor=white) ![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?logo=langchain&logoColor=white) | Stateful graph execution, conditional routing, and cyclic workflows |
| **LLM Inference** | ![Groq](https://img.shields.io/badge/Groq-F55036?logo=groq&logoColor=white) `openai/gpt-oss-120b` | Planning, evaluation, and literature synthesis |
| **Data Provider** | ![ArXiv](https://img.shields.io/badge/ArXiv-B31B1B?logo=arxiv&logoColor=white) `arxiv` Python SDK | Academic paper metadata and abstract retrieval |
| **Backend** | ![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white) ![Uvicorn](https://img.shields.io/badge/Uvicorn-499848?logo=uvicorn&logoColor=white) ![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white) | API endpoints and Server-Sent Event streaming |
| **Containerization** | ![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white) | Multi-stage frontend build and unified application deployment |

---

## Project Structure

```text
.
├── agent_graph.py            # LangGraph pipeline definition and node handlers
├── app.py                    # Production application entry point
├── main.py                   # FastAPI server, SSE streaming, and static file routing
├── requirements.txt          # Python dependencies
├── Dockerfile                # Multi-stage Docker build configuration
├── .dockerignore             # Docker build exclusions
├── .env             # Environment variable template
│
└── frontend/                 # React SPA
    ├── src/
    │   ├── components/       # Research canvas, reasoning drawer, and UI components
    │   ├── hooks/            # Custom hooks including SSE stream handling
    │   ├── App.tsx           # Main application shell
    │   └── main.tsx          # React application entry point
    │
    ├── package.json          # Node.js dependencies and scripts
    └── vite.config.ts        # Vite configuration and proxy rules
```

---

## Installation & Local Setup

### Prerequisites

[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-required-CB3837?logo=npm&logoColor=white)](https://www.npmjs.com/)
[![Docker](https://img.shields.io/badge/Docker-optional-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Groq API](https://img.shields.io/badge/Groq-API%20Key-F55036)](https://console.groq.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/academic-rag-agent.git
cd academic-rag-agent
```

### 2. Set Up the Python Environment

```bash
python -m venv venv
```

Activate the virtual environment:

**Linux / macOS**

```bash
source venv/bin/activate
```

**Windows**

```powershell
venv\Scripts\activate
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
PORT=8000
```

> **Security:** Never commit your `.env` file or API credentials to version control.

### 5. Run the Application Locally

Start the FastAPI backend:

```bash
uvicorn main:app --reload --port 8000
```

In a second terminal, start the React development server:

```bash
cd frontend
npm run dev
```

The development frontend will be available at:

```text
http://localhost:5173
```

---

## Environment Variables

| Variable | Required | Description |
| :--- | :---: | :--- |
| `GROQ_API_KEY` | **Yes** | API key used for Llama 3.3 inference through Groq |
| `PORT` | No | Port used by the FastAPI server. Defaults to `8000` locally |

---

## Running with Docker

The project can be built as a single Docker image containing both the compiled React frontend and FastAPI backend.

### Build the Image

```bash
docker build -t academic-rag-agent .
```

### Run the Container

```bash
docker run -d \
  --name academic-rag-agent \
  -p 8000:8000 \
  -e GROQ_API_KEY="your_actual_groq_api_key" \
  academic-rag-agent
```

The unified application will then be available at:

```text
http://localhost:8000
```

---

## Design Decisions

### LangGraph State Machine

A simple linear chain is insufficient for an iterative literature-search workflow. LangGraph provides conditional routing and cyclic execution, allowing the system to return to retrieval when the critic determines that the current literature coverage is inadequate.

### Single-Container Architecture

The frontend and backend are packaged into a single Docker image. The React application is compiled during the Docker build process and served as static assets through FastAPI.

This simplifies deployment and avoids the need for separate frontend and backend hosting or additional CORS configuration.

### In-Memory State

The workflow uses LangGraph's `MemorySaver` for session state rather than an external datastore such as Redis.

This keeps the architecture lightweight and avoids introducing an additional infrastructure dependency for temporary research sessions.

### Decoupled Event Streaming

The backend exposes structured SSE events such as:

```text
status
node_start
node_end
token
error
```

This allows the frontend to distinguish between:

- Agent execution events
- Intermediate research information
- Generated LLM tokens
- Errors

Generated tokens can be streamed directly into the Markdown report while intermediate workflow information is displayed separately in the reasoning drawer.

---

## Example Workflow

A research query such as:

```text
How are vision transformers being used for medical image segmentation?
```

may pass through the following workflow:

```text
User Query
    │
    ▼
Planner
    │
    ├── "vision transformers medical image segmentation"
    ├── "ViT medical image segmentation"
    └── "transformer-based medical segmentation"
    │
    ▼
ArXiv Retriever
    │
    ▼
Relevant Papers
    │
    ▼
Quality Critic
    │
    ├── Insufficient coverage ──► Refine Queries ──► Retrieve Again
    │
    └── Sufficient coverage
                │
                ▼
           Synthesizer
                │
                ▼
      Structured Literature Review
```

---

## Limitations

- **ArXiv Repository Scope** — Retrieval is currently focused on papers indexed by ArXiv and therefore does not represent the complete academic literature available through other scholarly databases.
- **API Rate Limits** — Inference depends on the available Groq API quota and rate limits.
- **Session Persistence** — Workflow state is stored in memory and is lost when the server restarts.
- **Retrieval Quality** — Search quality depends on the generated queries and the metadata/abstract information returned by ArXiv.
- **LLM Reliability** — Agent planning, evaluation, and synthesis are dependent on the underlying language model and may produce incorrect or incomplete interpretations.

---

## Future Improvements

Potential directions for extending the system include:

- [ ] Support for additional academic databases such as Semantic Scholar and Crossref
- [ ] PDF retrieval and full-text paper analysis
- [ ] Persistent research sessions
- [ ] Citation graph exploration
- [ ] Paper deduplication and ranking
- [ ] Improved evaluation benchmarks for retrieval quality
- [ ] User-configurable search depth and refinement thresholds
- [ ] Export generated reviews to PDF or DOCX
- [ ] Authentication and multi-user sessions

---

## License

This project is licensed under the [MIT License](https://github.com/your-username/academic-rag-agent/blob/main/LICENSE).


## 👨‍💻 Author

**Shajid Islam Chowdhury**  

[![GitHub](https://img.shields.io/badge/GitHub-shajidislamc-181717?logo=github&logoColor=white)](https://github.com/shajidislamc)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Shajid%20Islam%20Chowdhury-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/shajid-islam-chowdhury-2b54a8239/)