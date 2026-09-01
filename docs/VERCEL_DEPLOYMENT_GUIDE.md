# 🚀 Vercel Cloud Deployment Guide — SIH26034 (PakkaLabel India)

This guide provides step-by-step instructions to deploy the full-stack Legal Metrology Compliance Scanner to **Vercel** with unified frontend and serverless Python backend routing.

---

## 🏗️ Architecture on Vercel

```
                                  ┌──────────────────────────────┐
                                  │   Vercel Edge Network (CDN)  │
                                  └──────────────┬───────────────┘
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        │                                                 │
          ┌─────────────▼─────────────┐                     ┌─────────────▼─────────────┐
          │  /api/*, /health          │                     │  /* (SPA Static Routing)  │
          │  @vercel/python Serverless │                     │  @vercel/static-build     │
          │  (backend/main.py)        │                     │  (Vite + React 18 Dist)   │
          └───────────────────────────┘                     └───────────────────────────┘
```

- **Frontend:** Vite + React 18 compiled into static bundle (`dist/`).
- **Backend:** FastAPI (Python 3.12/3.11) running as serverless function handlers with permissive CORS.
- **Routing:** Orchestrated via `vercel.json` dual-build and rewrite configuration.

---

## 🛠️ Method 1: Deploy via Vercel CLI (Recommended)

### 1. Prerequisites
Ensure the Vercel CLI is installed globally:
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy to Preview
From the root of the repository:
```bash
vercel
```
Follow the interactive prompts:
- **Set up and deploy?**: `Y`
- **Which scope?**: Select your team/account
- **Link to existing project?**: `N`
- **Project name**: `pakkalabel-india` (or your preferred name)
- **Directory located?**: `./` (Root)

### 4. Deploy to Production
```bash
vercel --prod
```

---

## 🌐 Method 2: Deploy via Vercel Web Dashboard

1. **Push your code to GitHub:**
   ```bash
   git push origin main
   ```
2. **Go to [Vercel Dashboard](https://vercel.com/dashboard)** and click **"Add New..."** > **"Project"**.
3. **Import Git Repository:** Select `muzammil-labs/Legal-Metrology-Compliance-Scanner-`.
4. **Project Settings:**
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Build Command:** Vercel automatically detects `vercel.json` configuration.
5. **Environment Variables (Optional):**
   - `GEMINI_API_KEY`: *(Optional for live multimodal OCR tokens)*
   - `JWT_SECRET_KEY`: *(Optional for production authentication)*
6. Click **"Deploy"**.

---

## 🔒 Environment & CORS Verification

- **CORS Middleware:** `backend/main.py` is pre-configured with `allow_origins=["*"]`, enabling any Vercel preview domain (`*.vercel.app`) or custom domain (`pakkalabel.gov.in`) to communicate without cross-origin blocks.
- **API Base URL:** `frontend/src/services/api.js` dynamically uses relative `/api` paths when hosted on Vercel, routing directly to the serverless function.

---

## 🧪 Post-Deployment Health Check

After deployment, verify that both frontend and backend are operational:

1. **Health Check:** `https://<your-vercel-domain>.vercel.app/health` → `{"status": "ok", ...}`
2. **API Scan:** `https://<your-vercel-domain>.vercel.app/api/analytics/summary` → Returns compliance summary JSON.
3. **Frontend UI:** `https://<your-vercel-domain>.vercel.app/` → Renders full dark-mode application with 1-click demo fixtures.
