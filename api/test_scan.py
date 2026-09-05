from services.rule_engine import audit_text
from schemas import RuleStatus

print("--- RUNNING RULE ENGINE LOGIC TEST ---")

demo_text = """
Mfg. by: Nestle India Ltd, 100/101 World Trade Centre, Barakhamba Lane, New Delhi - 110001
Country of Origin: India
Net Qty: 70g
MRP Rs.15.00 (Incl. of all taxes)
Mfg: 08/2025
Consumer Care: 1800-103-6444
FSSAI Lic. No. 10013022002845
Veg product
Unit Sale Price: Rs.21.43 per 100g
"""

demo_json = {
    "manufacturer_name": "Nestle India Ltd",
    "manufacturer_pincode": "110001",
    "country_of_origin": "India",
    "net_quantity_value": "70", 
    "net_quantity_unit": "g",
    "mrp_value": "15.00", 
    "mrp_includes_taxes_declared": "yes",
    "mfg_date": "08/2025",
    "consumer_care_phone": "1800-103-6444",
    "fssai_license_number": "10013022002845",
    "veg_nonveg_symbol": "VEG",
    "unit_sale_price": "21.43 per 100g",
}

rules, deception = audit_text(demo_text, demo_json)

print("Classification Results on Valid Label Data:\n")
all_passed = True
for r in rules:
    status_str = "[PASS]" if r.status == RuleStatus.PASS else (
        "[WARNING]" if r.status == RuleStatus.WARNING else "[FAIL]"
    )
    if r.status != RuleStatus.PASS:
        all_passed = False
    print(f"{status_str} - {r.rule.name if hasattr(r.rule, 'name') else str(r.rule)}")
    if r.status != RuleStatus.PASS:
        print(f"   Reason: {r.reason}")

print("\nDeception Risk:", "Detected" if deception.has_deceptive_patterns else "Clear")
print("--------------------------------------")
