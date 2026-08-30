> **IMPORTANT NOTICE:** Please delete this file once the project work/review is complete.

---

You are acting as the Principal Systems Architect, Regulatory Compliance Authority (Legal Metrology), and Senior SIH Grand Finale Lead Evaluator.
We are building project SIH26034 — "Software System to check compliance of Packaged Commodities under Legal Metrology (Packaged Commodities) Rules, 2011" for the Department of Consumer Affairs (DOCA), Ministry of Consumer Affairs, Food & Public Distribution.
Our goal is to build an unassailable, production-grade 100/100 hackathon application that dominates the internal college elimination round and wins the SIH National Grand Finale.
Our team operates under a UNIFIED FULL-STACK COLLABORATIVE MODEL (all team members use Google Antigravity Pro accounts to build across both backend and frontend layers, shared repository integration, and stagecraft preparation).
OPERATIONAL DIRECTIVES & REQUIRED DELIVERABLES:
 * CORE TECHNICAL USPs & EXPERIMENTAL FEATURES:
   Elevate our product beyond basic OCR transcription. Implement and specify 7 layered technical USPs:
   * USP 1: Deterministic Legal Verification Engine (DLVE) — Multimodal vision (Gemini 2.5 Flash) extracts raw OCR tokens & bounding boxes ONLY. Deterministic Python regex engines evaluate statutory rules (0% AI legal hallucination).
   * USP 2: Rule 6(11) Unit Sale Price (USP) Mathematical Auditor — Calculates declared vs actual USP ratios (USP = MRP / Net Qty) within ±₹0.01 tolerance, detecting deceptive unit pricing or missing disclosures.
   * USP 3: Evidentiary Section 36 Inspection Notice Generator — One-click synthesis of an official Section 36 Compound Notice PDF via ReportLab, complete with bounding-box image crops, GPS metadata, local timestamp, and an immutable SHA-256 digital signature hash.
   * USP 4: Rule 5 Principal Display Panel (PDP) & Font Ratio Estimator — Calculates bounding-box pixel area ratios against total package dimensions to flag sub-standard font heights (<2mm for <=200g, <4mm for 200g–500g, <6mm for >500g).
   * USP 5: Cross-Language Discrepancy Auditor — Cross-checks bilingual labels to detect price discrepancies or missing legal clauses between Hindi and English text blocks.
   * USP 6: Inspector Analytics & Regional Heatmap Dashboard — Aggregates pre-seeded SQLite audit logs (25 historical records) into regional non-compliance trend charts and repeat-offender brand rankings.
   * USP 7: Dual-Engine Zero-Latency Fallback Architecture — Client-side 4.5s circuit breaker routing network requests through local JSON control vectors during venue Wi-Fi congestion.
 * LOCKED SINGLE-SOURCE API CONTRACT (backend/schemas.py):
   Generate complete, typed Pydantic V2 schemas with strict Enums:
   * RuleCode: Enums covering RULE_6_1_A through RULE_6_1_F, RULE_6_11_USP, and RULE_5_PDP.
   * RuleStatus: Enums for PASS, FAIL, WARNING.
   * UnitType: Enums for G, KG, ML, L, N, U.
   * RuleEvaluation: Bounding box coordinates [ymin, xmin, ymax, xmax], extracted string, rule code, status, and human-readable infraction reason.
   * USPVerification: Declared USP, calculated USP, rounding delta, and boolean validity.
   * ScanResponse: Complete payload including inspection_id, sha256_hash, overall_status, timestamp, gps_location, evaluations list, and USP verification object.
 * DETERMINISTIC PYTHON RULE ENGINE (backend/services/rule_engine.py):
   Provide production-grade Python regex and arithmetic evaluation functions:
   * Rule 6(1)(a): Mandatory relationship prefixes ("Mfg by", "Packed by", "Imported by") + complete address PIN code validation (\b[1-9][0-9]{5}\b).
   * Rule 6(1)(c): Strict SI metric filter (accepts g, kg, ml, l, N, U; rejects legacy notations "gm", "gms", "ml.", "kgs").
   * Rule 6(1)(e): Exact tax syntax matching (incl. of all taxes) or (inclusive of all taxes).
   * Rule 6(11): Exact USP math division (MRP / Net Qty) with unit normalization.
 * REPORTLAB SECTION 36 PDF GENERATOR (backend/services/pdf_generator.py):
   Generate a formal court-admissible PDF generator containing government headers ("DEPARTMENT OF CONSUMER AFFAIRS - NOTICE OF COMPOUNDING / DEMAND"), store metadata, bounding-box crops, statutory citations, and a bottom banner with an immutable SHA-256 digital signature hash.
 * FASTAPI CONTROLLER & DATABASE (backend/main.py, models.py, seed.py):
   * FastAPI server with permissive CORS (allow_origins=["*"]) exposing /api/scan, /api/inspections, /api/inspections/{id}/export-notice, and /api/analytics/summary.
   * SQLAlchemy ORM models mapping to inspections.db.
   * seed.py populating 25 realistic historical inspection records across regional retail districts.
   * tests/test_rules.py containing pytest test cases for statutory pass/fail edge cases.
 * RESILIENT FRONTEND API CLIENT (frontend/src/services/api.js) & FIXTURES:
   * Implement an AbortController circuit breaker with a strict 4500ms timeout.
   * Provide 3 complete static JSON control vectors in frontend/src/fixtures/ (control_pass.json, control_fail_tax.json, control_fail_unit.json).
 * AWWWARDS-TIER DARK MODE UI COMPONENTS (frontend/src/components/):
   * Palette: Root bg-zinc-950, card surfaces bg-zinc-900/80 backdrop-blur-md, borders border-zinc-800/80, text text-zinc-100.
   * Badges: Pass (bg-emerald-500/10 text-emerald-400 border-emerald-500/20), Fail (bg-rose-500/10 text-rose-400 border-rose-500/20).
   * Navbar.jsx: DOCA branding + 1-click Demo Fixture toggle (Live Camera | Product 1 Pass | Product 2 Tax Fail | Product 3 USP Fail).
   * CameraScanner.jsx: Native mobile camera trigger (capture="environment") with an animated top-to-bottom cyan laser scanline sweep overlay (shadow-[0_0_15px_#22d3ee]).
   * ComplianceSummaryCard.jsx: High-contrast rule breakdown cards and USP math verification card.
   * InspectorAnalyticsDashboard.jsx: KPI cards and violation frequency charts consuming /api/analytics/summary (25 pre-seeded SQLite records).
   * NoticePreviewModal.jsx: Slide-over drawer previewing the generated PDF notice and SHA-256 hash.
 * STAGECRAFT, PITCH STORYBOARD & JURY DEFENSE:
   * Provide an 8-slide pitch deck storyboard including Slide 1 Public QR code configuration.
   * Provide a 3-product physical stage demo sequence (Biscuit Box Pass, Tax Fail Box, USP Fail Box).
   * Provide word-for-word defense scripts answering:
     * "Don't food products already have QR codes?" (Explain Legal Metrology Rule 6(1) mandatory physical ink requirements, GS1 EAN-13 barcode limits, and physical PDP violation mechanics).
     * "How do you prevent AI hallucinations?" (Explain the decoupled architecture: Gemini Flash extracts text tokens; deterministic Python code verifies statutory rules).
     * "Why not use Tesseract OCR?" (Explain background noise, curved surfaces, bounding-box structural context, and PDP font ratio estimation under Rule 5).
     * "What if venue Wi-Fi stutters?" (Explain the 4.5s AbortController circuit breaker and local JSON fixture fallbacks).
Do not use placeholders, truncated code, pseudocode, or TODO comments. Generate complete, typed, runnable files and rigorous statutory domain specifications.

