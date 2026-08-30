import re
from decimal import Decimal
from typing import Optional, Tuple

HINDI_MRP_RE = re.compile(
    r"(?:अधिकतम खुदरा मूल्य|अ\.खु\.मू\.|MRP).*?(?:Rs\.?|₹)\s*(\d+(?:\.\d{1,2})?)",
    re.IGNORECASE | re.UNICODE
)

HINDI_QTY_RE = re.compile(
    r"(?:शुद्ध मात्रा|मात्रा|Net Qty).*?(\d+(?:\.\d+)?)\s*(g|kg|ml|l|gm|gms|U|N)",
    re.IGNORECASE | re.UNICODE
)

HINDI_TAX_RE = re.compile(
    r"(सभी करों सहित|incl\.\s+of\s+all\s+taxes)",
    re.IGNORECASE | re.UNICODE
)

def audit_bilingual_consistency(
    english_text: str,
    hindi_text: str,
    english_mrp: Optional[Decimal],
    english_qty_data: Optional[Tuple[Decimal, str]]
) -> Tuple[bool, str, dict]:
    """
    Audits the consistency between English and Hindi label declarations.
    Returns (is_compliant, reason, verification_details).
    """
    if not hindi_text:
        return True, "No Hindi text provided for cross-audit.", {}

    hindi_mrp_match = HINDI_MRP_RE.search(hindi_text)
    hindi_mrp = Decimal(hindi_mrp_match.group(1)) if hindi_mrp_match else None

    hindi_qty_match = HINDI_QTY_RE.search(hindi_text)
    if hindi_qty_match:
        qty_val = Decimal(hindi_qty_match.group(1))
        unit_val = hindi_qty_match.group(2).lower()
        hindi_qty_data = (qty_val, unit_val)
    else:
        hindi_qty_data = None

    has_hindi_tax = bool(HINDI_TAX_RE.search(hindi_text))

    details = {
        "english_mrp": float(english_mrp) if english_mrp is not None else None,
        "hindi_mrp": float(hindi_mrp) if hindi_mrp is not None else None,
        "english_qty": f"{english_qty_data[0]} {english_qty_data[1]}" if english_qty_data else None,
        "hindi_qty": f"{hindi_qty_data[0]} {hindi_qty_data[1]}" if hindi_qty_data else None,
        "hindi_taxes_included": has_hindi_tax,
        "mrp_match": english_mrp == hindi_mrp if english_mrp and hindi_mrp else None,
        "qty_match": english_qty_data == hindi_qty_data if english_qty_data and hindi_qty_data else None
    }

    if english_mrp and hindi_mrp and english_mrp != hindi_mrp:
        return False, "MRP mismatch between Hindi and English labels.", details

    if english_qty_data and hindi_qty_data and english_qty_data != hindi_qty_data:
        return False, "Net Quantity mismatch between Hindi and English labels.", details

    return True, "Hindi and English labels are consistent.", details
