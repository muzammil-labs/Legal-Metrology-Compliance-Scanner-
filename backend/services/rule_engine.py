from datetime import date
import re
from services.bilingual_auditor import audit_bilingual_consistency
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

try:
    from backend.schemas import ExtractedField, RuleResult, RuleStatus, StatutoryRule, Unit, USPResult, PenaltyEstimate
except ModuleNotFoundError:
    from schemas import ExtractedField, RuleResult, RuleStatus, StatutoryRule, Unit, USPResult, PenaltyEstimate

# ---------------------------------------------------------------------------
# Multilingual English & Hindi statutory keyword patterns
# NOTE: ENTITY_PREFIX_RE intentionally omits ^ anchor — allows mid-label blocks
# ---------------------------------------------------------------------------
ENTITY_PREFIX_RE = re.compile(
    r"(?:mfg\.?\s+by|manufactured\s+by|packed\s+by|pkd\.?\s+by|imported\s+by|"
    r"marketed\s+by|निर्मित|पैक्ड|आयातित)",
    re.I | re.UNICODE,
)
PIN_RE = re.compile(r"\b[1-9][0-9]{5}\b")
PHONE_RE = re.compile(r"\b(?:\+91[ -]?)?[6-9][0-9]{9}\b|\b1800[ -]?[0-9]{3}[ -]?[0-9]{4}\b")
EMAIL_RE = re.compile(r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b")

# Net quantity: accepts g, kg, ml, mL, l, L, N, U, m, cm, mm — per PCR 2011 & skill spec
NET_QTY_RE = re.compile(
    r"\b([0-9]+(?:\.[0-9]+)?)\s*(g|kg|ml|mL|l|L|N|U|m|cm|mm|ग्राम|किग्रा|मिली|लीटर)\b",
    re.UNICODE,
)
# Reject all non-SI / legacy unit notations
INVALID_UNIT_RE = re.compile(r"(?:\b|\s)(?:gm|gms|gm\.|g\.|ml\.|ML|m\.l\.|ltr|litres|lit\.|kg\.|kgs|k\.g\.)(?!\w)", re.I)
INVALID_UNIT_RE = re.compile(
    r"(?:\b|\s)(?:gm|gms|gm\.|g\.|ml\.|ML|m\.l\.|ltr|litres|lit\.|kg\.|kgs|k\.g\.)(?:\b|\s|$)",
    re.I,
)
MRP_RE = re.compile(
    r"\b(?:MRP|M\.R\.P\.|MAX\.?\s*RETAIL|अधिकतम\s*खुदरा\s*मूल्य)\s*(?:RS\.?|INR|₹)?\s*([0-9]+(?:\.[0-9]{1,2})?)\b",
    re.I | re.UNICODE,
)
TAX_RE = re.compile(
    r"\(\s*(?:incl\.?\s+of\s+all\s+taxes|inclusive\s+of\s+all\s+taxes|सभी\s*कर\s*सहित)\s*\)",
    re.I | re.UNICODE,
)
USP_RE = re.compile(
    r"(?:₹|Rs\.?|INR)?\s*([0-9]+(?:\.[0-9]{1,4})?)\s*/\s*(g|kg|ml|l|ग्राम|किग्रा|लीटर)\b",
    re.I | re.UNICODE,
)
DATE_RE = re.compile(r"\b(0[1-9]|1[0-2])\s*/\s*(20[0-9]{2}|[0-9]{2})\b")

# ASCII commodity names — \b word boundaries work for ASCII
COMMODITY_ASCII_RE = re.compile(
    r"\b(?:"
    # Grains, flours, cereals
    r"flour|atta|wheat|rice|dal|lentil|lentils|oats|semolina|maida|ragi|jowar|bajra|cornflour|suji|"
    # Oils & fats
    r"oil|ghee|butter|margarine|vanaspati|"
    # Spices, condiments, salt
    r"spice|spices|masala|salt|pepper|turmeric|chilli|coriander|cumin|mustard|"
    # Sweeteners
    r"sugar|jaggery|honey|syrup|"
    # Beverages
    r"tea|coffee|milk|juice|water|beverage|drink|"
    # Snacks & processed
    r"biscuit|biscuits|noodles|pasta|bread|cake|chips|snack|snacks|namkeen|"
    # Dairy
    r"paneer|curd|yogurt|cheese|cream|"
    # Legumes & pulses
    r"pulse|pulses|chickpea|rajma|moong|chana|"
    # Personal care & cleaning
    r"soap|detergent|shampoo|toothpaste|toothbrush"
    r")\b",
    re.I,
)
# Devanagari commodity names — \b does NOT match Unicode boundaries; use lookaround instead
COMMODITY_HINDI_RE = re.compile(
    r"(?:^|[\s,।])(?:"
    r"चावल|आटा|दाल|तेल|चाय|गेहूं|नमक|चीनी|मसाला|बिस्किट|नूडल्स|मैदा|रवा|सूजी|"
    r"राजमा|मूंग|चना|उड़द|बेसन|नारियल|सरसों|मूंगफली|तिल|जीरा|हल्दी|धनिया"
    r")(?:[\s,।]|$)",
    re.UNICODE,
)

ADDRESS_PART_RES = [
    re.compile(r"\b(?:road|street|plot|industrial|estate|premises|मार्ग|रोड|नगर)\b", re.I | re.UNICODE),
    re.compile(r"\b(?:city|district|nagar|town|शहर|जिला)\b", re.I | re.UNICODE),
    re.compile(r"\b(?:state|pradesh|maharashtra|delhi|karnataka|gujarat|tamil\s*nadu|telangana|west\s*bengal|uttar\s*pradesh|rajasthan|punjab|haryana)\b", re.I | re.UNICODE),
]
IMPORTED_RE = re.compile(r"imported\s+by|आयातित", re.I | re.UNICODE)
ORIGIN_RE = re.compile(r"(?:country\s+of\s+origin|मूल\s*देश)\s*:", re.I | re.UNICODE)
CARE_DESIGNATION_RE = re.compile(r"consumer\s+care|grievance\s+officer|उपभोक्ता\s*सेवा", re.I | re.UNICODE)
ADDRESS_REF_RE = re.compile(r"postal|address|पता", re.I | re.UNICODE)
PIECES_RE = re.compile(r"\b(?:pieces?|pcs|units?)\b", re.I | re.UNICODE)

ADDRESS_PATTERN_1_RE = re.compile(r"\b(?:road|street|plot|industrial|estate|premises|मार्ग|रोड|नगर)\b", re.I | re.UNICODE)
ADDRESS_PATTERN_2_RE = re.compile(r"\b(?:city|district|nagar|town|शहर|जिला)\b", re.I | re.UNICODE)
ADDRESS_PATTERN_3_RE = re.compile(r"\b(?:state|pradesh|maharashtra|delhi|karnataka|gujarat|tamil\s*nadu|telangana|west\s*bengal|uttar\s*pradesh|rajasthan|punjab|haryana)\b", re.I | re.UNICODE)
ADDRESS_PATTERNS = [ADDRESS_PATTERN_1_RE, ADDRESS_PATTERN_2_RE, ADDRESS_PATTERN_3_RE]

IMPORTED_RE_INLINE = re.compile(r"imported\s+by|आयातित", re.I | re.UNICODE)
COUNTRY_ORIGIN_RE = re.compile(r"(?:country\s+of\s+origin|मूल\s*देश)\s*:", re.I | re.UNICODE)

CARE_DESIGNATION_RE = re.compile(r"consumer\s+care|grievance\s+officer|उपभोक्ता\s*सेवा", re.I | re.UNICODE)
ADDRESS_REF_RE = re.compile(r"postal|address|पता", re.I | re.UNICODE)
PIECES_RE = re.compile(r"\b(?:pieces?|pcs|units?)\b", re.I | re.UNICODE)

def _has_commodity(text: str) -> bool:
    """Returns True if the text contains a recognized generic commodity name (English or Hindi)."""
    return bool(COMMODITY_ASCII_RE.search(text) or COMMODITY_HINDI_RE.search(text))

def result(rule: StatutoryRule, status: RuleStatus, reason: str, evidence=None, values=None) -> RuleResult:
    return RuleResult(rule=rule, status=status, reason=reason, evidence=evidence or [], calculated_values=values or {})

def _quantity(text: str):
    match = NET_QTY_RE.search(text)
    if not match:
        return None
    raw_val = match.group(1)
    raw_unit = match.group(2).lower()
    unit_map = {"ग्राम": "g", "किग्रा": "kg", "मिली": "ml", "लीटर": "l"}
    normalized_unit = unit_map.get(raw_unit, raw_unit)
    return Decimal(raw_val), normalized_unit

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
    applicable = (
        base_quantity > Decimal("1000")
        or (base_unit in {"g", "ml"} and base_quantity > Decimal("1000"))
        or len(PIECES_RE.findall(text)) > 1
    )
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
    raw_decl_unit = declared.group(2).lower()
    unit_map = {"ग्राम": "g", "किग्रा": "kg", "लीटर": "l"}
    declared_unit = unit_map.get(raw_decl_unit, raw_decl_unit)
    within = declared_value is not None and declared_unit == expected_unit and abs(declared_value - calculated) <= Decimal("0.01")
    usp = USPResult(
        applicable=True,
        declared_value=declared_value,
        declared_unit=Unit(declared_unit) if declared_unit in {u.value for u in Unit} else None,
        calculated_value=calculated,
        quantity_in_base_unit=base_quantity,
        ratio=calculated,
        within_tolerance=within,
    )
    status = RuleStatus.PASS if within else RuleStatus.FAIL
    reason = "Declared USP matches the deterministic calculation." if within else "Declared USP has the wrong unit or differs from the calculated value by more than INR 0.01."
    return result(StatutoryRule.RULE_6_11, status, reason, evidence=[declared.group(0)], values={"expected": str(calculated), "unit": expected_unit}), usp

def audit_font_and_pdp(text: str, pdp_area_cm2: float = 120.0, char_height_mm: float = 2.5) -> RuleResult:
    """Evaluates Rule 5 and Rule 9 Table I numeral height requirements per PCR 2011 Second Schedule."""
    if pdp_area_cm2 <= 50:
        required_mm = 1.0
    elif pdp_area_cm2 <= 100:
        required_mm = 1.5
    elif pdp_area_cm2 <= 500:
        required_mm = 2.5
    else:
        required_mm = 4.0

    is_compliant = char_height_mm >= required_mm
    return result(
        StatutoryRule.RULE_5_PDP,
        RuleStatus.PASS if is_compliant else RuleStatus.FAIL,
        f"Numeral height ({char_height_mm:.1f}mm) satisfies statutory minimum ({required_mm:.1f}mm) for PDP area {pdp_area_cm2:.0f}cm²."
        if is_compliant
        else f"Micro-font detected: numeral height {char_height_mm:.1f}mm is below required {required_mm:.1f}mm for PDP area {pdp_area_cm2:.0f}cm².",
        values={"pdp_area_cm2": pdp_area_cm2, "char_height_mm": char_height_mm, "required_mm": required_mm},
    )

def calculate_trust_score(rules: list[RuleResult]) -> int:
    """Calculates an explainable 0–100 Consumer Trust Score based on statutory infractions."""
    score = 100
    for r in rules:
        if r.status == RuleStatus.FAIL:
            if r.rule in {StatutoryRule.RULE_6_1_C, StatutoryRule.RULE_6_1_E, StatutoryRule.RULE_6_11}:
                score -= 25  # Critical statutory breach
            else:
                score -= 15  # Major statutory breach
        elif r.status == RuleStatus.WARNING:
            score -= 5
    return max(0, min(100, score))

def audit_text(text: str, audit_date: date | None = None, font_height_mm: float | None = None, hindi_text: str | None = None) -> tuple[list[RuleResult], USPResult, list[ExtractedField], PenaltyEstimate | None]:
    audit_date = audit_date or date.today()
    penalty = None
    quantity_data = _quantity(text)
    mrp_match = MRP_RE.search(text)
    mrp = Decimal(mrp_match.group(1)) if mrp_match else None
    rules: list[RuleResult] = []

    # ------------------------------------------------------------------
    # Rule 6(1)(a) — Entity, Address, PIN, Country of Origin
    # ------------------------------------------------------------------
    has_prefix = ENTITY_PREFIX_RE.search(text)
    has_pin = PIN_RE.search(text)
    address_parts = sum(bool(pattern.search(text)) for pattern in ADDRESS_PART_RES)
    imported = bool(ENTITY_PREFIX_RE.search(text) and IMPORTED_RE.search(text))
    has_origin = bool(ORIGIN_RE.search(text))
    address_parts = sum(bool(pattern.search(text)) for pattern in ADDRESS_PATTERNS)
    imported = bool(ENTITY_PREFIX_RE.search(text) and IMPORTED_RE_INLINE.search(text))
    has_origin = bool(COUNTRY_ORIGIN_RE.search(text))
    a_ok = bool(has_prefix and has_pin and address_parts >= 2 and (not imported or has_origin))
    rules.append(
        result(
            StatutoryRule.RULE_6_1_A,
            RuleStatus.PASS if a_ok else RuleStatus.FAIL,
            "Entity prefix, address, PIN, and import origin declaration are present."
            if a_ok
            else "Manufacturer/packer/importer prefix, complete address, PIN, or country of origin is missing.",
        )
    )

    # ------------------------------------------------------------------
    # Rule 6(1)(b) — Generic / Common Commodity Name
    # ------------------------------------------------------------------
    has_generic = _has_commodity(text)
    rules.append(
        result(
            StatutoryRule.RULE_6_1_B,
            RuleStatus.PASS if has_generic else RuleStatus.FAIL,
            "Generic commodity name is present."
            if has_generic
            else "A generic or common commodity name is missing. Brand names alone do not satisfy Rule 6(1)(b).",
        )
    )

    # ------------------------------------------------------------------
    # Rule 6(1)(c) — Net Quantity & Strict SI Units
    # ------------------------------------------------------------------
    invalid = INVALID_UNIT_RE.search(text)
    rules.append(
        result(
            StatutoryRule.RULE_6_1_C,
            RuleStatus.FAIL if invalid or not quantity_data else RuleStatus.PASS,
            f"Invalid non-SI unit notation detected: '{invalid.group(0)}'. Use 'g' not 'gm', 'ml' not 'ml.'."
            if invalid
            else "Net quantity uses a recognized SI unit."
            if quantity_data
            else "Net quantity declaration is missing.",
            evidence=[invalid.group(0)] if invalid else [],
        )
    )

    # ------------------------------------------------------------------
    # Rule 6(1)(d) — Date of Manufacture / Packing / Import
    # ------------------------------------------------------------------
    date_match = DATE_RE.search(text)
    valid_date = False
    if date_match:
        mon = int(date_match.group(1))
        year = int(date_match.group(2))
        year += 2000 if year < 100 else 0
        # Reject dates strictly in the future (year future, or same year but future month)
        if year < audit_date.year:
            valid_date = True
        elif year == audit_date.year and mon <= audit_date.month:
            valid_date = True
        else:
            valid_date = False  # future month in same year or future year
    rules.append(
        result(
            StatutoryRule.RULE_6_1_D,
            RuleStatus.PASS if valid_date else RuleStatus.FAIL,
            "Manufacture/import date is present and not in the future."
            if valid_date
            else "A valid MM/YYYY or MM/YY date is missing or is in the future. Future manufacture dates indicate mislabeling.",
        )
    )

    # ------------------------------------------------------------------
    # Rule 6(1)(e) — MRP & Tax Inclusion Phrasing
    # ------------------------------------------------------------------
    tax_ok = bool(mrp_match and TAX_RE.search(text))
    rules.append(
        result(
            StatutoryRule.RULE_6_1_E,
            RuleStatus.PASS if tax_ok else RuleStatus.FAIL,
            "MRP includes the required statutory tax-inclusion declaration."
            if tax_ok
            else "MRP is missing or does not include the exact tax-inclusion declaration '(incl. of all taxes)'.",
        )
    )

    # ------------------------------------------------------------------
    # Rule 6(1)(f) — Consumer Grievance Redressal Channels
    # ------------------------------------------------------------------
    has_care_designation = bool(CARE_DESIGNATION_RE.search(text))
    has_address_ref = bool(has_pin or ADDRESS_REF_RE.search(text))
    has_phone = bool(PHONE_RE.search(text))
    has_email = bool(EMAIL_RE.search(text))
    care_ok = has_care_designation and has_address_ref and has_phone and has_email
    care_missing = []
    if not has_care_designation:
        care_missing.append("designation (Consumer Care Cell / Grievance Officer)")
    if not has_phone:
        care_missing.append("phone helpline")
    if not has_email:
        care_missing.append("email address")
    rules.append(
        result(
            StatutoryRule.RULE_6_1_F,
            RuleStatus.PASS if care_ok else RuleStatus.FAIL,
            "Consumer grievance designation, address, phone, and email are all present."
            if care_ok
            else f"Consumer grievance contact incomplete. Missing: {', '.join(care_missing) if care_missing else 'complete address or designation'}.",
        )
    )

    # ------------------------------------------------------------------
    # Rule 6(11) — Unit Sale Price Mathematical Auditor
    # ------------------------------------------------------------------
    usp_rule, usp = audit_usp(text, mrp, quantity_data)
    rules.append(usp_rule)

    # ------------------------------------------------------------------
    # Rule 5 / 9 — Font Height & PDP Area Check (HEAD's default PDP auditor)
    # ------------------------------------------------------------------
    rules.append(audit_font_and_pdp(text))

    # ------------------------------------------------------------------
    # Rule 5 — Package-size-based font height (feature branch's granular check)
    # ------------------------------------------------------------------
    if font_height_mm is not None and quantity_data:
        quantity, unit = quantity_data
        base_quantity, base_unit = _base_quantity(quantity, unit)
        is_ml_or_g = base_unit in {"g", "ml"}

        rule_5_status = RuleStatus.PASS
        rule_5_reason = "PDP font height is compliant for this package size."

        if is_ml_or_g:
            if base_quantity <= Decimal("200") and font_height_mm < 2.0:
                rule_5_status = RuleStatus.FAIL
                rule_5_reason = f"Font height ({font_height_mm}mm) is less than required 2mm for packages <=200g/ml."
            elif Decimal("200") < base_quantity <= Decimal("500") and font_height_mm < 4.0:
                rule_5_status = RuleStatus.FAIL
                rule_5_reason = f"Font height ({font_height_mm}mm) is less than required 4mm for packages 200g-500g/ml."
            elif base_quantity > Decimal("500") and font_height_mm < 6.0:
                rule_5_status = RuleStatus.FAIL
                rule_5_reason = f"Font height ({font_height_mm}mm) is less than required 6mm for packages >500g/ml."

        rules.append(result(StatutoryRule.RULE_5, rule_5_status, rule_5_reason, values={"font_height_mm": font_height_mm, "base_quantity": float(base_quantity), "base_unit": base_unit}))
    elif font_height_mm is not None:
        rules.append(result(StatutoryRule.RULE_5, RuleStatus.FAIL, "Cannot verify Rule 5 font height without a valid net quantity."))

    # ------------------------------------------------------------------
    # Bilingual Consistency — Hindi vs English label cross-check
    # ------------------------------------------------------------------
    if hindi_text is not None:
        is_compliant, reason, details = audit_bilingual_consistency(
            text, hindi_text, mrp, quantity_data
        )
        bilingual_status = RuleStatus.PASS if is_compliant else RuleStatus.FAIL
        rules.append(result(
            StatutoryRule.BILINGUAL,
            bilingual_status,
            reason,
            values=details
        ))

    fields = [ExtractedField(name="ocr_text", value=text)]
    if quantity_data:
        fields.append(ExtractedField(name="net_quantity", value=f"{quantity_data[0]} {quantity_data[1]}"))
    if mrp is not None:
        fields.append(ExtractedField(name="mrp", value=str(mrp)))
    failed_rules = [r for r in rules if r.status == RuleStatus.FAIL]
    if failed_rules:
        sections_violated = set()
        for r in failed_rules:
            # Rule 6(1)(a) failure typically falls under Section 49 / Rule 32 for lack of manufacturer/importer info
            if r.rule == StatutoryRule.RULE_6_1_A:
                sections_violated.add("Section 49")
            # Other statutory omissions, unit issues, and pricing math fall under Section 36
            else:
                sections_violated.add("Section 36")

        sections_list = sorted(list(sections_violated))
        if "Section 36" in sections_list and "Section 49" in sections_list:
            fine_range = "₹50,000 - ₹1,00,000"
        elif "Section 36" in sections_list:
            fine_range = "₹25,000 - ₹50,000"
        elif "Section 49" in sections_list:
            fine_range = "₹10,000 - ₹25,000"
        else:
            fine_range = "₹10,000 - ₹50,000"

        penalty = PenaltyEstimate(sections_violated=sections_list, estimated_fine_range=fine_range)

    return rules, usp, fields, penalty
