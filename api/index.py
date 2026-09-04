import os, sys

# Add backend directory to sys.path
_backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

# Import the FastAPI app instance from backend/index.py
from index import app
