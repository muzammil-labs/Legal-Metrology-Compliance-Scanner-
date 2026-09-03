import os
import io
import hashlib
from datetime import datetime
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse, FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from database import engine, Base
from models import InspectionRecord
from database import get_db

from schemas import (
    AuditResponse,
    RuleResult,
    RuleStatus,
    StatutoryRule,
    BatchAuditResponse,
    BatchAuditItem,
    PreAuditRequest,
    PreAuditResponse,
    ExecutiveAnalyticsResponse,
    DistrictMetricSummary,
    ECommerceAuditRequest,
    ECommerceAuditResponse
)
from services.rule_engine import audit_text, calculate_compounding_fine
from services.fssai_auditor import audit_fssai_declarations

from services.gemini_service import extract_label_with_gemini
from services.auth import require_role, UserRole, validate_b2b_api_key
from services.executive_reports import generate_executive_pdf_report, generate_excel_export
from services.ecommerce_parser import audit_digital_listing

from services.pdf_generator import generate_compounding_notice_pdf, generate_improvement_notice_pdf

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

DEMO_MODE = os.environ.get("DEMO_MODE", "false").lower() == "true"

DEMO_OCR_TEXT = (
    "Mfg. by: Nestle India Ltd, 100/101 World Trade Centre, "
    "Barakhamba Lane, New Delhi - 110001\n"
    "Country of Origin: India\nNet Qty: 70g\n"
    "MRP Rs.15.00 (Incl. of all taxes)\nMfg: 08/2025\n"
    "Consumer Care: 1800-103-6444\nFSSAI Lic. No. 10013022002845\n"
    "Veg product\nUnit Sale Price: Rs.21.43 per 100g"
)
DEMO_STRUCTURED = {
    "manufacturer_name": "Nestle India Ltd",
    "manufacturer_pincode": "110001",
    "country_of_origin": "India",
    "net_quantity_value": "70", "net_quantity_unit": "g",
    "mrp_value": "15.00", "mrp_includes_taxes_declared": "yes",
    "mfg_date": "08/2025",
    "consumer_care_phone": "1800-103-6444",
    "fssai_license_number": "10013022002845",
    "veg_nonveg_symbol": "VEG",
    "unit_sale_price": "21.43 per 100g",
}

try:
    Base.metadata.create_all(bind=engine)
except Exception as _db_init_err:
    import logging as _logging
    _logging.warning(f"DB create_all failed (non-fatal on Vercel): {_db_init_err}")

app = FastAPI(title="PakkaLabel Legal Metrology Scanner", version="1.0.0")

from fastapi import Request
from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Unhandled Backend Error: {traceback.format_exc()}"}
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if not os.path.exists(frontend_dist):
    frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "dist"))

if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/")
@app.get("/citizen")
def root_endpoint():
    index_file = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return HTMLResponse(
        """<!DOCTYPE html>
        <html>
        <head><title>PakkaLabel India - Legal Metrology Compliance Engine</title></head>
        <body style="background:#09090b;color:#f4f4f5;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
            <div style="text-align:center;padding:2.5rem;border:1px solid #27272a;border-radius:16px;background:#18181b;max-width:540px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
                <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#38bdf8;margin-bottom:0.75rem;">Ministry of Consumer Affairs &bull; DOCA</div>
                <h1 style="color:#f4f4f5;font-size:24px;margin:0 0 0.5rem 0;">PakkaLabel India Engine</h1>
                <p style="color:#a1a1aa;font-size:14px;line-height:1.5;">Legal Metrology PCR 2011 Compliance Scanner is active & operational.</p>
                <div style="margin-top:1.5rem;display:flex;gap:10px;justify-content:center;">
                    <a href="/health" style="padding:8px 16px;background:#27272a;border:1px solid #3f3f46;color:#38bdf8;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">System Health</a>
                    <a href="/api/analytics/summary" style="padding:8px 16px;background:#27272a;border:1px solid #3f3f46;color:#34d399;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">Analytics Docket</a>
                </div>
            </div>
        </body>
        </html>"""
    )

@app.get("/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

@app.get("/api/health/gemini")
async def gemini_health_check():
    import time
    start = time.perf_counter()
    api_key = os.environ.get("GEMINI_API_KEY")
    status = "demo_mode" if DEMO_MODE else "unknown"
    error = None
    if not DEMO_MODE:
        try:
            minimal_jpeg = bytes([
                0xFF,0xD8,0xFF,0xE0,0x00,0x10,0x4A,0x46,0x49,0x46,0x00,0x01,
                0x01,0x00,0x00,0x01,0x00,0x01,0x00,0x00,0xFF,0xDB,0x00,0x43,
                0x00,0x08,0x06,0x06,0x07,0x06,0x05,0x08,0x07,0x07,0x07,0x09,
                0x09,0x08,0x0A,0x0C,0x14,0x0D,0x0C,0x0B,0x0B,0x0C,0x19,0x12,
                0x13,0x0F,0x14,0x1D,0x1A,0x1F,0x1E,0x1D,0x1A,0x1C,0x1C,0x20,
                0x24,0x2E,0x27,0x20,0x22,0x2C,0x23,0x1C,0x1C,0x28,0x37,0x29,
                0x2C,0x30,0x31,0x34,0x34,0x34,0x1F,0x27,0x39,0x3D,0x38,0x32,
                0x3C,0x2E,0x33,0x34,0x32,0xFF,0xD9
            ])
            raw, _, conf = extract_label_with_gemini(minimal_jpeg)
            latency = round((time.perf_counter() - start) * 1000, 1)
            if raw and "Failed" not in raw and "Mocked" not in raw:
                status = "ok"
            else:
                status = "degraded"
                error = raw[:120] if raw else "Empty response"
        except Exception as e:
            status = "down"
            error = str(e)[:200]
            latency = round((time.perf_counter() - start) * 1000, 1)
    else:
        latency = 0.0
    return {
        "gemini_status": status,
        "latency_ms": latency if DEMO_MODE is False else 0.0,
        "api_key_present": bool(api_key),
        "demo_mode_active": DEMO_MODE,
        "error": error,
    }

@app.post("/api/scan", response_model=AuditResponse)
async def scan(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_role: UserRole = Depends(require_role([UserRole.FIELD_INSPECTOR, UserRole.ADMIN, UserRole.DISTRICT_MAGISTRATE, UserRole.CENTRAL_ADMIN]))
):
    await file.seek(0)
    content = await file.read(MAX_FILE_SIZE + 1)
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded image is empty")
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File size exceeds maximum size limit of 10MB")
    await file.seek(0)

    # Check file type by content-type header OR extension — mobile cameras
    # may send files with no extension (e.g. just 'image') so we can't rely on extension alone
    content_type = file.content_type or ""
    filename = file.filename or ""
    allowed_extensions = (".png", ".jpg", ".jpeg", ".webp")
    allowed_content_types = ("image/jpeg", "image/png", "image/webp", "image/jpg")
    if not (filename.lower().endswith(allowed_extensions) or content_type.lower() in allowed_content_types or content_type.lower().startswith("image/")):
        raise HTTPException(status_code=400, detail="Invalid image format. Please upload a JPG, PNG, or WEBP image.")

    if DEMO_MODE:
        text, structured_fields, ocr_confidence = DEMO_OCR_TEXT, DEMO_STRUCTURED, 1.0
    else:
        if not os.environ.get("GEMINI_API_KEY"):
            raise HTTPException(status_code=500, detail="CRITICAL: GEMINI_API_KEY is not configured on the Vercel server. Please add it to your Environment Variables.")
        text, structured_fields, ocr_confidence = extract_label_with_gemini(content)

    # Check for special markers returned by Gemini
    if text.strip() == "NOT_A_PACKAGED_PRODUCT":
        raise HTTPException(status_code=422, detail="This image does not appear to show a packaged consumer product. Please scan a product label.")
    if text.strip() == "IMAGE_QUALITY_POOR":
        raise HTTPException(status_code=422, detail="Image quality is too poor (blurry, glare, or out of focus). Please retake the photo in better lighting.")
    rules = audit_text(text, json_artwork=structured_fields)
    fssai_info = audit_fssai_declarations(text)

    overall_status = RuleStatus.PASS
    if any(r.status == RuleStatus.FAIL for r in rules) or fssai_info.status == RuleStatus.FAIL:
        overall_status = RuleStatus.FAIL
    elif any(r.status == RuleStatus.WARNING for r in rules):
        overall_status = RuleStatus.WARNING

    sha256_hash = hashlib.sha256(content).hexdigest()
    
    computed_violations = sum(1 for r in rules if r.status == RuleStatus.FAIL)
    if fssai_info and fssai_info.status == RuleStatus.FAIL:
        computed_violations += len(fssai_info.violations)

    inspection = InspectionRecord(
        sha256=sha256_hash,
        source_filename=file.filename or "unknown.jpg",
        overall_status=overall_status.value,
        ocr_text=text,
        inspected_at=datetime.utcnow(),
        violation_count=computed_violations
    )
    try:
        db.add(inspection)
        db.commit()
        db.refresh(inspection)
        inspection_id = str(inspection.id)
    except Exception:
        # DB write failure is non-fatal on Vercel ephemeral filesystem
        db.rollback()
        inspection_id = sha256_hash[:12]

    return AuditResponse(
        inspection_id=inspection_id,
        sha256_hash=sha256_hash,
        overall_status=overall_status,
        rules=rules,
        timestamp=datetime.utcnow().isoformat(),
        ocr_text=text,
        penalty=calculate_compounding_fine(rules),
        fssai_verification=fssai_info
    )

@app.post("/api/scan/batch", response_model=BatchAuditResponse)
async def batch_scan(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_role: UserRole = Depends(require_role([UserRole.FIELD_INSPECTOR, UserRole.ADMIN, UserRole.DISTRICT_MAGISTRATE, UserRole.CENTRAL_ADMIN]))
):
    items = []
    failed_count = 0
    passed_count = 0
    total_compounding_exposure_inr = 0

    import uuid

    batch_id = str(uuid.uuid4())

    for file in files:
        await file.seek(0)
        content = await file.read(MAX_FILE_SIZE + 1)
        if not content:
            raise HTTPException(status_code=400, detail=f"Uploaded file {file.filename} is empty")
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail=f"File {file.filename} size exceeds maximum size limit of 10MB")
        await file.seek(0)

        if not file.filename.endswith((".png", ".jpg", ".jpeg", ".webp", ".zip", ".csv")):
            raise HTTPException(status_code=400, detail=f"Invalid file format for {file.filename}")

        if DEMO_MODE:
            text, structured_fields, ocr_confidence = DEMO_OCR_TEXT, DEMO_STRUCTURED, 1.0
        else:
            text, structured_fields, ocr_confidence = extract_label_with_gemini(content)
        rules = audit_text(text, json_artwork=structured_fields)
        fssai_info = audit_fssai_declarations(text)

        overall_status = RuleStatus.PASS
        violations_count = sum(1 for r in rules if r.status == RuleStatus.FAIL)

        if fssai_info.status == RuleStatus.FAIL:
             violations_count += len(fssai_info.violations)

        if any(r.status == RuleStatus.FAIL for r in rules) or fssai_info.status == RuleStatus.FAIL:
            overall_status = RuleStatus.FAIL
            failed_count += 1
        elif any(r.status == RuleStatus.WARNING for r in rules):
            overall_status = RuleStatus.WARNING
            passed_count += 1 # WARNING counts as pass
        else:
            passed_count += 1

        fine_info = calculate_compounding_fine(rules)
        total_compounding_exposure_inr += fine_info.get("estimated_fine_inr", 0)

        items.append(BatchAuditItem(
            item_id=str(uuid.uuid4()),
            filename=file.filename,
            overall_status=overall_status.value,
            violations_count=violations_count,
            estimated_fine_inr=fine_info.get("estimated_fine_inr", 0),
            fssai_verification=fssai_info
        ))

    return BatchAuditResponse(
        batch_id=batch_id,
        total_scanned=len(files),
        passed_count=passed_count,
        failed_count=failed_count,
        total_compounding_exposure_inr=total_compounding_exposure_inr,
        items=items,
        processed_at=datetime.utcnow().isoformat()
    )


@app.post("/api/v1/pre-audit", response_model=PreAuditResponse)
async def pre_audit_endpoint(
    payload: PreAuditRequest,
    api_key: str = Depends(validate_b2b_api_key)
):
    rules = audit_text(payload.artwork_text)
    fssai_info = audit_fssai_declarations(payload.artwork_text, [payload.brand_name] if payload.brand_name else None)

    overall_status = RuleStatus.PASS
    if any(r.status == RuleStatus.FAIL for r in rules) or fssai_info.status == RuleStatus.FAIL:
        overall_status = RuleStatus.FAIL
    elif any(r.status == RuleStatus.WARNING for r in rules):
        overall_status = RuleStatus.WARNING

    fine_info = calculate_compounding_fine(rules)
    return PreAuditResponse(
        overall_status=overall_status,
        rules=rules,
        estimated_fine_inr=fine_info.get("estimated_fine_inr", 0),
        fssai_verification=fssai_info
    )

@app.get("/api/inspections")
def list_inspections(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    records = db.query(InspectionRecord).order_by(InspectionRecord.id.desc()).limit(limit).all()
    results = []
    for r in records:
        results.append({
            "inspection_id": r.id,
            "source_filename": r.source_filename or "label_sample.jpg",
            "region": r.region or "New Delhi",
            "gps_location": r.gps_location or "28.6139° N, 77.2090° E",
            "trust_score": r.trust_score or 100,
            "overall_status": r.overall_status or "PASS",
            "violation_count": r.violation_count if r.violation_count is not None else 0,
            "sha256": r.sha256_hash or "",
            "inspected_at": r.inspected_at.isoformat() if r.inspected_at else datetime.utcnow().isoformat()
        })
    return results

@app.get("/api/analytics/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    from sqlalchemy import func
    total = db.query(InspectionRecord).count()
    compliant = db.query(InspectionRecord).filter(InspectionRecord.overall_status == "PASS").count()
    failed = db.query(InspectionRecord).filter(InspectionRecord.overall_status == "FAIL").count()
    warnings = db.query(InspectionRecord).filter(InspectionRecord.overall_status == "WARNING").count()
    rate = round((compliant / total * 100), 1) if total > 0 else 0.0

    region_counts = db.query(InspectionRecord.region, func.count(InspectionRecord.id)).filter(
        InspectionRecord.region != None,
        InspectionRecord.region != "Unknown"
    ).group_by(InspectionRecord.region).all()
    by_region = {region: count for region, count in region_counts}

    return {
        "total_inspections": total,
        "compliant_inspections": compliant,
        "failed_inspections": failed,
        "warning_inspections": warnings,
        "compliance_rate": rate if total > 0 else 0.0,
        "by_region": by_region,
        "by_rule_infractions": {},
    }

@app.get("/api/inspections/{inspection_id}/export-notice")
def export_inspection_notice(
    inspection_id: int,
    notice_type: str = "COMPOUNDING",
    db: Session = Depends(get_db)
):
    rec = db.query(InspectionRecord).filter(InspectionRecord.id == inspection_id).first()
    source_filename = rec.source_filename if rec else "product_sku.jpg"
    sha256_digest = rec.sha256_hash if rec and rec.sha256_hash else "0" * 64
    region = rec.region if rec and rec.region else "Central Delhi"
    gps_loc = rec.gps_location if rec and rec.gps_location else "28.6139° N, 77.2090° E"
    inspected_at = rec.inspected_at if rec and rec.inspected_at else datetime.utcnow()
    status_str = rec.overall_status if rec and rec.overall_status else "FAIL"
    ocr_text = rec.extracted_text if rec and rec.extracted_text else ""

    rules = audit_text(ocr_text or "Mfg by Brand Ltd. Net Qty 100g")
    violations = [r for r in rules if r.status != RuleStatus.PASS]

    if notice_type == "IMPROVEMENT":
        pdf_bytes = generate_improvement_notice_pdf(
            inspection_id=inspection_id,
            source_filename=source_filename,
            sha256_digest=sha256_digest,
            region=region,
            gps_location=gps_loc,
            inspected_at=inspected_at,
            overall_status=status_str,
            violations=violations,
            ocr_text=ocr_text
        )
        filename = f"Improvement_Notice_{inspection_id}.pdf"
    else:
        pdf_bytes = generate_compounding_notice_pdf(
            inspection_id=inspection_id,
            source_filename=source_filename,
            sha256_digest=sha256_digest,
            region=region,
            gps_location=gps_loc,
            inspected_at=inspected_at,
            overall_status=status_str,
            violations=violations,
            ocr_text=ocr_text
        )
        filename = f"Compounding_Notice_{inspection_id}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.get("/api/v1/analytics/export/pdf")
def export_pdf_report(
    db: Session = Depends(get_db),
    current_role: UserRole = Depends(require_role([UserRole.DISTRICT_MAGISTRATE, UserRole.CENTRAL_ADMIN, UserRole.ADMIN]))
):
    total_records = db.query(InspectionRecord).count()
    compliant = db.query(InspectionRecord).filter(InspectionRecord.overall_status == "PASS").count()
    real_rate = round((compliant / total_records * 100), 1) if total_records > 0 else 0.0
    from sqlalchemy import func as _func
    total_violations = db.query(_func.sum(InspectionRecord.violation_count)).scalar() or 0
    estimated_total_fine = int(total_violations) * 5000
    summary = ExecutiveAnalyticsResponse(
        generated_at=datetime.utcnow().isoformat(),
        reporting_month=datetime.utcnow().strftime("%B %Y"),
        state_aggregate_compliance_rate=real_rate,
        total_inspections_statewide=total_records,
        districts=[
            DistrictMetricSummary(
                district_name="Central District",
                total_inspections=total_records,
                compliance_rate=real_rate,
                total_penalties_levied_inr=estimated_total_fine,
                top_statutory_violation="Rule 6(1)(e) - MRP Suffix",
                repeat_offender_brands=[]
            )
        ]
    )
    pdf_bytes = generate_executive_pdf_report(summary)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=Executive_District_Report.pdf"}
    )

@app.get("/api/v1/analytics/export/excel")
def export_excel_report(
    db: Session = Depends(get_db),
    current_role: UserRole = Depends(require_role([UserRole.DISTRICT_MAGISTRATE, UserRole.CENTRAL_ADMIN, UserRole.ADMIN]))
):
    total_records = db.query(InspectionRecord).count()
    compliant = db.query(InspectionRecord).filter(InspectionRecord.overall_status == "PASS").count()
    real_rate = round((compliant / total_records * 100), 1) if total_records > 0 else 0.0
    from sqlalchemy import func as _func
    total_violations = db.query(_func.sum(InspectionRecord.violation_count)).scalar() or 0
    estimated_total_fine = int(total_violations) * 5000
    summary = ExecutiveAnalyticsResponse(
        generated_at=datetime.utcnow().isoformat(),
        reporting_month=datetime.utcnow().strftime("%B %Y"),
        state_aggregate_compliance_rate=real_rate,
        total_inspections_statewide=total_records,
        districts=[
            DistrictMetricSummary(
                district_name="Central District",
                total_inspections=total_records,
                compliance_rate=real_rate,
                total_penalties_levied_inr=estimated_total_fine,
                top_statutory_violation="Rule 6(1)(e) - MRP Suffix",
                repeat_offender_brands=[]
            )
        ]
    )
    xlsx_bytes = generate_excel_export(summary)
    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=District_Audit_Data.xlsx"}
    )

@app.post("/api/v1/audit-digital-listing", response_model=ECommerceAuditResponse)
def audit_digital_listing_endpoint(payload: ECommerceAuditRequest):
    return audit_digital_listing(payload)
