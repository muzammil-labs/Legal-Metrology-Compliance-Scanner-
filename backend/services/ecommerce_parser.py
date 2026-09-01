import re
from datetime import datetime
from schemas import ECommerceAuditRequest, ECommerceAuditResponse, DigitalDeclarationItem

MRP_RE = re.compile(r'(?i)(?:mrp|₹|rs\.?)\s*[\d,]+(?:\.\d+)?\s*(?:\(?(?:incl\.|inclusive)\s+of\s+all\s+taxes\)?)')
NET_QTY_RE = re.compile(r'(?i)\b\d+(?:\.\d+)?\s*(g|kg|ml|l|n|u)\b')
ILLEGAL_UNIT_RE = re.compile(r'(?i)\b\d+\s*(gm|gms|ml\.|kgs)\b')
MANUFACTURER_RE = re.compile(r'(?i)\b(?:mfg\.?\s*by|manufactured\s*by|packed\s*by|pkd\.?\s*by|marketed\s*by)\b')
PINCODE_RE = re.compile(r'\b[1-9][0-9]{5}\b')
COUNTRY_RE = re.compile(r'(?i)(?:country\s*of\s*origin|made\s*in|origin)\s*[:.]?\s*([A-Za-z\s]+)')
EMAIL_RE = re.compile(r'[\w\.-]+@[\w\.-]+\.\w+')
PHONE_RE = re.compile(r'\b(?:\+91[\-\s]?)?[6-9]\d{9}\b|\b1800[\-\s]?\d{3}[\-\s]?\d{3,4}\b')

def audit_digital_listing(payload: ECommerceAuditRequest) -> ECommerceAuditResponse:
    text = payload.listing_text
    declarations = []
    violations = 0

    # 1. MRP & Tax Inclusion
    mrp_match = MRP_RE.search(text)
    if mrp_match:
        declarations.append(DigitalDeclarationItem(
            declaration_name="Maximum Retail Price (MRP)",
            status="PASS",
            extracted_value=mrp_match.group(0),
            statutory_clause="Rule 6(10) r/w Rule 6(1)(e)",
            violation_reason=None
        ))
    else:
        violations += 1
        declarations.append(DigitalDeclarationItem(
            declaration_name="Maximum Retail Price (MRP)",
            status="FAIL",
            extracted_value=None,
            statutory_clause="Rule 6(10) r/w Rule 6(1)(e)",
            violation_reason="Missing mandatory '(incl. of all taxes)' declaration on digital listing."
        ))

    # 2. Net Quantity Metric Units
    has_illegal_unit = bool(ILLEGAL_UNIT_RE.search(text))
    net_qty_match = NET_QTY_RE.search(text)
    if net_qty_match and not has_illegal_unit:
        declarations.append(DigitalDeclarationItem(
            declaration_name="Net Quantity",
            status="PASS",
            extracted_value=net_qty_match.group(0),
            statutory_clause="Rule 6(10) r/w Rule 6(1)(c)",
            violation_reason=None
        ))
    else:
        violations += 1
        reason = "Non-standard unit detected ('gm'/'gms')." if has_illegal_unit else "Missing statutory net quantity."
        declarations.append(DigitalDeclarationItem(
            declaration_name="Net Quantity",
            status="FAIL",
            extracted_value=net_qty_match.group(0) if net_qty_match else None,
            statutory_clause="Rule 6(10) r/w Rule 6(1)(c)",
            violation_reason=reason
        ))

    # 3. Manufacturer / Packer Details & PIN Code
    has_mfg = bool(MANUFACTURER_RE.search(text))
    has_pin = bool(PINCODE_RE.search(text))
    if has_mfg and has_pin:
        declarations.append(DigitalDeclarationItem(
            declaration_name="Manufacturer Details",
            status="PASS",
            extracted_value="Manufacturer prefix and PIN verified",
            statutory_clause="Rule 6(10) r/w Rule 6(1)(a)",
            violation_reason=None
        ))
    else:
        violations += 1
        reason = "Missing statutory 6-digit postal PIN code." if (has_mfg and not has_pin) else "Missing manufacturer/packer identity."
        declarations.append(DigitalDeclarationItem(
            declaration_name="Manufacturer Details",
            status="FAIL",
            extracted_value=None,
            statutory_clause="Rule 6(10) r/w Rule 6(1)(a)",
            violation_reason=reason
        ))

    # 4. Country of Origin
    country_match = COUNTRY_RE.search(text)
    if country_match:
        declarations.append(DigitalDeclarationItem(
            declaration_name="Country of Origin",
            status="PASS",
            extracted_value=country_match.group(0),
            statutory_clause="Rule 6(10) r/w Rule 6(1)(b)",
            violation_reason=None
        ))
    else:
        violations += 1
        declarations.append(DigitalDeclarationItem(
            declaration_name="Country of Origin",
            status="FAIL",
            extracted_value=None,
            statutory_clause="Rule 6(10) r/w Rule 6(1)(b)",
            violation_reason="Mandatory Country of Origin omitted from marketplace listing."
        ))

    # 5. Consumer Care Details
    email_match = EMAIL_RE.search(text)
    phone_match = PHONE_RE.search(text)
    if email_match or phone_match:
        contact_val = email_match.group(0) if email_match else phone_match.group(0)
        declarations.append(DigitalDeclarationItem(
            declaration_name="Consumer Care",
            status="PASS",
            extracted_value=contact_val,
            statutory_clause="Rule 6(10) r/w Rule 6(1)(f)",
            violation_reason=None
        ))
    else:
        violations += 1
        declarations.append(DigitalDeclarationItem(
            declaration_name="Consumer Care",
            status="FAIL",
            extracted_value=None,
            statutory_clause="Rule 6(10) r/w Rule 6(1)(f)",
            violation_reason="Missing mandatory consumer support email or helpline."
        ))

    overall = "COMPLIANT" if violations == 0 else "NON_COMPLIANT"
    compounding_fine = violations * 25000

    return ECommerceAuditResponse(
        platform=payload.platform,
        overall_status=overall,
        total_violations=violations,
        declarations=declarations,
        compounding_fine_exposure_inr=compounding_fine,
        audited_at=datetime.utcnow().isoformat()
    )
