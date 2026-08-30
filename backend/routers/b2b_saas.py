import time
from datetime import date
from typing import Dict, List
from fastapi import APIRouter, Header, HTTPException, Depends
from pydantic import BaseModel, Field

from schemas import RuleResult, USPResult, PenaltyEstimate, RuleStatus
from services.rule_engine import audit_text

router = APIRouter()

# In-memory store for rate limiting: API Key -> List of timestamps
RATE_LIMIT_STORE: Dict[str, List[float]] = {}

def check_rate_limit(x_api_key: str = Header(None)):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="X-API-Key header missing")

    if x_api_key.startswith("trial_"):
        limit = 100
    elif x_api_key.startswith("enterprise_"):
        limit = 10000
    else:
        raise HTTPException(status_code=401, detail="Invalid API Key format")

    current_time = time.time()

    if x_api_key not in RATE_LIMIT_STORE:
        RATE_LIMIT_STORE[x_api_key] = []

    # Remove timestamps older than 60 seconds
    RATE_LIMIT_STORE[x_api_key] = [
        ts for ts in RATE_LIMIT_STORE[x_api_key]
        if current_time - ts < 60.0
    ]

    if len(RATE_LIMIT_STORE[x_api_key]) >= limit:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    RATE_LIMIT_STORE[x_api_key].append(current_time)
    return x_api_key


class PreAuditRequest(BaseModel):
    ocr_text: str
    font_height_mm: float | None = None

class PreAuditResponse(BaseModel):
    overall_status: RuleStatus
    rules: list[RuleResult]
    mandatory_fixes: list[RuleResult]
    penalty: PenaltyEstimate | None
    usp: USPResult

@router.post("/api/v1/pre-audit", response_model=PreAuditResponse)
def pre_audit(
    request: PreAuditRequest,
    api_key: str = Depends(check_rate_limit)
):
    rules, usp, fields, penalty = audit_text(
        request.ocr_text,
        audit_date=date.today(),
        font_height_mm=request.font_height_mm
    )

    overall_status = RuleStatus.PASS
    if any(r.status == RuleStatus.FAIL for r in rules):
        overall_status = RuleStatus.FAIL
    elif any(r.status == RuleStatus.WARNING for r in rules):
        overall_status = RuleStatus.WARNING

    mandatory_fixes = [r for r in rules if r.status == RuleStatus.FAIL]

    return PreAuditResponse(
        overall_status=overall_status,
        rules=rules,
        mandatory_fixes=mandatory_fixes,
        penalty=penalty,
        usp=usp
    )
