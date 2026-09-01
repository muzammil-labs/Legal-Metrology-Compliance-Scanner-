# SIH26034 Project Guidelines & Standards

## System Architecture & Integration Contract
- Backend: FastAPI (Python 3.11+), Pydantic V2 schemas (`schemas.py`), SQLite (`inspections.db`), ReportLab PDF.
- Frontend: Vite + React 18, Tailwind CSS (Awwwards dark mode), Lucide-React, Axios.
- Network / Proxy Integration: Vite dev server proxies `/api` requests to `http://127.0.0.1:8000`. FastAPI maintains permissive `CORSMiddleware` (`allow_origins=["*"]`).
- Multimodal Vision Runtime: Google GenAI SDK (`gemini-2.5-flash`) via structured JSON schema.

## Tri-Engine Territorial Division (Strict Multi-Agent Governance)
1. Backend Realm (`/backend`): Managed via Antigravity CLI in the central terminal.
2. Frontend Realm (`/frontend`): Built & styled via Google Antigravity in local editors.
3. Architecture & Pitch: Generated via Antigravity.
4. Zero External Stitch: Build natively inside the Vite dev server with instant HMR feedback.

## Core Non-Negotiables & Demo Resilience
1. Locked Schema Contract: Backend and Frontend must strictly follow the Pydantic V2 response contract in `schemas.py`.
2. Zero Legal Hallucination: The vision model extracts raw OCR strings & box coordinates ONLY. Deterministic Python regexes evaluate Rule 6(1) and Rule 6(11) compliance.
3. Demo Resilience & Circuit Breaker: Frontend maintains a strict 4.5s circuit breaker falling back to pre-cached control vectors on network stalls.
4. Demo Fixture Switch: UI must include a discrete 1-click fallback toggle between "Live Camera" and "Demo Fixtures" (Product 1 Pass, Product 2 Tax Fail, Product 3 USP Fail).
5. Native Camera: Use `<input type="file" accept="image/*" capture="environment">`.
6. Clean Build Rule: Run `npm run build` and `pytest tests/` every 4 hours.

## Dev Commands
- Frontend: `cd frontend && npm run dev`
- Backend: `cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000`

## File Boundary Rules
Only modify files within these scopes:
- **Backend changes** → `/backend/**` only
- **Frontend changes** → `/frontend/**` only
- **Config / docs** → Root-level `.md`, `.json`, `.cursorrules` files
- **Do NOT modify** → `.claude/`, `.git/`, `inspections.db`, `node_modules/`
