import uuid
import time
from fastapi import APIRouter, Depends, HTTPException
from schemas import PreAuditRequest, PreAuditResponse, RuleStatus, RuleResult
from services.auth import validate_b2b_api_key
from services.rule_engine import audit_text, calculate_compounding_fine

router = APIRouter()

@router.post("/api/v1/pre-audit", response_model=PreAuditResponse)
async def pre_audit_endpoint(
    payload: PreAuditRequest,
    api_key: str = Depends(validate_b2b_api_key)
):
    rules, _, _, _, _ = audit_text(payload.artwork_text)
    overall_status = RuleStatus.PASS
    if any(r.status == RuleStatus.FAIL for r in rules):
        overall_status = RuleStatus.FAIL
    elif any(r.status == RuleStatus.WARNING for r in rules):
        overall_status = RuleStatus.WARNING

    fine_info = calculate_compounding_fine(rules)
    return PreAuditResponse(
        overall_status=overall_status,
        rules=rules,
        estimated_fine_inr=fine_info.get("estimated_fine_inr", 0)
    )
