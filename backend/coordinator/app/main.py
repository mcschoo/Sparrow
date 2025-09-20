from fastapi import FastAPI

app = FastAPI(title="RAG Coordinator")

@app.get("/healthz")
async def health():
    return {"status": "ok", "service": "coordinator"}

