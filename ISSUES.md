# Known Issues & Next Steps

## 1. Vercel Backend Deployment (FastAPI)
The backend FastAPI application is failing to invoke on Vercel, resulting in a `500 Internal Server Error: FUNCTION_INVOCATION_FAILED`. 
This indicates that the Python process crashes during the initialization phase (module import) before it can handle any HTTP requests. 

### What We Did
- Verified the Vercel routing configuration (`vercel.json`) is correctly mapping `/api/*` to `api/index.py`.
- Reverted the zero-config `[...path].py` setup which was causing the Vercel builder to silently fail.
- Removed non-portable C-extension dependencies (`bcrypt`, `qrcode[pil]`, `pytest` tools) from `api/requirements.txt` to prevent Amazon Linux build compilation failures.
- Mocked the `qrcode` generation in `pdf_generator.py` to prevent import errors.
- Applied `sys.path.insert` in `api/index.py` to ensure relative module imports like `from services...` work properly when deployed.

### Remaining Issue
Despite the above fixes, Vercel continues to throw `FUNCTION_INVOCATION_FAILED`. Because this is a serverless runtime crash (not a build crash), the exact Python traceback is hidden in the Vercel project logs (which require Vercel dashboard access to view).

### Next Steps for the User
1. **Check Vercel Logs:** Log in to the Vercel dashboard for the `legal-metrology-compliance-scanner` project. Go to the "Logs" tab and filter by "Functions" or "Errors". Look for the Python traceback associated with the `FUNCTION_INVOCATION_FAILED` error. This will show exactly which line in `api/index.py` or its dependencies is causing the crash.
2. **Missing Dependencies:** It is highly likely there is a minor import mismatch (e.g., a file trying to import something that doesn't exist, or a path issue) that is crashing the module load. The logs will pinpoint this instantly.

## 2. Frontend Features (360 Video & Add Another Side)
The UI components for these features exist but are currently non-functional because they rely on the `/api/scan` endpoint, which is down due to the aforementioned Vercel issue.

### Next Steps
1. Once the backend import error is resolved via the Vercel logs, the API will come online.
2. The frontend integration should automatically resume working or can be debugged locally once the backend is stable.
