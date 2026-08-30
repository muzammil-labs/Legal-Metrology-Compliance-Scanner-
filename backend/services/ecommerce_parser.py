import re
from datetime import date

try:
    from backend.schemas import RuleResult, RuleStatus, StatutoryRule
    from backend.services.rule_engine import (
        NET_QTY_RE, MRP_RE, TAX_RE, PIN_RE, CARE_DESIGNATION_RE, ADDRESS_REF_RE, PHONE_RE, EMAIL_RE, ADDRESS_PATTERNS
    )
except ModuleNotFoundError:
    from schemas import RuleResult, RuleStatus, StatutoryRule
    from services.rule_engine import (
        NET_QTY_RE, MRP_RE, TAX_RE, PIN_RE, CARE_DESIGNATION_RE, ADDRESS_REF_RE, PHONE_RE, EMAIL_RE, ADDRESS_PATTERNS
    )

ORIGIN_DIGITAL_RE = re.compile(r"(?:country\s+of\s+origin|made\s+in|manufactured\s+in)\s*:\s*[a-zA-Z]+", re.I)

def result(rule: StatutoryRule, status: RuleStatus, reason: str, values: dict | None = None, evidence: list[str] | None = None) -> RuleResult:
    return RuleResult(
        rule=rule,
        status=status,
        reason=reason,
        calculated_values=values or {},
        evidence=evidence or []
    )

def audit_digital_listing(text: str) -> list[RuleResult]:
    rules = []

    mrp_match = MRP_RE.search(text)
    tax_ok = bool(mrp_match and TAX_RE.search(text))
    rules.append(
        result(
            StatutoryRule.RULE_6_1_E,
            RuleStatus.PASS if tax_ok else RuleStatus.FAIL,
            "Digital listing shows MRP with required tax-inclusion declaration."
            if tax_ok
            else "Digital listing is missing MRP or exact tax-inclusion declaration '(incl. of all taxes)'.",
        )
    )

    quantity_match = NET_QTY_RE.search(text)
    rules.append(
        result(
            StatutoryRule.RULE_6_1_C,
            RuleStatus.PASS if quantity_match else RuleStatus.FAIL,
            "Digital listing specifies net quantity in recognized SI units."
            if quantity_match
            else "Digital listing is missing net quantity declaration in SI metric units.",
        )
    )

    has_pin = bool(PIN_RE.search(text))
    address_parts = sum(bool(pattern.search(text)) for pattern in ADDRESS_PATTERNS)
    addr_ok = has_pin and address_parts >= 2
    rules.append(
        result(
            StatutoryRule.RULE_6_1_A,
            RuleStatus.PASS if addr_ok else RuleStatus.FAIL,
            "Digital listing includes complete manufacturer/packer address with PIN code."
            if addr_ok
            else "Digital listing is missing a complete manufacturer/packer address or 6-digit PIN code.",
        )
    )

    has_origin = bool(ORIGIN_DIGITAL_RE.search(text) or "country of origin" in text.lower())
    rules.append(
        result(
            StatutoryRule.RULE_6_1_B,
            RuleStatus.PASS if has_origin else RuleStatus.FAIL,
            "Digital listing contains Country of Origin declaration."
            if has_origin
            else "Digital listing is missing Country of Origin declaration.",
        )
    )

    has_phone = bool(PHONE_RE.search(text))
    has_email = bool(EMAIL_RE.search(text))
    care_ok = has_phone and has_email
    care_missing = []
    if not has_phone:
        care_missing.append("phone helpline")
    if not has_email:
        care_missing.append("email address")

    rules.append(
        result(
            StatutoryRule.RULE_6_1_F,
            RuleStatus.PASS if care_ok else RuleStatus.FAIL,
            "Digital listing provides consumer care phone and email."
            if care_ok
            else f"Digital listing consumer care contact incomplete. Missing: {', '.join(care_missing)}.",
        )
    )

    return rules
