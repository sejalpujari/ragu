# api.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rag_pipeline import run_rag_debug
from llm import generate_answer
import uvicorn

app = FastAPI(title="Explainable RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # update later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RAGRequest(BaseModel):
    query: str
    chunk_size: int = 120
    chunk_overlap: int = 30
    top_k: int = 5
    generate: bool = False           # whether to call LLM

class RAGDebugResponse(BaseModel):
    documents: dict
    chunks: list
    chunk_embeddings_preview: list       # only first 10 dims
    query_embedding_preview: list
    similarity_data: list
    top_k_chunks: list
    final_context: str | None = None
    answer: str | None = None

@app.post("/rag/debug", response_model=RAGDebugResponse)
async def rag_debug(req: RAGRequest):
    try:
        data = run_rag_debug(
            query=req.query,
            chunk_size=req.chunk_size,
            chunk_overlap=req.chunk_overlap,
        )

        # Prepare preview data (avoid sending huge arrays)
        chunk_emb_preview = [emb[:10].tolist() for emb in data["chunk_embeddings"]]
        query_emb_preview = data["query_embedding"][:10].tolist()

        top_k_items = data["similarity_data"][:req.top_k]
        top_k_chunks = [
            {
                "file": item["file"],
                "chunk_id": item["chunk_id"],
                "text": item["text"],
                "score": round(item["score"], 4)
            }
            for item in top_k_items
        ]

        final_context = None
        answer = None

        if req.generate:
            final_context = "\n\n".join(item["text"] for item in top_k_items)
            answer = generate_answer(req.query, final_context)

        return {
            "documents": data["documents"],
            "chunks": data["chunks"],
            "chunk_embeddings_preview": chunk_emb_preview,
            "query_embedding_preview": query_emb_preview,
            "similarity_data": [
                {
                    "file": s["file"],
                    "chunk_id": s["chunk_id"],
                    "text": s["text"],
                    "score": round(s["score"], 4)
                } for s in data["similarity_data"]
            ],
            "top_k_chunks": top_k_chunks,
            "final_context": final_context,
            "answer": answer,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)