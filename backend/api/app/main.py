from fastapi import FastAPI
from rag_shared import health_message

app = FastAPI(title="RAG Platform API")


@app.get("/healthz")
async def health():
    return health_message("api")
