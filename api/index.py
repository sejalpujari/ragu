# api/index.py
import sys
sys.path.append("./backend")   # or wherever your FastAPI code lives

from backend.main import app  # assuming you renamed api.py → main.py and it has `app = FastAPI(...)`

# Vercel serverless handler
# No extra code needed — Vercel uses this file as entrypoint