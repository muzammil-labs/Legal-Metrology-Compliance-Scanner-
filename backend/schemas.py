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
    RULE_6_10_ECOMMERCE = "Rule 6(10) - E-Commerce Digital Declarations"
    RULE_5 = "Rule 5 - Numeral & Letter Height"
    RULE_5_PDP = "Rule 5 - PDP Area Font Size"
    BILINGUAL = "Bilingual Consistency"
    FSSAI = "FSSAI Safety & Standards Declaration"

class RuleResult(BaseModel):
    rule: StatutoryRule
    status: RuleStatus
    reason: str
    statutory_clause: Optional[str] = None
    remedy: Optional[str] = None
    evidence: Optional[List[str]] = None

class DigitalDeclarationItem(BaseModel):
    declaration_name: str
    status: str
    extracted_value: Optional[str] = None
    statutory_clause: str
    violation_reason: Optional[str] = None

class ECommerceAuditRequest(BaseModel):
    platform: str
    listing_text: str
    product_url: Optional[str] = None

class ECommerceAuditResponse(BaseModel):
    platform: str
    overall_status: str
    total_violations: int
    declarations: List[DigitalDeclarationItem]
    compounding_fine_exposure_inr: int
    audited_at: str

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
    dietary_type: Optional[str] = None  # "VEGETARIAN", "NON_VEGETARIAN", "UNKNOWN"
    fortified_symbol_present: bool = False
    status: RuleStatus = RuleStatus.PASS
    violations: List[str] = []

class PenaltyEstimate(BaseModel):
    sections_violated: List[str] = []
    estimated_fine_range: str = ""
    jan_vishwas_eligible: bool = False
    grace_period_days: Optional[str] = None
    director_liability: bool = False
    legal_section: str = "Section 36, Legal Metrology Act, 2009"
    min_penalty_inr: int = 0
    max_penalty_inr: int = 0

class PDPFontEvaluation(BaseModel):
    estimated_pdp_area_sq_cm: float = 0.0
    mandatory_min_font_height_mm: float = 1.0
    measured_font_height_mm: float = 0.0
    font_size_compliance: str = "PASS"
    details: str = ""

class PreAuditRequest(BaseModel):
    artwork_text: str
    brand_name: Optional[str] = None

class PreAuditResponse(BaseModel):
    overall_status: RuleStatus
    rules: List[RuleResult]
    estimated_fine_inr: int
    fssai_verification: Optional[FSSAIVerification] = None

class DeceptionFlag(BaseModel):
    flag_type: str  # "TINY_TEXT", "LOW_CONTRAST", "BURIED_INFO", "FONT_TOO_SMALL", "HIDDEN_QUANTITY"
    description: str
    severity: str  # "LOW", "MEDIUM", "HIGH"
    field_affected: str

class DeceptionAnalysis(BaseModel):
    has_deceptive_patterns: bool = False
    flags: List[DeceptionFlag] = []
    deception_risk_score: int = 0  # 0-100
    summary: str = "No deceptive patterns detected."

class AuditResponse(BaseModel):
    inspection_id: str
    sha256_hash: str
    overall_status: RuleStatus
    rules: List[RuleResult]
    timestamp: str
    ocr_text: Optional[str] = None
    penalty: Optional[Dict[str, Any]] = None
    fssai_verification: Optional[FSSAIVerification] = None
    deception_analysis: Optional[DeceptionAnalysis] = None

class BatchAuditItem(BaseModel):
    item_id: str
    filename: str
    overall_status: str
    violations_count: int
    estimated_fine_inr: int
    fssai_verification: Optional[FSSAIVerification] = None

class BatchAuditResponse(BaseModel):
    batch_id: str
    total_scanned: int
    passed_count: int
    failed_count: int
    total_compounding_exposure_inr: int
    items: List[BatchAuditItem]
    processed_at: str
