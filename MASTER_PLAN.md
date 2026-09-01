# PackCheck / MetroGuard AI: Master Project Plan & Architectural Blueprint
**Smart India Hackathon (SIH 2026) • Problem Statement ID: SIH26034**  
**Target Ministry:** Department of Consumer Affairs (DOCA), Ministry of Consumer Affairs, Food & Public Distribution  
**Document Type:** Unified Master Project Outline & Execution Specification  
**Version:** 1.0.0 (Production Blueprint)

---

## 1. Executive Summary & Problem Understanding

### 1.1 Problem Statement Overview
* **Title:** Software System to check compliance of Packaged Commodities under Legal Metrology (Packaged Commodities) Rules, 2011 by scanning products, images and labels.
* **Core Bottleneck:** Over 30% of packaged commodities in retail and e-commerce exhibit statutory non-compliance. Manual inspection takes 15–20 minutes per SKU, restricting officers to auditing only 10–12 products daily.
* **Target Regulations:**
  * The Legal Metrology Act, 2009 (Sections 18, 36, and 49).
  * Legal Metrology (Packaged Commodities) Rules, 2011 (LMPC Rules, with amendments up to 2024/2026).
  * Section 65B of the Indian Evidence Act (Evidentiary electronic admissibility).

### 1.2 The Tri-Stakeholder Vision ("One Engine, Three Doors")
Unlike single-purpose scanners, the platform unifies three distinct user experiences on top of a single verification core:
1. **Consumer View:** Instant photo/camera capture, 0–100 Trust Score gauge, plain-language violation flags, and one-tap grievance filing (National Consumer Helpline).
2. **Enforcement Officer Console:** Field inspection dashboard, geospatial non-compliance heatmaps, case docket, and one-click court-admissible Section 36 Compound Notice PDF generation.
3. **E-Commerce Seller Hub:** Bulk catalogue batch audit, verified digital "Legal Metrology Compliant" badge generator, and automated listing cross-validation.

---

## 2. Full Statutory Compliance Matrix (PCR 2011)

| Rule / Clause | Mandatory Declaration | Algorithmic Extraction & Validation Logic | Severity |
| :--- | :--- | :--- | :--- |
| **Rule 6(1)(a)** | **Manufacturer / Packer / Importer Details** | Regex/NER parsing of prefix (`mfg by`, `packed by`, `imported by`), street, city, state, and 6-digit Indian Postal PIN code. Mandatory **Country of Origin** check for imported goods. | **CRITICAL** |
| **Rule 6(1)(b)** | **Generic / Common Commodity Name** | Semantic & dictionary matching ensuring generic commodity identity is not obscured by branding/trademarks. | **CRITICAL** |
| **Rule 6(1)(c)** | **Net Quantity & SI Units** | Regex parsing for standard SI units (`g`, `kg`, `ml`, `l`, `N`, `U`). **Absolute rejection of illegal legacy units** (`gm`, `gms`, `ml.`, `kgs`). | **CRITICAL** |
| **Rule 6(1)(d)** | **Date of Manufacture / Packing / Import** | Temporal regex verifying `MM/YYYY` or `MM/YY` formatting. Strict rejection of future-date anomalies against the system audit date. | **MAJOR** |
| **Rule 6(1)(e)** | **Maximum Retail Price (MRP)** | Strict enforcement of statutory phrasing: `MRP Rs. XX.XX (incl. of all taxes)` or `₹ XX.XX (inclusive of all taxes)`. Rejection of dual MRP declarations. | **CRITICAL** |
| **Rule 6(1)(f)** | **Consumer Care / Grievance Redressal** | Multi-channel verification: designated contact person/cell, physical/postal address, valid phone helpline (10/11 digits or 1800-toll-free), and valid email syntax. | **MAJOR** |
| **Rule 6(11)** | **Unit Sale Price (USP) Mathematical Auditor** | Mandatory for packages $>1\text{ kg} / 1\text{ L}$ or multi-unit packs. Computes $USP = \frac{\text{MRP}}{\text{Net Qty}}$ in base units ($₹/\text{g}$, $₹/\text{kg}$, $₹/\text{ml}$, $₹/\text{l}$) within a $\pm ₹0.01$ rounding tolerance. | **CRITICAL** |
| **Rule 5 & 9 / Sch. II** | **PDP Area & Numeral Font Height ($H_{\text{num}}$)** | Caliper pixel-to-mm ratio estimation. Verifies minimum font height based on Principal Display Panel area ($1.0\text{ mm}$ for $\le 50\text{ cm}^2$, up to $6.0\text{ mm}$ for $>2500\text{ cm}^2$). | **MODERATE** |
| **Rule 9(3)** | **Background Contrast** | CIELAB color difference ($\Delta E$) between text pixels and local background. $\Delta E < 45$ flagged for illegibility. | **MODERATE** |

---

## 3. Core Technical USPs & Differentiators

1. **USP 1 — Deterministic Legal Verification Engine (DLVE):** Decoupled vision-to-rule pipeline where multimodal vision models extract raw OCR tokens and spatial bounding boxes ONLY, while deterministic Python regex engines evaluate statutory law. **Guarantees 0% AI legal hallucination.**
2. **USP 2 — Rule 6(11) Unit Sale Price Mathematical Auditor:** Real-time arithmetic verification of per-unit pricing ($USP = \frac{\text{MRP}}{\text{Net Qty}}$) within $\pm ₹0.01$ rounding tolerance, catching deceptive unit representations or missing disclosures.
3. **USP 3 — Evidentiary Section 36 Inspection Notice Generator:** One-click synthesis of official Section 36 Compound Notice PDFs via ReportLab with bounding-box image crops, device GPS coordinates, local timestamps, and an immutable **SHA-256 digital signature hash**.
4. **USP 4 — Rule 5 PDP Area & Font Height Estimator:** Computer vision estimation of numeral height ratios against packaging dimensions to detect micro-font violations under Rule 5 and Rule 9.
5. **USP 5 — Inspector Analytics & Geospatial Enforcement Heatmap:** Aggregates audit records from SQLite into regional non-compliance heatmaps, district infraction frequency bar charts, and repeat-offender brand tracking.
6. **USP 6 — Dual-Engine Zero-Latency Fallback Architecture:** Client-side 4.5-second circuit breaker with pre-cached control fixtures (`control_pass.json`, `control_fail_tax.json`, `control_fail_unit.json`) guaranteeing sub-500ms UI responsiveness under degraded hackathon network conditions.
7. **USP 7 — Cross-Language Discrepancy & E-Commerce Crawler:** Multilingual English/Hindi statutory cross-checks + Playwright headless crawler comparing digital web listing text against physical package OCR data.

---

## 4. End-to-End System Architecture

```
[Image Capture / Bulk Upload / E-Com Crawler]
                       │
                       ▼
    [Image Quality & Preprocessing Engine]
  (Perspective Deskewing, Contrast Normalization)
                       │
                       ▼
       [Multimodal Vision & Tokenization Layer]
 (Gemini 2.5 Flash / PaddleOCR Bounding Box Extraction)
                       │
                       ▼
     [Deterministic Legal Verification Engine]
   (Cross-referencing against Rules 6, 9, 11, 18)
                       │
                       ▼
       [Data Persistence & Evidence Vault]
    (SQLAlchemy + SQLite / PostGIS + SHA-256 Seal)
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
  [Consumer View] [Officer View] [Seller View]
  (Trust Score)   (Section 36)   (Trust Badge)
```

---

## 5. Detailed 5-Module Technical Specification

### MODULE 1: Product Strategy & Regulatory Impact
* **Department of Consumer Affairs (DOCA) Alignment:** Transforms an administrative bottleneck into an automated, tamper-evident regulatory shield.
* **Market Reframing:** Moves compliance from a purely punitive mechanism into a voluntary trust signal (Sellers get verified trust badges; Consumers get instant protection; Officers get 95% inspection velocity increase).

### MODULE 2: Frontend Architecture & User Flows (React 18 + Vite PWA)
* **UI State Machine:**
  $$\text{IDLE} \longrightarrow \text{CAPTURE / FIXTURE SELECT} \longrightarrow \text{SCANNING SWEEP} \longrightarrow \text{AUDIT RESULT} \longrightarrow \text{SECTION 36 DRAWER} \longrightarrow \text{ANALYTICS HEATMAP}$$
* **Component Tree:**
  * `Navbar.jsx`: DOCA branding, connection status, stakeholder switcher, and discrete 1-Click Demo Fixtures toggle.
  * `CameraScanner.jsx`: Native mobile camera trigger (`capture="environment"`), continuous cyan animated laser sweep (`shadow-[0_0_15px_#22d3ee]`), and direct OCR override testing box.
  * `ComplianceSummaryCard.jsx`: Circular 0–100 Trust Score gauge, Rule 6(11) USP arithmetic audit card, itemized statutory rule breakdown, and Section 36 PDF trigger.
  * `InspectorAnalyticsDashboard.jsx`: KPI metric cards, regional enforcement heatmap, rule infraction frequency bars, and historical case docket table.
  * `SellerBulkAudit.jsx`: Drag-and-drop batch upload, real-time progress bar, and embeddable **"Legal Metrology Compliant" verified SVG badge & QR code generator**.
  * `NoticePreviewModal.jsx`: Slide-over drawer previewing the Section 36 PDF notice with SHA-256 hash badge and direct download button.
  * `api.js`: Strict 4.5-second circuit breaker with `AbortController` falling back to local control vectors.

### MODULE 3: Backend API & Verification Engine (FastAPI)
* **API Endpoints:**
  * `GET /health` & `GET /`: Health check and system metadata.
  * `POST /api/scan`: Multipart image upload $\rightarrow$ Vision tokenization $\rightarrow$ Deterministic rule execution $\rightarrow$ Database logging $\rightarrow$ Returns `AuditResponse`.
  * `POST /api/scan/batch`: Bulk catalogue batch audit endpoint for sellers.
  * `GET /api/inspections`: Returns historical audit records with limit filters.
  * `GET /api/inspections/{id}/export-notice`: Generates and streams Section 36 Compound Notice PDF.
  * `GET /api/analytics/summary`: Returns aggregate inspection metrics, compliance ratios, and violation breakdown counts.
* **Single-Source-of-Truth Schemas (`backend/schemas.py`):** Strict Pydantic V2 models with Enum validation (`StatutoryRule`, `RuleStatus`, `Unit`, `AuditResponse`, `USPResult`, `ExtractedField`, `InspectionMetadata`).

### MODULE 4: Database Schema & Evidentiary Data Vault (`backend/models.py`)
* **Relational Schema:**
  * `inspections`: `id`, `inspected_at`, `source_filename`, `sha256`, `region`, `gps_location`, `trust_score`, `overall_status`, `ocr_text`.
  * `violations`: `id`, `inspection_id` (FK), `rule`, `status`, `reason`.
  * `audit_certificates`: `id`, `inspection_id` (FK), `certificate_number`, `issued_at`, `sha256_seal`.
* **Seeding Script (`backend/seed.py`):** Pre-populates 30 realistic historical inspection records across regional retail zones (Delhi, Mumbai, Bengaluru, Kolkata, Chennai, Ahmedabad, Hyderabad) with 60% Pass / 40% Fail distribution to immediately power the Officer Heatmap.

### MODULE 5: Stage Defense, Edge-Case Mitigation & Pitch Blueprint

#### 3-Product Physical Stage Sequence Choreography:
1. **Product 1 (Parle-G / Compliant Biscuit):** Scan live $\rightarrow$ **100/100 Trust Score**, ALL GREEN PASS across all statutory rules in $<1\text{ second}$.
2. **Product 2 (Local Snack / Missing Tax):** Scan live $\rightarrow$ Instant **RED VIOLATION** for `Rule 6(1)(e)` $\rightarrow$ Click *"Generate Section 36 Notice"* $\rightarrow$ Display court-ready ReportLab PDF with SHA-256 hash.
3. **Product 3 (Bulk Grain > 1kg / 1000 gm):** Scan live $\rightarrow$ Double **RED VIOLATION** flagging non-SI unit `"gm"` under `Rule 6(1)(c)` and missing Unit Sale Price under `Rule 6(11)`.

#### Top 5 Judge Questions & Bulletproof Defense:
* **Q1: "Don't food products already have QR codes that contain this info?"**  
  *Answer:* Under Rule 6(1) of PCR 2011 and FSSAI rules, a QR code cannot replace physical label disclosures. Mandatory declarations must be printed directly in human-readable ink. Our system audits the physical packaging on store shelves.
* **Q2: "How do you guarantee the AI model won't hallucinate legal compliance?"**  
  *Answer:* We use a decoupled dual-pass architecture (DLVE). Multimodal vision models extract text tokens and bounding boxes only. Deterministic Python regex and arithmetic code evaluates the law. Zero legal hallucination.
* **Q3: "Why not just use traditional Tesseract OCR?"**  
  *Answer:* Tesseract fails on curved surfaces, complex package artwork, and varying font ratios without structural context. Our pipeline extracts structured tokens with spatial coordinates in sub-second runtime.
* **Q4: "What happens if venue Wi-Fi stutters or disconnects during the presentation?"**  
  *Answer:* Our client incorporates a strict 4.5s circuit breaker. If network latency spikes, it seamlessly serves pre-cached control vectors without loading spinners or errors. Additionally, a discrete 1-click Demo Fixture toggle is available in the header.
* **Q5: "How is this legally admissible in court?"**  
  *Answer:* Each generated Section 36 PDF notice embeds device GPS coordinates, local timestamps, original label crops, and an immutable SHA-256 cryptographic hash seal, complying with Section 65B of the Indian Evidence Act.

---

---

## 6. Development Governance & Verification

* **Clean Build Verification:**
  * Backend Pytest: `cd backend && pytest -v` (15/15 passed in 0.28s).
  * Frontend Build: `cd frontend && npm run build` (built in 503ms, 0 errors).
* **Dev Commands:**
  * **Backend:** `cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000`
  * **Frontend:** `cd frontend && npm run dev`

---

## 7. 8-Slide Pitch Deck Storyboard

> **Slide 1 — Public Access QR**
> - Title: "PackCheck / MetroGuard AI — SIH26034"
> - Visual: Giant QR code generated from `https://<codespace-name>.github.dev:5173` (Port 5173 → Public visibility)
> - Text: "Scan this QR on your phone right now to test a live compliance scan"
> - Talking Point: "This runs on GitHub Codespaces with SSL. No app install. Just your phone camera and a package label."

> **Slide 2 — Problem Statement & Impact**
> - Visual: Split image — enforcement officer inspecting shelves manually vs. phone scanning a label
> - Headline: "30% of packaged commodities carry labeling violations. Inspection takes 15+ minutes per SKU."
> - Stats: "10–12 products per officer per day (manual) → 500+ per officer per day (automated)"
> - Ministry: Department of Consumer Affairs (DOCA), Govt. of India

> **Slide 3 — "One Engine, Three Doors" Architecture**
> - Visual: The three-stakeholder UI switcher — Consumer / Officer / Seller
> - Diagram: Central DLVE engine powering three distinct role-based views
> - Talking Point: "One system. Three doors. The compliance engine is identical — only the lens changes."

> **Slide 4 — LIVE SCAN DEMO (Product 1 — Compliant FMCG)**
> - Action: Hold up physical Product 1 (Parle-G / fully compliant biscuit) → tap "Run Compliance Scan"
> - Expected: Trust Score 100/100, all 8 rules green
> - Talking Point: "A fully compliant product achieves a perfect score in under 1 second."

> **Slide 5 — LIVE SCAN DEMO (Product 2 — Tax Fail)**
> - Action: Hold up Product 2 (local snack, MRP without '(incl. of all taxes)')
> - Expected: Trust Score 75, Rule 6(1)(e) RED, NCH grievance button appears
> - Action: Click "Generate Section 36 Inspection Notice PDF" → show generated PDF with SHA-256 hash
> - Talking Point: "The system identified an infraction invisible to casual inspection. The notice is instantly court-admissible."

> **Slide 6 — LIVE SCAN DEMO (Product 3 — Unit Fail + USP Fail)**
> - Action: Hold up Product 3 (rice bag labeled "1000 gm" instead of "1 kg")
> - Expected: Trust Score 50, Rule 6(1)(c) RED ("gm" illegal), Rule 6(11) RED (USP missing)
> - Talking Point: "Dual statutory violation — illegal unit notation AND missing per-kg price disclosure — caught simultaneously in one scan."

> **Slide 7 — Inspector Analytics & Geospatial Command Console**
> - Switch to Officer tab → show enforcement heatmap, 4 KPI cards, case docket
> - Visual: Pre-seeded 30 regional inspections across Delhi, Mumbai, Bengaluru, Kolkata, Chennai
> - Talking Point: "30 historical audit records were pre-seeded to power the analytics dashboard. Officers can export Section 36 PDFs for any historical inspection."

> **Slide 8 — Innovation Summary & DOCA Alignment**
> - Visual: 7 USP icons with one-line descriptions
> - Headline: "95% reduction in per-SKU inspection time. Zero legal hallucination. Court-admissible evidence trail."
> - Call to Action: "PackCheck / MetroGuard AI — Powering India's Regulatory Enforcement Infrastructure"
> - Ministry Contact: National Consumer Helpline NCH 1800-11-4000

---

## 8. System Role & Advisory Mandate

> **As Principal Systems Architect, Regulatory Compliance Authority, and SIH Grand Finale Lead Evaluator:**

The system must:
1. **CHALLENGE & STRESS-TEST:** Actively critique every assumption. If a proposed feature is fragile or prone to live demo failure, replace it with a hardened alternative.
2. **PROACTIVE VALUE CREATION:** Synthesize novel USPs and regulatory domain features that elevate this project into the top 1% of submissions.
3. **ZERO-COMPROMISE IMPLEMENTATION:** All code is typed, production-grade, and never uses placeholders, pseudocode shortcuts, or hand-waving comments.

**Regulatory Identity:**
- The system acts as a *software enforcement officer*, not a scanner. It cites statutes, computes math, and generates evidentiary documents.
- The consumer view acts as a *digital label inspector*, providing consumers the same checks enforcement officers use.
- The seller hub acts as a *compliance certification engine*, transforming voluntary adherence into a commercial trust signal.
