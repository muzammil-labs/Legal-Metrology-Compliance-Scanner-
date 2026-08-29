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


class AuditResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    metadata: InspectionMetadata
    extracted_fields: list[ExtractedField] = Field(default_factory=list)
    rules: list[RuleResult]
    overall_status: RuleStatus
    usp: USPResult
    ocr_text: str


class InspectionSummary(BaseModel):
    inspection_id: int
    inspected_at: datetime
    source_filename: str
    sha256: str
    region: str
    overall_status: RuleStatus
    violation_count: int


class AnalyticsSummary(BaseModel):
    total_inspections: int
    compliant_inspections: int
    failed_inspections: int
    warning_inspections: int
    by_region: dict[str, int]


class NoticeResponse(BaseModel):
    inspection_id: int
    notice_type: str
    generated_at: datetime
    filename: str
