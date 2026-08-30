from dotenv import load_dotenv
load_dotenv()

import json
import uuid
from datetime import date, datetime
from hashlib import sha256
from pathlib import Path

from fastapi import BackgroundTasks, Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy.orm import Session

try:
    from backend.models import AuditCertificate, Inspection, SessionLocal, Violation, init_db
    from backend.services.rule_engine import audit_text, calculate_trust_score
    from backend.services.pdf_generator import generate_section_36_notice
    from backend.services.gemini_service import extract_label_with_gemini
    from backend.seed import seed as seed_db
    from backend.schemas import (
        AnalyticsSummary,
        AuditResponse,
        BatchAuditItem,
        BatchAuditResponse,
        BoundingBox,
        ExtractedField,
        InspectionMetadata,
        InspectionSummary,
        RuleStatus,
    )
except ModuleNotFoundError:
    from models import AuditCertificate, Inspection, SessionLocal, Violation, init_db
    from services.rule_engine import audit_text, calculate_trust_score
    from services.pdf_generator import generate_section_36_notice
    from services.gemini_service import extract_label_with_gemini
    from seed import seed as seed_db
    from schemas import (
        AnalyticsSummary,
        AuditResponse,
        BatchAuditItem,
        BatchAuditResponse,
        BoundingBox,
        ExtractedField,
        InspectionMetadata,
        InspectionSummary,
        RuleStatus,
    )

app = FastAPI(title="Legal Metrology Compliance Scanner", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
init_db()
seed_db()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def save_violations_and_certificate(inspection_id: int, rules: list):
    db = SessionLocal()
    try:
        for rule in rules:
            if rule.status != RuleStatus.PASS:
                db.add(Violation(inspection_id=inspection_id, rule=rule.rule.value, status=rule.status.value, reason=rule.reason))
        db.add(AuditCertificate(inspection_id=inspection_id, certificate_number=f"LM-{inspection_id:08d}"))
        db.commit()
    finally:
        db.close()


def status_for(rules) -> RuleStatus:
    if any(rule.status == RuleStatus.FAIL for rule in rules):
        return RuleStatus.FAIL
    if any(rule.status == RuleStatus.WARNING for rule in rules):
        return RuleStatus.WARNING
    return RuleStatus.PASS


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def root_status():
    return {
        "status": "online",
        "project": "Legal Metrology Compliance Scanner - SIH26034",
        "ministry": "Department of Consumer Affairs (DOCA)",
        "docs": "/docs",
    }


@app.post("/api/scan", response_model=AuditResponse)
<<<<<<< HEAD
async def scan(
    file: UploadFile = File(...),
    ocr_text: str = Form(default=""),
    region: str = Form(default="New Delhi - Connaught Place"),
    gps_location: str = Form(default="28.6139° N, 77.2090° E"),
    db: Session = Depends(get_db),
):
=======
async def scan(background_tasks: BackgroundTasks, file: UploadFile = File(...), ocr_text: str = Form(default=""), region: str = Form(default="Unknown"), db: Session = Depends(get_db)):
>>>>>>> origin/feat/check-demo-readiness-454878615019827795
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded image is empty")
    digest = sha256(content).hexdigest()

    # If OCR text wasn't supplied directly in Form, attempt vision extraction via Gemini
    gemini_res = {}
    if not ocr_text or len(ocr_text.strip()) == 0:
        gemini_res = extract_label_with_gemini(content, file.content_type or "image/jpeg")
        if gemini_res and "ocr_text" in gemini_res:
            ocr_text = gemini_res["ocr_text"]

    rules, usp, fields = audit_text(ocr_text, date.today())
    overall = status_for(rules)
    trust_score = calculate_trust_score(rules)

    # Merge bounding boxes from Gemini vision into extracted fields
    if gemini_res.get("bounding_boxes"):
        for bb in gemini_res["bounding_boxes"]:
            box_coords = bb.get("box")
            bbox = None
            if box_coords and len(box_coords) == 4:
                bbox = BoundingBox(
                    y_min=float(box_coords[0]),
                    x_min=float(box_coords[1]),
                    y_max=float(box_coords[2]),
                    x_max=float(box_coords[3]),
                )
            fields.append(ExtractedField(
                name=bb.get("label", "unknown"),
                value=bb.get("text", ""),
                bounding_box=bbox,
            ))

    inspection = Inspection(
        source_filename=file.filename or "upload.jpg",
        sha256=digest,
        region=region,
        gps_location=gps_location,
        trust_score=trust_score,
        overall_status=overall.value,
        ocr_text=ocr_text,
    )
    db.add(inspection)
<<<<<<< HEAD
    db.flush()

    for rule in rules:
        if rule.status != RuleStatus.PASS:
            db.add(Violation(
                inspection_id=inspection.id,
                rule=rule.rule.value,
                status=rule.status.value,
                reason=rule.reason,
            ))

    cert_no = f"LM-{inspection.inspected_at.strftime('%Y%m%d')}-{inspection.id:06d}"
    db.add(AuditCertificate(
        inspection_id=inspection.id,
        certificate_number=cert_no,
        sha256_seal=sha256(f"DOCA_{cert_no}_{digest}".encode()).hexdigest(),
    ))
    db.commit()

    metadata = InspectionMetadata(
        inspection_id=inspection.id,
        inspected_at=inspection.inspected_at,
        audit_date=date.today(),
        source_filename=inspection.source_filename,
        sha256=digest,
        region=region,
        gps_location=gps_location,
    )
    return AuditResponse(
        metadata=metadata,
        extracted_fields=fields,
        rules=rules,
        overall_status=overall,
        trust_score=trust_score,
        usp=usp,
        ocr_text=ocr_text,
    )


@app.post("/api/scan/batch", response_model=BatchAuditResponse)
async def batch_scan(
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    """Bulk SKU catalogue scanner for E-Commerce Sellers and Marketplaces."""
    items = []
    passed_count = 0

    for idx, f in enumerate(files):
        content = await f.read()
        digest = sha256(content).hexdigest() if content else "0" * 64
        # Default mock text extraction per SKU name
        mock_text = f"Manufactured by Seller Entity Ltd, Plot {idx+1} Industrial Road, New Delhi 110001. Packaged Commodity Net Qty 500 g MRP Rs. {100 + idx*10} (incl. of all taxes) 04/2026. Consumer care 1800111222 care@seller.com. Country of origin: India"
        rules, _, _ = audit_text(mock_text, date.today())
        status = status_for(rules)
        score = calculate_trust_score(rules)
        v_count = sum(1 for r in rules if r.status != RuleStatus.PASS)

        if status == RuleStatus.PASS:
            passed_count += 1

        items.append(BatchAuditItem(
            sku_id=f"SKU-{uuid.uuid4().hex[:6].upper()}",
            filename=f.filename or f"item_{idx+1}.jpg",
            overall_status=status,
            trust_score=score,
            violation_count=v_count,
            rule_results=rules,
        ))

    failed_count = len(items) - passed_count
    return BatchAuditResponse(
        batch_id=f"BATCH-{uuid.uuid4().hex[:8].upper()}",
        total_skus=len(items),
        passed_skus=passed_count,
        failed_skus=failed_count,
        compliance_badge_eligible=failed_count == 0,
        items=items,
    )
=======
    db.commit()
    db.refresh(inspection)

    background_tasks.add_task(save_violations_and_certificate, inspection.id, rules)

    metadata = InspectionMetadata(inspection_id=inspection.id, inspected_at=inspection.inspected_at, audit_date=date.today(), source_filename=inspection.source_filename, sha256=digest, region=region)
    return AuditResponse(metadata=metadata, extracted_fields=fields, rules=rules, overall_status=overall, usp=usp, ocr_text=ocr_text)
>>>>>>> origin/feat/check-demo-readiness-454878615019827795


@app.get("/api/inspections", response_model=list[InspectionSummary])
def inspections(limit: int = 50, db: Session = Depends(get_db)):
    rows = db.query(Inspection).order_by(Inspection.inspected_at.desc()).limit(min(max(limit, 1), 100)).all()
    return [
        InspectionSummary(
            inspection_id=row.id,
            inspected_at=row.inspected_at,
            source_filename=row.source_filename,
            sha256=row.sha256,
            region=row.region,
            gps_location=row.gps_location,
            trust_score=row.trust_score,
            overall_status=RuleStatus(row.overall_status),
            violation_count=len(row.violations),
        )
        for row in rows
    ]


@app.get("/api/inspections/{inspection_id}/export-notice")
def export_notice(inspection_id: int, db: Session = Depends(get_db)):
    inspection = db.get(Inspection, inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    pdf_bytes = generate_section_36_notice(
        inspection_id=inspection.id,
        source_filename=inspection.source_filename,
        sha256_digest=inspection.sha256,
        region=inspection.region,
        gps_location=inspection.gps_location,
        inspected_at=inspection.inspected_at,
        overall_status=inspection.overall_status,
        violations=inspection.violations,
        ocr_text=inspection.ocr_text,
    )

    filename = f"Section-36-Notice-LM-{inspection.id:06d}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.get("/api/analytics/summary", response_model=AnalyticsSummary)
def analytics(db: Session = Depends(get_db)):
    rows = db.query(Inspection).all()
    total = len(rows)
    compliant = sum(1 for r in rows if r.overall_status == "PASS")
    failed = sum(1 for r in rows if r.overall_status == "FAIL")
    warning = sum(1 for r in rows if r.overall_status == "WARNING")
    rate = round((compliant / total * 100), 1) if total > 0 else 0.0

    by_region: dict[str, int] = {}
    for r in rows:
        by_region[r.region] = by_region.get(r.region, 0) + 1

    # Aggregate rule infraction counts
    by_rule: dict[str, int] = {}
    violations = db.query(Violation).all()
    for v in violations:
        by_rule[v.rule] = by_rule.get(v.rule, 0) + 1

    return AnalyticsSummary(
        total_inspections=total,
        compliant_inspections=compliant,
        failed_inspections=failed,
        warning_inspections=warning,
        compliance_rate=rate,
        by_region=by_region,
        by_rule_infractions=by_rule,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
