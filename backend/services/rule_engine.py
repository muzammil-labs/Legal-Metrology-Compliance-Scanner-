from datetime import date, datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
import re

try:
    from backend.schemas import ExtractedField, RuleResult, RuleStatus, StatutoryRule, Unit, USPResult, PenaltyEstimate
except ModuleNotFoundError:
    from schemas import ExtractedField, RuleResult, RuleStatus, StatutoryRule, Unit, USPResult, PenaltyEstimate

ENTITY_PREFIX_RE = re.compile(r"^\s*(?:mfg\.?\s+by|manufactured\s+by|packed\s+by|pkd\.?\s+by|imported\s+by|marketed\s+by)\b", re.I)
PIN_RE = re.compile(r"\b[1-9][0-9]{5}\b")
PHONE_RE = re.compile(r"\b(?:\+91[ -]?)?[6-9][0-9]{9}\b|\b1800[ -]?[0-9]{3}[ -]?[0-9]{4}\b")
EMAIL_RE = re.compile(r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b")
NET_QTY_RE = re.compile(r"\b([0-9]+(?:\.[0-9]+)?)\s*(g|kg|ml|mL|l|L|N|U)\b")
INVALID_UNIT_RE = re.compile(r"\b(?:gm|gms|gm\.|g\.|ml\.|ML|m\.l\.|ltr|litres|lit\.|kg\.|kgs|k\.g\.)\b", re.I)
MRP_RE = re.compile(r"\bMRP\s*(?:RS\.?|INR|₹)?\s*([0-9]+(?:\.[0-9]{1,2})?)\b", re.I)
TAX_RE = re.compile(r"\(\s*(?:incl\.?\s+of\s+all\s+taxes|inclusive\s+of\s+all\s+taxes)\s*\)", re.I)
USP_RE = re.compile(r"(?:₹|Rs\.?|INR)?\s*([0-9]+(?:\.[0-9]{1,4})?)\s*/\s*(g|kg|ml|l)\b", re.I)
DATE_RE = re.compile(r"\b(0[1-9]|1[0-2])\s*/\s*(20[0-9]{2}|[0-9]{2})\b")


def result(rule: StatutoryRule, status: RuleStatus, reason: str, evidence=None, values=None) -> RuleResult:
    return RuleResult(rule=rule, status=status, reason=reason, evidence=evidence or [], calculated_values=values or {})


def _quantity(text: str):
    match = NET_QTY_RE.search(text)
    if not match:
        return None
    return Decimal(match.group(1)), match.group(2)


def _base_quantity(quantity: Decimal, unit: str):
    if unit.lower() == "kg":
        return quantity * Decimal("1000"), "g"
    if unit.lower() == "l":
        return quantity * Decimal("1000"), "ml"
    return quantity, unit.lower()


def audit_usp(text: str, mrp: Decimal | None, quantity_data) -> tuple[RuleResult, USPResult]:
    if not quantity_data or mrp is None:
        usp = USPResult(applicable=False)
        return result(StatutoryRule.RULE_6_11, RuleStatus.WARNING, "USP cannot be calculated without both MRP and net quantity."), usp
    quantity, unit = quantity_data
    base_quantity, base_unit = _base_quantity(quantity, unit)
    applicable = base_quantity > Decimal("1000") or (base_unit in {"g", "ml"} and base_quantity > Decimal("1000")) or len(re.findall(r"\b(?:pieces?|pcs|units?)\b", text, re.I)) > 1
    declared = USP_RE.search(text)
    if not applicable:
        usp = USPResult(applicable=False, quantity_in_base_unit=base_quantity)
        return result(StatutoryRule.RULE_6_11, RuleStatus.PASS, "USP is not mandatory for this pack size.", values={"base_unit": base_unit}), usp
    expected_unit = "kg" if base_unit == "g" and base_quantity >= Decimal("1000") else "l" if base_unit == "ml" and base_quantity >= Decimal("1000") else base_unit
    expected_quantity = base_quantity / Decimal("1000") if expected_unit in {"kg", "l"} else base_quantity
    calculated = (mrp / expected_quantity).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if not declared:
        usp = USPResult(applicable=True, calculated_value=calculated, quantity_in_base_unit=base_quantity, ratio=calculated)
        return result(StatutoryRule.RULE_6_11, RuleStatus.FAIL, "Required Unit Sale Price is missing.", values={"expected": str(calculated), "unit": expected_unit}), usp
    try:
        declared_value = Decimal(declared.group(1))
    except InvalidOperation:
        declared_value = None
    declared_unit = declared.group(2).lower()
    within = declared_value is not None and declared_unit == expected_unit and abs(declared_value - calculated) <= Decimal("0.01")
    usp = USPResult(applicable=True, declared_value=declared_value, declared_unit=Unit(declared_unit) if declared_unit in {u.value for u in Unit} else None, calculated_value=calculated, quantity_in_base_unit=base_quantity, ratio=calculated, within_tolerance=within)
    status = RuleStatus.PASS if within else RuleStatus.FAIL
    reason = "Declared USP matches the deterministic calculation." if within else "Declared USP has the wrong unit or differs from the calculated value by more than INR 0.01."
    return result(StatutoryRule.RULE_6_11, status, reason, evidence=[declared.group(0)], values={"expected": str(calculated), "unit": expected_unit}), usp


def audit_text(text: str, audit_date: date | None = None) -> tuple[list[RuleResult], USPResult, list[ExtractedField], PenaltyEstimate | None]:
    audit_date = audit_date or date.today()
    penalty = None
    quantity_data = _quantity(text)
    mrp_match = MRP_RE.search(text)
    mrp = Decimal(mrp_match.group(1)) if mrp_match else None
    rules: list[RuleResult] = []
    has_prefix = ENTITY_PREFIX_RE.search(text)
    has_pin = PIN_RE.search(text)
    address_parts = sum(bool(re.search(pattern, text, re.I)) for pattern in [r"\b(?:road|street|plot|industrial|estate|premises)\b", r"\b(?:city|district|nagar|town)\b", r"\b(?:state|pradesh|maharashtra|delhi|karnataka|gujarat)\b"])
    imported = bool(re.search(r"^\s*imported\s+by\b", text, re.I))
    has_origin = bool(re.search(r"country\s+of\s+origin\s*:", text, re.I))
    rules.append(result(StatutoryRule.RULE_6_1_A, RuleStatus.PASS if has_prefix and has_pin and address_parts >= 2 and (not imported or has_origin) else RuleStatus.FAIL, "Entity prefix, address, PIN, and import origin declaration are present." if has_prefix and has_pin and address_parts >= 2 and (not imported or has_origin) else "Manufacturer/packer/importer prefix, complete address, PIN, or country of origin is missing."))
    generic = bool(re.search(r"\b(?:flour|noodles|oil|biscuit|biscuits|rice|sugar|soap|detergent|tea|wheat|milk|आटा|तेल|चाय)\b", text, re.I))
    rules.append(result(StatutoryRule.RULE_6_1_B, RuleStatus.PASS if generic else RuleStatus.FAIL, "Generic commodity name is present." if generic else "A generic or common commodity name is missing."))
    invalid = INVALID_UNIT_RE.search(text)
    rules.append(result(StatutoryRule.RULE_6_1_C, RuleStatus.FAIL if invalid or not quantity_data else RuleStatus.PASS, f"Invalid unit notation detected: {invalid.group(0)}." if invalid else "Net quantity uses a recognized unit." if quantity_data else "Net quantity declaration is missing.", evidence=[invalid.group(0)] if invalid else []))
    date_match = DATE_RE.search(text)
    valid_date = bool(date_match)
    if date_match:
        year = int(date_match.group(2))
        year += 2000 if year < 100 else 0
        valid_date = year <= audit_date.year
    rules.append(result(StatutoryRule.RULE_6_1_D, RuleStatus.PASS if valid_date else RuleStatus.FAIL, "Manufacture/import date is present and not in the future." if valid_date else "A valid MM/YYYY or MM/YY date is missing or is in the future."))
    tax_ok = bool(mrp_match and TAX_RE.search(text))
    rules.append(result(StatutoryRule.RULE_6_1_E, RuleStatus.PASS if tax_ok else RuleStatus.FAIL, "MRP includes the required tax-inclusion declaration." if tax_ok else "MRP is missing or does not include the exact tax-inclusion declaration."))
    care_ok = bool(re.search(r"consumer\s+care|grievance\s+officer", text, re.I) and (has_pin or re.search(r"postal|address", text, re.I)) and PHONE_RE.search(text) and EMAIL_RE.search(text))
    rules.append(result(StatutoryRule.RULE_6_1_F, RuleStatus.PASS if care_ok else RuleStatus.FAIL, "Consumer grievance designation, address, phone, and email are present." if care_ok else "Complete consumer grievance contact channels are missing."))
    usp_rule, usp = audit_usp(text, mrp, quantity_data)
    rules.append(usp_rule)
    fields = [ExtractedField(name="ocr_text", value=text)]
    if quantity_data:
        fields.append(ExtractedField(name="net_quantity", value=f"{quantity_data[0]} {quantity_data[1]}"))
    if mrp is not None:
        fields.append(ExtractedField(name="mrp", value=str(mrp)))
    failed_rules = [r for r in rules if r.status == RuleStatus.FAIL]
    if failed_rules:
        penalty = PenaltyEstimate(sections_violated=["Section 36", "Section 49"], estimated_fine_range="₹25,000 - ₹50,000")

    return rules, usp, fields, penalty
