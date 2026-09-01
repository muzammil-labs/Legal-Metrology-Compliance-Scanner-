import os
import io
import hashlib
from datetime import datetime
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
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

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

app = FastAPI(title="Legal Metrology Compliance Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

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

    # We also check the file extension/content type, but size comes first!
    if not file.filename.endswith((".png", ".jpg", ".jpeg", ".webp")):
         raise HTTPException(status_code=400, detail="Invalid image format")

    text, _ = extract_label_with_gemini(content)
    rules, _, _, _, _ = audit_text(text)
    fssai_info = audit_fssai_declarations(text)

    overall_status = RuleStatus.PASS
    if any(r.status == RuleStatus.FAIL for r in rules) or fssai_info.status == RuleStatus.FAIL:
        overall_status = RuleStatus.FAIL
    elif any(r.status == RuleStatus.WARNING for r in rules):
        overall_status = RuleStatus.WARNING

    sha256_hash = hashlib.sha256(content).hexdigest()
    inspection = InspectionRecord(
        sha256=sha256_hash,
        overall_status=overall_status.value,
        ocr_text=text,
        inspected_at=datetime.utcnow()
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)

    return AuditResponse(
        inspection_id=str(inspection.id),
        sha256_hash=sha256_hash,
        overall_status=overall_status,
        rules=rules,
        timestamp=inspection.inspected_at.isoformat(),
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

        text, _ = extract_label_with_gemini(content)
        rules, _, _, _, _ = audit_text(text)
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
    rules, _, _, _, _ = audit_text(payload.artwork_text)
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

@app.get("/api/v1/analytics/export/pdf")
def export_pdf_report(
    db: Session = Depends(get_db),
    current_role: UserRole = Depends(require_role([UserRole.DISTRICT_MAGISTRATE, UserRole.CENTRAL_ADMIN, UserRole.ADMIN]))
):
    total_records = db.query(InspectionRecord).count()
    summary = ExecutiveAnalyticsResponse(
        generated_at=datetime.utcnow().isoformat(),
        reporting_month=datetime.utcnow().strftime("%B %Y"),
        state_aggregate_compliance_rate=91.5,
        total_inspections_statewide=total_records,
        districts=[
            DistrictMetricSummary(
                district_name="Central District",
                total_inspections=total_records,
                compliance_rate=90.0,
                total_penalties_levied_inr=25000,
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
    summary = ExecutiveAnalyticsResponse(
        generated_at=datetime.utcnow().isoformat(),
        reporting_month=datetime.utcnow().strftime("%B %Y"),
        state_aggregate_compliance_rate=91.5,
        total_inspections_statewide=total_records,
        districts=[
            DistrictMetricSummary(
                district_name="Central District",
                total_inspections=total_records,
                compliance_rate=90.0,
                total_penalties_levied_inr=25000,
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
