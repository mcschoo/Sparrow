# Sparrow RAG Platform - System Design

## Tech Stack

### Core Services
- **API Gateway**: FastAPI (Python 3.11) - JWT validation, rate limiting, request routing
- **Coordinator**: FastAPI - Multi-agent consensus, RAG fusion, agent selection
- **Frontend**: Next.js 14 + TypeScript + Tailwind + shadcn/ui

### Data Layer
- **PostgreSQL 15**: Users, workspaces, agents, audit logs, RLS per workspace
- **Qdrant**: Vector store, separate collections per workspace
- **Elasticsearch 8**: BM25 hybrid search, separate indices per workspace
- **Redis 7**: Chat history, rate limiting, job queues

### ML/RAG Pipeline
- **LlamaIndex**: Orchestration, RAG fusion with RRF
- **Embedders**: Multiple configurable (OpenAI, Sentence-Transformers, etc)
- **Chunking**: Semantic-aware with Parent Document Retrieval (PDR)
- **Ingestion**: unstructured.io for PDF/DOCX/XLSX/PPTX/MD/code parsing

### Infrastructure
- **Auth**: Keycloak (OIDC/JWT, RBAC: admin|manager|member)
- **Secrets**: Vault for API keys (never plaintext in DB)
- **Telemetry**: OpenTelemetry → Prometheus → Grafana
- **Containers**: Docker Compose (dev) → Kubernetes/Helm (prod)
- **Environment**: WSL2 Ubuntu (dev)

## Critical Decisions & Security

### Multi-Agent Consensus Mechanism
- **3-agent semantic agreement** replaces naive "overlap" approach
- Claim extraction → embedding similarity → confidence scoring (HIGH/MEDIUM/LOW)
- Graceful degradation: 3 agents (consensus) → 2 agents (compare) → 1 agent (standard RAG)
- Agent selection via tags + performance history + query analysis

### Security Requirements
- **Workspace isolation enforced at DB level**: Postgres RLS, separate Qdrant collections, separate ES indices
- **Agent code sandboxing**: User-uploaded tools run in gVisor/Firecracker containers
- **API key encryption**: Vault or PostgreSQL pgcrypto for cloud model keys
- **Rate limiting**: Per-workspace quotas on ingestion and consensus queries
- **Audit logging**: All queries, agent decisions, data access tracked

### RAG Architecture
- **Retrieval**: Hybrid keyword/semantic with configurable ratio (ES + Qdrant)
- **RAG Fusion**: Multiple query rewrites → parallel retrieval → RRF scoring
- **Parent Document Retrieval**: Chunks maintain parent context for coherence
- **Quality over speed**: Semantic chunking preserves meaning

### Admin Controls
- Register agents via Docker ports or OpenAI-compatible APIs
- Configure agent tags for routing (generalist, technical, medical, etc)
- Upload documents to workspace-specific vector stores
- View Prometheus metrics in embedded Grafana dashboard

### Data Flow
1. User query → API (JWT/workspace validation) → Coordinator
2. Coordinator: Select 3 agents (tags/performance) → parallel RAG retrieval → generate responses
3. Consensus: Extract claims → align semantically → score confidence → synthesize answer
4. Response includes confidence indicators + citations + parent document context

## Workflow Diagrams

### High Level System Arch

┌──────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                   │
│  ┌──────────┬──────────┬───────────┬──────────┬───────────┐  │
│  │   Chat   │  Admin   │  Agent    │ Metrics  │ Workspace │  │
│  │    UI    │   Panel  │  Library  │   Tab    │  Manager  │  │
│  └──────────┴──────────┴───────────┴──────────┴───────────┘  │
└─────────────────────────────┬────────────────────────────────┘
                              │ JWT + RBAC
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                      KEYCLOAK (Auth/IAM)                     │
│                   Users → Workspaces → Roles                 │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                      API GATEWAY (FastAPI)                   │
│  • Request validation                                        │
│  • Workspace context injection                               │
│  • Rate limiting (Redis)                                     │
│  • Audit logging → PostgreSQL                                │
└─────────────────────────────┬────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    COORDINATOR SERVICE                       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  QUERY PROCESSING                       │ │
│  │  1. Agent Selection (pseudo-tags → top 3)               │ │
│  │  2. RAG Pipeline Execution                              │ │
│  │  3. Multi-agent dispatch                                │ │
│  │  4. Consensus/overlap detection                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                              │                               │
│  ┌────────────────┬──────────┴────────┬────────────────────┐ │
│  ▼                ▼                   ▼                    ▼ │
│ ┌──────────┐ ┌──────────┐ ┌────────────────┐ ┌──────────┐    │
│ │   RAG    │ │  Agent   │ │    Document    │ │ Workflow │    │
│ │  Fusion  │ │ Registry │ │   Ingestion    │ │  Engine  │    │
│ └──────────┘ └──────────┘ └────────────────┘ └──────────┘    │
└──────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   PostgreSQL │    │    Qdrant    │    │Elasticsearch │
│              │    │              │    │              │
│ • Users      │    │ • Vectors    │    │ • BM25       │
│ • Workspaces │    │ • Per WS     │    │ • Hybrid     │
│ • Agents     │    │   collections│    │ • Per WS     │
│ • Tools      │    │ • PDR parent │    │   indices    │
│ • Audit logs │    │   metadata   │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
                              │
                              ▼
                    ┌──────────────┐
                    │    Redis     │
                    │              │
                    │ • Chat cache │
                    │ • Rate limit │
                    │ • Job queues │
                    └──────────────┘
                              │
                              ▼
            ┌─────────────────────────────────┐
            │         AGENT RUNTIME           │
            │  ┌─────────┐    ┌─────────┐     │
            │  │ Docker  │    │  Cloud  │     │
            │  │ Models  │    │  APIs   │     │
            │  └─────────┘    └─────────┘     │
            └─────────────────────────────────┘

### Multi-Agent Consensus

┌─────────────────────────────────────────────────────────────┐
│                      COORDINATOR SERVICE                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               CONSENSUS ORCHESTRATOR                 │   │
│  │                                                      │   │
│  │  1. Router: Determine agent count & strategy         │   │
│  │  2. Dispatcher: Parallel agent execution             │   │
│  │  3. Analyzer: Claim extraction & alignment           │   │
│  │  4. Synthesizer: Build unified response              │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                │
│         ┌──────────────────┼──────────────────┐             │
│         ▼                  ▼                  ▼             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐        │
│  │   Agent 1   │   │   Agent 2   │   │   Agent 3   │        │
│  │             │   │             │   │             │        │
│  │ • Retrieve  │   │ • Retrieve  │   │ • Retrieve  │        │
│  │ • Generate  │   │ • Generate  │   │ • Generate  │        │
│  │ • Citations │   │ • Citations │   │ • Citations │        │
│  └─────────────┘   └─────────────┘   └─────────────┘        │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            ▼                                │
│                  ┌──────────────────┐                       │
│                  │  Claim Alignment │                       │
│                  │     Matrix       │                       │
│                  └──────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
