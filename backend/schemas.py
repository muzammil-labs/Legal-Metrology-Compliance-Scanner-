from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class RuleStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    WARNING = "WARNING"


class Unit(str, Enum):
    G = "g"
    KG = "kg"
    ML = "ml"
    L = "l"
    N = "N"
    U = "U"


class StatutoryRule(str, Enum):
    RULE_5 = "Rule 5"
    RULE_6_1_A = "Rule 6(1)(a)"
    RULE_6_1_B = "Rule 6(1)(b)"
    RULE_6_1_C = "Rule 6(1)(c)"
    RULE_6_1_D = "Rule 6(1)(d)"
    RULE_6_1_E = "Rule 6(1)(e)"
    RULE_6_1_F = "Rule 6(1)(f)"
    RULE_6_11 = "Rule 6(11)"
    RULE_5_PDP = "Rule 5/9 (Font / PDP)"
    BILINGUAL = "Bilingual Consistency"


class BoundingBox(BaseModel):
    model_config = ConfigDict(extra="forbid")
    x_min: float = Field(ge=0)
    y_min: float = Field(ge=0)
    x_max: float = Field(ge=0)
    y_max: float = Field(ge=0)


class ExtractedField(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1)
    value: str
    bounding_box: BoundingBox | None = None
    confidence: float | None = Field(default=None, ge=0, le=1)


class InspectionMetadata(BaseModel):
    model_config = ConfigDict(extra="forbid")
    inspection_id: int | None = None
    inspected_at: datetime
    audit_date: date
    source_filename: str
    sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    region: str = "Unknown"
    gps_location: str | None = None
    source: str = "image-upload"


class RuleResult(BaseModel):
    model_config = ConfigDict(extra="forbid")
    rule: StatutoryRule
    status: RuleStatus
    evidence: list[str] = Field(default_factory=list)
    reason: str
    calculated_values: dict[str, Any] = Field(default_factory=dict)


class USPResult(BaseModel):
    model_config = ConfigDict(extra="forbid")
    applicable: bool
    declared_value: Decimal | None = None
    declared_unit: Unit | None = None
    calculated_value: Decimal | None = None
    quantity_in_base_unit: Decimal | None = None
    ratio: Decimal | None = None
    within_tolerance: bool | None = None


class PenaltyEstimate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    sections_violated: list[str]
    estimated_fine_range: str
    jan_vishwas_eligible: bool = False
    grace_period_days: str | None = None
    director_liability: bool = False


class BilingualVerification(BaseModel):
    model_config = ConfigDict(extra="forbid")
    english_mrp: float | None = None
    hindi_mrp: float | None = None
    english_qty: str | None = None
    hindi_qty: str | None = None
    hindi_taxes_included: bool | None = None
    mrp_match: bool | None = None
    qty_match: bool | None = None
class BilingualVerification(BaseModel):
    is_bilingual: bool = False
    english_declared_price: float | None = None
    hindi_declared_price: float | None = None
    price_match: bool = True
    status: RuleStatus = RuleStatus.PASS
    discrepancy_reason: str | None = None

class OffenceType(str, Enum):
    PROCEDURAL_FIRST_TIME = "PROCEDURAL_FIRST_TIME"
    REPEAT_METRIC_FRAUD = "REPEAT_METRIC_FRAUD"


class FineEstimation(BaseModel):
    model_config = ConfigDict(extra="forbid")
    min_penalty_inr: int
    max_penalty_inr: int
    legal_section: str
    offence_type: OffenceType


class PreAuditRequest(BaseModel):
    text: str | None = None
    json_artwork: dict | None = None


class PreAuditResponse(BaseModel):
    compliant: bool
    fine_risk: FineEstimation | None = None
    analysis: list[RuleResult]
    mandatory_fixes: list[str] = Field(default_factory=list)
    bilingual_verification: BilingualVerification | None = None


class AuditResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    metadata: InspectionMetadata
    extracted_fields: list[ExtractedField] = Field(default_factory=list)
    rules: list[RuleResult]
    overall_status: RuleStatus
    trust_score: int = Field(default=100, ge=0, le=100)
    usp: USPResult
    bilingual_verification: BilingualVerification | None = None
    penalty: PenaltyEstimate | None = None
    ocr_text: str
    bilingual_verification: BilingualVerification | None = None


class InspectionSummary(BaseModel):
    inspection_id: int
    inspected_at: datetime
    source_filename: str
    sha256: str
    region: str
    gps_location: str | None = None
    trust_score: int = 100
    overall_status: RuleStatus
    violation_count: int


class ViolationCount(BaseModel):
    rule: str
    count: int

class AnalyticsSummary(BaseModel):
    total_inspections: int
    compliant_inspections: int
    failed_inspections: int
    warning_inspections: int
    compliance_rate: float = 0.0
    active_districts: int = 0
    top_violations: list[ViolationCount] = Field(default_factory=list)
    violation_breakdown: dict[str, int] = Field(default_factory=dict)
    regional_non_compliance: dict[str, int] = Field(default_factory=dict)
    by_region: dict[str, int] = Field(default_factory=dict)
    by_rule_infractions: dict[str, int] = Field(default_factory=dict)


class NoticeResponse(BaseModel):
    inspection_id: int
    notice_type: str
    generated_at: datetime
    filename: str


class BatchAuditItem(BaseModel):
    sku_id: str
    filename: str
    overall_status: RuleStatus
    trust_score: int
    violation_count: int
    rule_results: list[RuleResult]
    bilingual_verification: BilingualVerification | None = None


class BatchAuditResponse(BaseModel):
    batch_id: str
    total_skus: int
    passed_skus: int
    failed_skus: int
    compliance_badge_eligible: bool
    items: list[BatchAuditItem]
