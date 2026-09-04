import re
from typing import Dict, Any

ENG_PRICE_RE = re.compile(r'(?:MRP|Rs\.?|₹)\s*([\d\.]+)', re.IGNORECASE | re.UNICODE)
ENG_WEIGHT_RE = re.compile(r'(\d+(?:\.\d+)?)\s*(g|kg|ml|l)\b', re.IGNORECASE | re.UNICODE)

HINDI_PRICE_RE = re.compile(r'(?:अधिकतम\s*खुदरा\s*मूल्य|एम\.?आर\.?पी\.?|मूल्य)\s*[:₹\.]*\s*([\d\.]+)', re.IGNORECASE | re.UNICODE)
HINDI_WEIGHT_RE = re.compile(r'(?:शुद्ध\s*मात्रा|मात्रा)\s*[:\.]*\s*([\d\.]+)\s*(ग्राम|किग्रा|मिली|ली)', re.IGNORECASE | re.UNICODE)

def audit_bilingual_text(text: str) -> Dict[str, Any]:
    hindi_price_match = HINDI_PRICE_RE.search(text)
    hindi_weight_match = HINDI_WEIGHT_RE.search(text)

    if not hindi_price_match and not hindi_weight_match:
        return {
            "is_bilingual": False,
            "english_declared_price": None,
            "hindi_declared_price": None,
            "price_match": True,
            "status": "PASS",
            "discrepancy_reason": None
        }

    eng_price_match = ENG_PRICE_RE.search(text)
    eng_price = float(eng_price_match.group(1)) if eng_price_match else None

    hindi_price = float(hindi_price_match.group(1)) if hindi_price_match else None

    is_bilingual = True
    price_match = True
    status = "PASS"
    discrepancy_reason = None

    if eng_price is not None and hindi_price is not None and eng_price != hindi_price:
        price_match = False
        status = "FAIL"
        discrepancy_reason = f"Price mismatch: English (₹{eng_price}) vs Hindi (₹{hindi_price})."

    return {
        "is_bilingual": is_bilingual,
        "english_declared_price": eng_price,
        "hindi_declared_price": hindi_price,
        "price_match": price_match,
        "status": status,
        "discrepancy_reason": discrepancy_reason
    }
