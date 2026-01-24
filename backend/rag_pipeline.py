# rag_pipeline.py
from embed_store import get_model, create_embeddings
from retrieve import cosine_similarity
from chunker import chunk_text
import os

# Pre-compute everything once when the module is imported (i.e. on cold start)
print("Pre-loading documents and computing embeddings...")

docs = {}
folder = "data"
for file in os.listdir(folder):
    path = os.path.join(folder, file)
    if os.path.isfile(path):
        with open(path, "r", encoding="utf-8") as f:
            docs[file] = f.read()

all_chunks = []
chunk_metadata = []

for filename, text in docs.items():
    chunks = chunk_text(text, chunk_size=500, overlap=100)  # reasonable defaults
    for idx, chunk in enumerate(chunks):
        all_chunks.append(chunk)
        chunk_metadata.append({
            "file": filename,
            "chunk_id": idx,
            "text": chunk
        })

# Pre-compute chunk embeddings ONCE
model = get_model()
chunk_embeddings = create_embeddings(all_chunks)

print(f"Pre-loaded {len(docs)} documents, {len(all_chunks)} chunks")

def run_rag_debug(query: str, top_k: int = 5):
    query_embedding = model.encode(query)

    similarity_data = []
    for i, emb in enumerate(chunk_embeddings):
        score = cosine_similarity(query_embedding, emb)
        similarity_data.append({
            "chunk_id": chunk_metadata[i]["chunk_id"],
            "file": chunk_metadata[i]["file"],
            "text": chunk_metadata[i]["text"],
            "score": float(score),
        })

    similarity_data.sort(key=lambda x: x["score"], reverse=True)
    top_results = similarity_data[:top_k]

    return {
        "documents": docs,
        "chunks": chunk_metadata,
        "similarity_data": similarity_data,
        "top_k_results": top_results,
        "final_context": "\n\n".join(item["text"] for item in top_results)
    }