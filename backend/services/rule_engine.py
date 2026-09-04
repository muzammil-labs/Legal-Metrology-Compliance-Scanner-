import re
from typing import List, Optional, Dict, Any
from schemas import RuleResult, RuleStatus, StatutoryRule, PenaltyEstimate, DeceptionAnalysis, DeceptionFlag

MANUFACTURER_RE = re.compile(r'(?i)\b(mfg\.?\s*by|manufactured\s*by|packed\s*by|pkd\.?\s*by|imported\s*by|marketed\s*by|baked\s*in|produced\s*by)\b')
PINCODE_RE = re.compile(r'\b([1-9][0-9]{5}|[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}|\d{5})\b')
COUNTRY_RE = re.compile(r'(?i)\b(country\s*of\s*origin|made\s*in|product\s*of|scotland|uk|united\s*kingdom)\b')
NET_QTY_RE = re.compile(r'(?i)\b(net\s*(?:qty|quantity|wt\.?|weight|vol\.?|volume)?)\s*[:.]?\s*(\d+(?:\.\d+)?)\s*(g|kg|ml|l|n|u)\b')
INVALID_UNIT_RE = re.compile(r'(?i)\b\d+\s*(gm|gms|ml\.|kgs|gram|grams)\b')
# Strict: MRP must be accompanied by tax-inclusive declaration — NOT just the word "MRP"
MRP_TAX_RE = re.compile(r'(?i)(incl\.?\s*of\s*all\s*taxes|inclusive\s*of\s*all\s*taxes)')
CONSUMER_CARE_RE = re.compile(r'(?i)\b(consumer\s*care|customer\s*care|helpline|toll\s*free|feedback|support@|care@|email|sales@)\b')
USP_RE = re.compile(r'(?i)\b(?:unit\s*sale\s*price|usp)\s*[:.]?\s*(?:rs\.?|₹)?\s*(\d+(?:\.\d+)?)\s*(?:per|/)\s*(g|kg|ml|l|piece|unit)\b')

# Markers returned by Gemini for non-product or low-quality images
NOT_A_LABEL_MARKER = "NOT_A_PACKAGED_PRODUCT"
BLURRY_MARKER = "IMAGE_QUALITY_POOR"

def audit_manufacturer_details(text: str, json_artwork: Optional[dict] = None) -> RuleResult:
    json_artwork = json_artwork or {}
    has_prefix = bool(MANUFACTURER_RE.search(text)) or bool(json_artwork.get('manufacturer_name'))
    has_pin = bool(PINCODE_RE.search(text)) or bool(json_artwork.get('manufacturer_pincode'))
    if has_prefix and has_pin:
        return RuleResult(
            rule=StatutoryRule.RULE_6_1_A,
            status=RuleStatus.PASS,
            reason="Compliant manufacturer details and postal PIN code identified.",
            statutory_clause="Rule 6(1)(a), Legal Metrology (Packaged Commodities) Rules, 2011",
            remedy=None
        )
    if has_prefix and not has_pin:
        return RuleResult(
            rule=StatutoryRule.RULE_6_1_A,
            status=RuleStatus.WARNING,
            reason="Manufacturer name or packer prefix found but mandatory postal PIN code / address is absent or unreadable.",
            statutory_clause="Rule 6(1)(a), Legal Metrology (Packaged Commodities) Rules, 2011",
            remedy="Print the complete name and full postal address (including 6-digit PIN code) of the manufacturer or packer on the principal display panel."
        )
    return RuleResult(
        rule=StatutoryRule.RULE_6_1_A,
        status=RuleStatus.FAIL,
        reason="Missing mandatory manufacturer identification under Rule 6(1)(a).",
        statutory_clause="Rule 6(1)(a), Legal Metrology (Packaged Commodities) Rules, 2011",
        remedy="Add the name and complete postal address of the manufacturer, packer, or importer (with 6-digit PIN code) on the label."
    )

def audit_country_of_origin(text: str, json_artwork: Optional[dict] = None) -> RuleResult:
    json_artwork = json_artwork or {}
    if COUNTRY_RE.search(text) or bool(json_artwork.get('country_of_origin')):
        return RuleResult(
            rule=StatutoryRule.RULE_6_1_B,
            status=RuleStatus.PASS,
            reason="Country of origin clearly declared.",
            statutory_clause="Rule 6(1)(b), Legal Metrology (Packaged Commodities) Rules, 2011",
            remedy=None
        )
    return RuleResult(
        rule=StatutoryRule.RULE_6_1_B,
        status=RuleStatus.FAIL,
        reason="Missing mandatory Country of Origin declaration under Rule 6(1)(b).",
        statutory_clause="Rule 6(1)(b), Legal Metrology (Packaged Commodities) Rules, 2011",
        remedy="Declare the Country of Origin (e.g., 'Country of Origin: India' or 'Made in India') on the label."
    )

def audit_net_quantity(text: str, json_artwork: Optional[dict] = None) -> RuleResult:
    json_artwork = json_artwork or {}
    # If the JSON unit matches an invalid one, or the regex matches
    invalid_units = ["gm", "gms", "ml.", "kgs", "gram", "grams"]
    json_unit = str(json_artwork.get('net_quantity_unit')).lower()
    
    if INVALID_UNIT_RE.search(text) or json_unit in invalid_units:
        return RuleResult(
            rule=StatutoryRule.RULE_6_1_C,
            status=RuleStatus.FAIL,
            reason="Non-standard metric symbols detected. Must use SI units (g, kg, ml, l).",
            statutory_clause="Rule 6(1)(c) read with Rule 5, Legal Metrology (Packaged Commodities) Rules, 2011",
            remedy="Replace non-standard units (gm, gms, ltr, kgs, gram) with prescribed SI metric symbols: g, kg, ml, or l."
        )
    if NET_QTY_RE.search(text) or (json_artwork.get('net_quantity_value') and json_unit in ["g", "kg", "ml", "l", "n", "u"]):
        return RuleResult(
            rule=StatutoryRule.RULE_6_1_C,
            status=RuleStatus.PASS,
            reason="Net quantity declared in valid statutory SI metric units.",
            statutory_clause="Rule 6(1)(c), Legal Metrology (Packaged Commodities) Rules, 2011",
            remedy=None
        )
    return RuleResult(
        rule=StatutoryRule.RULE_6_1_C,
        status=RuleStatus.FAIL,
        reason="Missing or unparseable net quantity declaration under Rule 6(1)(c).",
        statutory_clause="Rule 6(1)(c), Legal Metrology (Packaged Commodities) Rules, 2011",
        remedy="Declare the net quantity in standard SI units (e.g., 'Net Qty: 500 g' or 'Net Vol: 200 ml') in numerals and prescribed metric symbols."
    )

def audit_mrp_tax(text: str, json_artwork: Optional[dict] = None) -> RuleResult:
    json_artwork = json_artwork or {}
    json_taxes = str(json_artwork.get('mrp_includes_taxes_declared')).lower()
    has_taxes = MRP_TAX_RE.search(text) or json_taxes in ['yes', 'true', 'y']
    
    if has_taxes:
        return RuleResult(
            rule=StatutoryRule.RULE_6_1_E,
            status=RuleStatus.PASS,
            reason="MRP properly formatted with mandatory '(incl. of all taxes)' declaration.",
            statutory_clause="Rule 6(1)(e), Legal Metrology (Packaged Commodities) Rules, 2011",
            remedy=None
        )
    return RuleResult(
        rule=StatutoryRule.RULE_6_1_E,
        status=RuleStatus.FAIL,
        reason="MRP declaration missing mandatory '(incl. of all taxes)' suffix under Rule 6(1)(e).",
        statutory_clause="Rule 6(1)(e), Legal Metrology (Packaged Commodities) Rules, 2011",
        remedy="Print MRP as: 'MRP Rs. XX.XX (Incl. of all taxes)' on the label. Omitting the tax-inclusive declaration is a statutory violation."
    )

def audit_consumer_care(text: str, json_artwork: Optional[dict] = None) -> RuleResult:
    json_artwork = json_artwork or {}
    has_care = CONSUMER_CARE_RE.search(text) or bool(json_artwork.get('consumer_care_phone')) or bool(json_artwork.get('consumer_care_email'))
    
    if has_care:
        return RuleResult(
            rule=StatutoryRule.RULE_6_1_F,
            status=RuleStatus.PASS,
            reason="Consumer care contact details provided.",
            statutory_clause="Rule 6(1)(f), Legal Metrology (Packaged Commodities) Rules, 2011",
            remedy=None
        )
    return RuleResult(
        rule=StatutoryRule.RULE_6_1_F,
        status=RuleStatus.FAIL,
        reason="Missing consumer care helpline/email contact details under Rule 6(1)(f).",
        statutory_clause="Rule 6(1)(f), Legal Metrology (Packaged Commodities) Rules, 2011",
        remedy="Add a consumer care contact (phone number or email address) on the label. Example: 'Consumer Care: 1800-XXX-XXXX or care@brand.com'."
    )

def audit_unit_sale_price(text: str, json_artwork: Optional[dict] = None) -> RuleResult:
    json_artwork = json_artwork or {}
    has_usp = USP_RE.search(text) or bool(json_artwork.get('unit_sale_price'))
    
    if has_usp:
        return RuleResult(
            rule=StatutoryRule.RULE_6_11_USP,
            status=RuleStatus.PASS,
            reason="Unit Sale Price (USP) declared with normalized metric denominator.",
            statutory_clause="Rule 6(11), Legal Metrology (Packaged Commodities) Rules, 2011",
            remedy=None
        )
    return RuleResult(
        rule=StatutoryRule.RULE_6_11_USP,
        status=RuleStatus.WARNING,
        reason="Unit Sale Price (USP) missing or improperly formatted under Rule 6(11).",
        statutory_clause="Rule 6(11), Legal Metrology (Packaged Commodities) Rules, 2011",
        remedy="Declare the Unit Sale Price in the format: 'Unit Sale Price: Rs. X.XX per g/kg/ml/l'. Required for packages above prescribed threshold weights."
    )

DATE_MFG_RE = re.compile(r'(?i)\b(?:mfg\.?\s*(?:date|dt\.?)?|pkd\.?\s*(?:date|dt\.?)?|date\s*of\s*(?:mfg|packing|import)|packed\s*on)\s*[:.]?\s*(\d{2}[/-]\d{4}|\d{2}[/-]\d{2}[/-]\d{4}|\w{3,9}\s*\d{4})\b')

def audit_date_of_mfg(text: str, json_artwork: Optional[dict] = None) -> RuleResult:
    json_artwork = json_artwork or {}
    has_mfg = DATE_MFG_RE.search(text) or re.search(r'\b(0[1-9]|1[0-2])/(20\d{2})\b', text) or bool(json_artwork.get('mfg_date'))
    
    if has_mfg:
        return RuleResult(
            rule=StatutoryRule.RULE_6_1_D,
            status=RuleStatus.PASS,
            reason="Date of manufacture/packing clearly declared.",
            statutory_clause="Rule 6(1)(d), Legal Metrology (Packaged Commodities) Rules, 2011",
            remedy=None
        )
    return RuleResult(
        rule=StatutoryRule.RULE_6_1_D,
        status=RuleStatus.FAIL,
        reason="Missing mandatory Date of Manufacture/Packing under Rule 6(1)(d).",
        statutory_clause="Rule 6(1)(d), Legal Metrology (Packaged Commodities) Rules, 2011",
        remedy="Print the Month and Year of manufacture or packing on the label (e.g., 'Mfg: 08/2025')."
    )

def calculate_compounding_fine(violations: List[RuleResult]) -> PenaltyEstimate:
    failed = [r for r in violations if r.status == RuleStatus.FAIL]
    if not failed:
        return PenaltyEstimate(
            estimated_fine_range="0",
            min_penalty_inr=0,
            max_penalty_inr=0,
            legal_section="Section 36 (Compliant)",
            jan_vishwas_eligible=True,
            grace_period_days="30",
            director_liability=False
        )
    is_deceptive = any(r.rule in [StatutoryRule.RULE_6_11_USP, StatutoryRule.RULE_6_1_C] for r in failed)
    penalty_inr = 100000 if is_deceptive else 25000
    return PenaltyEstimate(
        estimated_fine_range=str(penalty_inr),
        min_penalty_inr=penalty_inr,
        max_penalty_inr=penalty_inr,
        legal_section="Section 36 & Section 49, Legal Metrology Act, 2009 (Jan Vishwas Amendment 2023)",
        jan_vishwas_eligible=not is_deceptive,
        grace_period_days="15" if not is_deceptive else "0",
        director_liability=len(failed) >= 3
    )

def detect_deceptive_patterns(text: str, json_artwork: Optional[dict] = None) -> DeceptionAnalysis:
    json_artwork = json_artwork or {}
    flags = []
    
    # PATTERN 1 - HIDDEN_QUANTITY
    qty_val = json_artwork.get('net_quantity_value')
    if qty_val:
        try:
            val = float(qty_val)
            unit = str(json_artwork.get('net_quantity_unit')).lower()
            if val < 10 and unit in ['g', 'ml']:
                flags.append(DeceptionFlag(
                    flag_type="HIDDEN_QUANTITY",
                    description="Net quantity is suspiciously low (< 10g/ml). May indicate sample size being passed off as full product.",
                    severity="LOW",
                    field_affected="Net Quantity"
                ))
        except ValueError:
            pass

    # PATTERN 2 - MISLEADING_UNIT
    # Look for mg, mcg, cl, gm, gms, kgs
    misleading_unit_re = re.compile(r'(?i)\b\d+(?:\.\d+)?\s*(mg|mcg|cl|gm|gms|kgs)\b')
    if misleading_unit_re.search(text) or str(json_artwork.get('net_quantity_unit')).lower() in ['mg', 'mcg', 'cl', 'gm', 'gms', 'kgs']:
        flags.append(DeceptionFlag(
            flag_type="MISLEADING_UNIT",
            description="Quantity declared using obscure sub-units (e.g. mg, cl). This creates a perception mismatch vs standard SI units.",
            severity="MEDIUM",
            field_affected="Net Quantity"
        ))

    # PATTERN 3 - BURIED_MANDATORY_INFO
    if len(text) > 500:
        long_lines = [line for line in text.split('\n') if len(line) > 200]
        if long_lines:
            for line in long_lines:
                if CONSUMER_CARE_RE.search(line) or MANUFACTURER_RE.search(line):
                    flags.append(DeceptionFlag(
                        flag_type="BURIED_INFO",
                        description="Mandatory manufacturer or consumer care info is buried inside a very dense block of text (> 200 chars).",
                        severity="MEDIUM",
                        field_affected="Layout / Formatting"
                    ))
                    break

    # PATTERN 4 - PRICE_QUANTITY_MISMATCH
    mrp_str = json_artwork.get('mrp_value')
    if mrp_str and qty_val:
        try:
            mrp = float(mrp_str)
            qty = float(qty_val)
            unit = str(json_artwork.get('net_quantity_unit')).lower()
            # Convert kg/l to g/ml
            if unit in ['kg', 'l']:
                qty *= 1000
                unit = 'g' if unit == 'kg' else 'ml'
            if unit in ['g', 'ml'] and qty > 0:
                price_per_unit = mrp / qty
                if price_per_unit > 5:
                    # Check for food product context
                    is_food = bool(re.search(r'(?i)(fssai|food|snack|beverage|eat)', text))
                    if is_food:
                        flags.append(DeceptionFlag(
                            flag_type="PRICE_QUANTITY_MISMATCH",
                            description=f"Unusually high price per {unit} for a food item (Rs. {price_per_unit:.2f}/{unit}). Anomalous pricing.",
                            severity="LOW",
                            field_affected="MRP / Net Quantity"
                        ))
        except ValueError:
            pass

    # PATTERN 5 - MISSING_HINDI_MANDATORY
    has_hindi = bool(re.search(r'[\u0900-\u097F]', text))
    if has_hindi:
        # Check if Hindi MRP is declared. Simple check: 'एमआरपी' or 'मूल्य'
        has_hindi_mrp = bool(re.search(r'एमआरपी|मूल्य|कर|सहित', text))
        if not has_hindi_mrp:
            flags.append(DeceptionFlag(
                flag_type="MISSING_HINDI_MANDATORY",
                description="Hindi text detected on packaging, but MRP declaration appears only in English. Bilingual rules require MRP in Hindi as well.",
                severity="LOW",
                field_affected="Bilingual Declarations"
            ))

    # Calculate risk score
    severity_scores = {"LOW": 10, "MEDIUM": 25, "HIGH": 40}
    score = sum(severity_scores.get(f.severity, 0) for f in flags)
    score = min(score, 100)

    summary = "No deceptive patterns detected."
    if score > 0:
        highest_severity = max(flags, key=lambda f: severity_scores.get(f.severity, 0))
        summary = highest_severity.description

    return DeceptionAnalysis(
        has_deceptive_patterns=len(flags) > 0,
        flags=flags,
        deception_risk_score=score,
        summary=summary
    )


def audit_text(text: str, json_artwork: Optional[dict] = None):
    rules = [
        audit_manufacturer_details(text, json_artwork), 
        audit_country_of_origin(text, json_artwork), 
        audit_net_quantity(text, json_artwork), 
        audit_mrp_tax(text, json_artwork), 
        audit_consumer_care(text, json_artwork), 
        audit_unit_sale_price(text, json_artwork),
        audit_date_of_mfg(text, json_artwork)
    ]
    deception_analysis = detect_deceptive_patterns(text, json_artwork)
    return rules, deception_analysis
