import os
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from rag_shared import health_message

app = FastAPI(title="RAG Platform API")

default_origins = "http://localhost:3010"
allowed_origins_env = os.getenv("API_ALLOWED_ORIGINS", default_origins)
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

COORDINATOR_BASE_URL = os.getenv("COORDINATOR_BASE_URL", "http://coordinator:8011")


@app.get("/healthz")
async def health():
    return health_message("api")


@app.post("/dispatch")
async def dispatch(payload: dict[str, Any]):
    async with httpx.AsyncClient(base_url=COORDINATOR_BASE_URL, timeout=5.0) as client:
        try:
            response = await client.post("/dispatch", json=payload)
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=502, detail=f"Coordinator dispatch failed: {exc}"
            ) from exc

    return response.json()
