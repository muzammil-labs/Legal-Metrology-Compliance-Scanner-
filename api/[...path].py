import sys
import os
import traceback

# Ensure both the project root and backend/ are on sys.path
# so that bare imports like `from database import ...` resolve correctly
_this_dir = os.path.dirname(os.path.abspath(__file__))
_root_dir = os.path.abspath(os.path.join(_this_dir, ".."))
_backend_dir = os.path.abspath(os.path.join(_this_dir, "..", "backend"))

for _p in [_backend_dir, _root_dir]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from main import app
except Exception as _import_err:
    # Surface the import error as a proper HTTP 500 with detail
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    _err_detail = traceback.format_exc()
    app = FastAPI()

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
    async def _startup_error(path: str = ""):
        return JSONResponse(
            status_code=500,
            content={"detail": f"Backend failed to start: {_err_detail}"}
        )

# Vercel requires the ASGI app to be named 'app' at the module top level
__all__ = ["app"]
