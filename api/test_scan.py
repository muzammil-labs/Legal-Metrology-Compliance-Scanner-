"""Quick rule engine logic test with realistic Indian product label text."""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.rule_engine import audit_text
from schemas import RuleStatus

# Simulate what Gemini SHOULD return for a typical Indian product (Parle-G style)
demo_text = """Parle-G
Original Glucose Biscuits
Mfg. by: Parle Products Pvt. Ltd.
Plot No. 37, Nerul, Navi Mumbai - 400706
Country of Origin: India
Net Qty: 250 g
MRP Rs.20.00 (Incl. of all taxes)
Mfg Dt: 03/2025  Best Before: 9 months from Mfg
Consumer Care: 1800-222-345
FSSAI Lic. No. 10013061000123
Veg
Unit Sale Price: Rs.8.00 per 100g
Ingredients: Wheat Flour, Sugar, Edible Vegetable Oil"""

demo_json = {
    "manufacturer_name": "Parle Products Pvt. Ltd.",
    "manufacturer_address": "Plot No. 37, Nerul, Navi Mumbai - 400706",
    "manufacturer_pincode": "400706",
    "country_of_origin": "India",
    "net_quantity_value": "250",
    "net_quantity_unit": "g",
    "mrp_value": "20.00",
    "mrp_includes_taxes_declared": "yes",
    "mfg_date": "03/2025",
    "consumer_care_phone": "1800-222-345",
    "consumer_care_email": None,
    "unit_sale_price": "Rs.8.00 per 100g",
    "fssai_license_number": "10013061000123",
    "veg_nonveg_symbol": "VEG",
    "hindi_mrp": None,
    "brand_name": "Parle-G"
}

print("=" * 60)
print("TEST 1: Full valid label (should be mostly PASS)")
print("=" * 60)
rules, deception = audit_text(demo_text, demo_json)
for r in rules:
    tag = "[PASS]" if r.status == RuleStatus.PASS else ("[WARN]" if r.status == RuleStatus.WARNING else "[FAIL]")
    print(f"  {tag} {r.rule} - {r.reason}")

# Test 2: Partial label (only some fields visible - common for phone camera)
print("\n" + "=" * 60)
print("TEST 2: Partial label (some fields missing - phone camera crop)")
print("=" * 60)

partial_text = """Net Wt. 100g
MRP Rs.10/-
Packed by ABC Foods Ltd
Mumbai 400001
Made in India
1800-123-4567"""

partial_json = {
    "manufacturer_name": "ABC Foods Ltd",
    "manufacturer_pincode": "400001",
    "country_of_origin": "India",
    "net_quantity_value": "100",
    "net_quantity_unit": "g",
    "mrp_value": "10",
    "mrp_includes_taxes_declared": None,
    "mfg_date": None,
    "consumer_care_phone": "1800-123-4567",
}

rules2, _ = audit_text(partial_text, partial_json)
for r in rules2:
    tag = "[PASS]" if r.status == RuleStatus.PASS else ("[WARN]" if r.status == RuleStatus.WARNING else "[FAIL]")
    print(f"  {tag} {r.rule} - {r.reason}")

# Test 3: Empty / garbage text (should fail gracefully)
print("\n" + "=" * 60)
print("TEST 3: Empty text with no JSON (worst case)")
print("=" * 60)
rules3, _ = audit_text("", {})
for r in rules3:
    tag = "[PASS]" if r.status == RuleStatus.PASS else ("[WARN]" if r.status == RuleStatus.WARNING else "[FAIL]")
    print(f"  {tag} {r.rule} - {r.reason}")

# Summary
pass1 = sum(1 for r in rules if r.status == RuleStatus.PASS)
pass2 = sum(1 for r in rules2 if r.status == RuleStatus.PASS)
print(f"\nSUMMARY: Test1={pass1}/{len(rules)} pass, Test2={pass2}/{len(rules2)} pass")
