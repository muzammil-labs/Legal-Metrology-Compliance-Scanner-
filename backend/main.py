from datetime import date, datetime
from hashlib import sha256
from io import BytesIO
from pathlib import Path

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session

try:
    from backend.models import AuditCertificate, Inspection, SessionLocal, Violation, init_db
    from backend.services.rule_engine import audit_text
    from backend.schemas import AnalyticsSummary, AuditResponse, InspectionMetadata, InspectionSummary, RuleStatus
except ModuleNotFoundError:
    from models import AuditCertificate, Inspection, SessionLocal, Violation, init_db
    from services.rule_engine import audit_text
    from schemas import AnalyticsSummary, AuditResponse, InspectionMetadata, InspectionSummary, RuleStatus

app = FastAPI(title="Legal Metrology Compliance Scanner", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
init_db()


def get_db():
    db = SessionLocal()
    try:
        yield db
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


@app.post("/api/scan", response_model=AuditResponse)
async def scan(file: UploadFile = File(...), ocr_text: str = Form(default=""), region: str = Form(default="Unknown"), db: Session = Depends(get_db)):
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded image is empty")
    digest = sha256(content).hexdigest()
    rules, usp, fields = audit_text(ocr_text, date.today())
    overall = status_for(rules)
    inspection = Inspection(source_filename=file.filename or "upload", sha256=digest, region=region, overall_status=overall.value, ocr_text=ocr_text)
    db.add(inspection)
    db.flush()
    for rule in rules:
        if rule.status != RuleStatus.PASS:
            db.add(Violation(inspection_id=inspection.id, rule=rule.rule.value, status=rule.status.value, reason=rule.reason))
    db.add(AuditCertificate(inspection_id=inspection.id, certificate_number=f"LM-{inspection.id:08d}"))
    db.commit()
    metadata = InspectionMetadata(inspection_id=inspection.id, inspected_at=inspection.inspected_at, audit_date=date.today(), source_filename=inspection.source_filename, sha256=digest, region=region)
    return AuditResponse(metadata=metadata, extracted_fields=fields, rules=rules, overall_status=overall, usp=usp, ocr_text=ocr_text)


@app.get("/api/inspections", response_model=list[InspectionSummary])
def inspections(limit: int = 25, db: Session = Depends(get_db)):
    rows = db.query(Inspection).order_by(Inspection.inspected_at.desc()).limit(min(max(limit, 1), 100)).all()
    return [InspectionSummary(inspection_id=row.id, inspected_at=row.inspected_at, source_filename=row.source_filename, sha256=row.sha256, region=row.region, overall_status=RuleStatus(row.overall_status), violation_count=len(row.violations)) for row in rows]


@app.get("/api/inspections/{inspection_id}/export-notice")
def export_notice(inspection_id: int, db: Session = Depends(get_db)):
    inspection = db.get(Inspection, inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    output = BytesIO()
    document = canvas.Canvas(output, pagesize=A4)
    document.setTitle(f"Section 36 Notice LM-{inspection.id:08d}")
    document.drawString(72, 780, "LEGAL METROLOGY COMPLIANCE NOTICE")
    document.drawString(72, 750, "Issued under Section 36 of the Legal Metrology Act, 2009")
    document.drawString(72, 710, f"Inspection: LM-{inspection.id:08d}")
    document.drawString(72, 690, f"Product file: {inspection.source_filename}")
    document.drawString(72, 670, f"Region: {inspection.region}")
    document.drawString(72, 650, f"Status: {inspection.overall_status}")
    y = 610
    for violation in inspection.violations:
        document.drawString(72, y, f"{violation.rule}: {violation.reason[:100]}")
        y -= 20
    document.save()
    return Response(content=output.getvalue(), media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="LM-{inspection.id:08d}-notice.pdf"'})


@app.get("/api/analytics/summary", response_model=AnalyticsSummary)
def analytics(db: Session = Depends(get_db)):
    rows = db.query(Inspection).all()
    by_region: dict[str, int] = {}
    for row in rows:
        by_region[row.region] = by_region.get(row.region, 0) + 1
    return AnalyticsSummary(total_inspections=len(rows), compliant_inspections=sum(row.overall_status == "PASS" for row in rows), failed_inspections=sum(row.overall_status == "FAIL" for row in rows), warning_inspections=sum(row.overall_status == "WARNING" for row in rows), by_region=by_region)
