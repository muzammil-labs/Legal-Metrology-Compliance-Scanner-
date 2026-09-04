import sys
import os

# Ensure both the project root and backend/ are on sys.path
_this_dir = os.path.dirname(os.path.abspath(__file__))
_root_dir = os.path.abspath(os.path.join(_this_dir, ".."))
_backend_dir = os.path.abspath(os.path.join(_this_dir, "..", "backend"))

sys.path.insert(0, _backend_dir)
sys.path.insert(0, _root_dir)

# Vercel's AST parser explicitly looks for top-level imports of 'app'
from main import app
