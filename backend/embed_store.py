# embed_store.py
from sentence_transformers import SentenceTransformer
import numpy as np

_model = None

def get_model():
    """Lazy-load the model only when first needed (on actual request, not build time)"""
    global _model
    if _model is None:
        print("Loading embedding model for the first time... (this may take a few seconds)")
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model

def create_embeddings(chunks):
    model = get_model()
    # Optional: add batch_size for better performance on larger chunk lists
    embeddings = model.encode(chunks, batch_size=32, show_progress_bar=False)
    return np.array(embeddings)