# PakkaLabel India — Vercel Deployment Guide

This document outlines the required environment configurations to ensure a successful production deployment on Vercel.

## Environment Variables

You must configure the following environment variables in your Vercel Dashboard to ensure the API functions correctly.

**Vercel Dashboard Path:**  
`Your Project -> Settings -> Environment Variables`

| Variable Name | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes* | The Google Gemini API key required for live product label OCR and compliance verification. |
| `DEMO_MODE` | No | Set to `"true"` to enable a fully mocked demonstration mode. This is useful for hackathons or presentations if you do not have a Gemini API key. |
| `B2B_API_KEY` | No | An optional custom API key used to authenticate external systems against the `/api/v1/pre-audit` endpoint. |

> [!WARNING]  
> **CRITICAL:** If `DEMO_MODE` is `"false"` (or unset) and you fail to provide a valid `GEMINI_API_KEY`, **all scans will return a 500 Internal Server Error** because the backend will be unable to process the live image data.

## Deployment Steps

If you are deploying updates to Vercel via the Vercel CLI or Git integration, follow this push order:

1. Stage all changes: `git add .`
2. Commit your deployment configs: `git commit -m "chore: setup vercel deployment configs"`
3. Push to your main branch: `git push origin main`

Vercel will automatically trigger a deployment. The frontend will build via the `npm run build` script defined in `vercel.json`, outputting to `frontend/dist`. Simultaneously, Vercel will install the Python dependencies listed in `backend/requirements.txt` and serve the backend from `api/index.py`.
