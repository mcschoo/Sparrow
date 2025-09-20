from fastapi import FastAPI

app = FastAPI(title="RAG Platform API")

@app.get("/healthz")
async def health():
    return {"status": "ok", "service": "api"}

