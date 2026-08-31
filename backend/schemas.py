from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class RuleStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    WARNING = "WARNING"

class StatutoryRule(str, Enum):
    RULE_6_1_A = "Rule 6(1)(a) - Manufacturer / Packer Details"
    RULE_6_1_B = "Rule 6(1)(b) - Country of Origin"
    RULE_6_1_C = "Rule 6(1)(c) - Net Quantity"
    RULE_6_1_D = "Rule 6(1)(d) - Date of Manufacture / Packing"
    RULE_6_1_E = "Rule 6(1)(e) - Maximum Retail Price (MRP)"
    RULE_6_1_F = "Rule 6(1)(f) - Consumer Care Details"
    RULE_6_11_USP = "Rule 6(11) - Unit Sale Price (USP)"

class RuleResult(BaseModel):
    rule: StatutoryRule
    status: RuleStatus
    reason: str
    statutory_clause: Optional[str] = None
    remedy: Optional[str] = None

class DistrictMetricSummary(BaseModel):
    district_name: str
    total_inspections: int
    compliance_rate: float
    total_penalties_levied_inr: int
    top_statutory_violation: str
    repeat_offender_brands: List[str] = []

class ExecutiveAnalyticsResponse(BaseModel):
    generated_at: str
    reporting_month: str
    state_aggregate_compliance_rate: float
    total_inspections_statewide: int
    districts: List[DistrictMetricSummary]

class FSSAIVerification(BaseModel):
    is_food_product: bool = False
    license_number: Optional[str] = None
    is_license_valid_format: bool = False
    has_veg_nonveg_symbol: bool = False
    dietary_type: Optional[str] = None
    fortified_symbol_present: bool = False
    status: RuleStatus = RuleStatus.PASS
    violations: List[str] = []

class PreAuditRequest(BaseModel):
    artwork_text: str
    brand_name: Optional[str] = None

class PreAuditResponse(BaseModel):
    overall_status: RuleStatus
    rules: List[RuleResult]
    estimated_fine_inr: int

class AuditResponse(BaseModel):
    inspection_id: str
    sha256_hash: str
    overall_status: RuleStatus
    rules: List[RuleResult]
    timestamp: str
    penalty: Optional[Dict[str, Any]] = None

class BatchAuditItem(BaseModel):
    item_id: str
    filename: str
    overall_status: str
    violations_count: int
    estimated_fine_inr: int

class BatchAuditResponse(BaseModel):
    batch_id: str
    total_scanned: int
    passed_count: int
    failed_count: int
    total_compounding_exposure_inr: int
    items: List[BatchAuditItem]
    processed_at: str
