import re
from typing import List, Optional
from schemas import FSSAIVerification, RuleStatus

FOOD_KEYWORDS_RE = re.compile(r'(?i)\b(ingredients|nutrition|energy|carbohydrate|sugar|fat|protein|food|fssai|edible|snack|beverage|biscuit|oil|flour)\b')
# Strict: exactly 14 digits starting with 1 or 2 — the actual FSSAI format
FSSAI_LICENSE_RE = re.compile(r'(?i)(?:fssai|lic\.?\s*(?:no\.?)?|license)\s*[:\.]?\s*([12]\d{13})\b')
DIETARY_SYMBOL_RE = re.compile(r'(?i)\b(100%\s*veg|vegetarian|suitable\s*for\s*vegetarians|green\s*dot|non-veg|contains\s*egg|contains\s*meat)\b')
NON_SI_UNITS_RE = re.compile(r'(?i)\b\d+\s*(gm|gms|ml\.|ltr|kgs)\b')

def audit_fssai_declarations(text: str, detected_objects: Optional[List[str]] = None) -> FSSAIVerification:
    is_food = bool(FOOD_KEYWORDS_RE.search(text or ""))
    if detected_objects and any(obj.lower() in ["food", "beverage", "snack", "biscuit"] for obj in detected_objects):
        is_food = True

    if not is_food:
        return FSSAIVerification(is_food_product=False, status=RuleStatus.PASS)

    violations = []
    lic_match = FSSAI_LICENSE_RE.search(text or "")
    lic_num = lic_match.group(1) if lic_match else None

    is_lic_valid = bool(lic_num and re.fullmatch(r'[12]\d{13}', lic_num))

    if not is_lic_valid:
        violations.append("Missing or malformed 14-digit FSSAI License Number")

    dietary_match = DIETARY_SYMBOL_RE.search(text or "")
    has_dietary = bool(dietary_match)
    dietary_type = "UNKNOWN"
    if has_dietary and dietary_match:
        matched_str = dietary_match.group(0).lower()
        if "non-veg" in matched_str or "egg" in matched_str or "meat" in matched_str:
            dietary_type = "NON_VEGETARIAN"
        else:
            dietary_type = "VEGETARIAN"
    else:
        violations.append("Missing mandatory Veg / Non-Veg dietary declaration symbol (WARNING)")

    if NON_SI_UNITS_RE.search(text or ""):
        violations.append("Food package Net Quantity uses non-compliant metric unit symbols")

    overall_status = RuleStatus.FAIL if not is_lic_valid else RuleStatus.WARNING if violations else RuleStatus.PASS
    return FSSAIVerification(
        is_food_product=True,
        license_number=lic_num,
        is_license_valid_format=is_lic_valid,
        has_veg_nonveg_symbol=has_dietary,
        dietary_type=dietary_type,
        status=overall_status,
        violations=violations
    )
