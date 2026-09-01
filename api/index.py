import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, ".."))
backend_dir = os.path.abspath(os.path.join(parent_dir, "backend"))

for path in [backend_dir, parent_dir, current_dir]:
    if path not in sys.path:
        sys.path.insert(0, path)

try:
    from backend.main import app
except ImportError:
    from main import app
