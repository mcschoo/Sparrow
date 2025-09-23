from typing import Any

from fastapi import FastAPI
from rag_shared import health_message

app = FastAPI(title="RAG Platform Coordinator")


@app.get("/healthz")
async def health():
    return health_message("coordinator")


@app.post("/dispatch")
async def dispatch(payload: dict[str, Any]):
    return payload
