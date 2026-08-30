from datetime import date, datetime
from decimal import Decimal

from services.rule_engine import audit_text, calculate_trust_score, _base_quantity, audit_usp
from services.pdf_generator import generate_improvement_notice_pdf, generate_compounding_notice_pdf
# from services.pdf_generator import generate_section_36_notice
from services.evidence_ledger import compute_ledger_hash
from schemas import RuleStatus, StatutoryRule

VALID = """Manufactured by Acme Foods, Plot 4 Industrial Road, Pune, Maharashtra 411001
Wheat Flour Net Qty 2 kg MRP Rs. 100 (incl. of all taxes) 01/2026
Consumer Care Cell, Plot 4 Industrial Road, Pune, Maharashtra 411001 9876543210 care@acme.example
Country of Origin: India 50/kg"""

VALID_HINDI = """निर्मित Acme Foods, Plot 4 Industrial Road, Pune, Maharashtra 411001
गेहूं आटा शुद्ध मात्रा 2 kg अधिकतम खुदरा मूल्य ₹ 100 (सभी कर सहित) 01/2026
उपभोक्ता सेवा, Plot 4 Industrial Road, Pune, Maharashtra 411001 9876543210 care@acme.example
मूल देश: India 50/kg"""

def statuses(text, audit_dt=date(2026, 8, 23), **kwargs):
    rules, usp, fields, penalty, fine, _ = audit_text(text, audit_dt, **kwargs)
    return {rule.rule: rule.status for rule in rules}, usp, rules


def test_valid_baseline():
    results, usp, rules = statuses(VALID)
    # Check all standard rules pass (skip optional Rule 5 and Bilingual which require explicit params)
    for rule in [StatutoryRule.RULE_6_1_A, StatutoryRule.RULE_6_1_B, StatutoryRule.RULE_6_1_C,
                 StatutoryRule.RULE_6_1_D, StatutoryRule.RULE_6_1_E, StatutoryRule.RULE_6_1_F,
                 StatutoryRule.RULE_6_11, StatutoryRule.RULE_5_PDP]:
        assert results[rule] == RuleStatus.PASS, f"{rule} should PASS but got {results[rule]}"
    assert usp.within_tolerance is True
    assert calculate_trust_score(rules) == 100


def test_valid_hindi_baseline():
    results, usp, rules = statuses(VALID_HINDI)
    assert results[StatutoryRule.RULE_6_1_A] == RuleStatus.PASS
    assert results[StatutoryRule.RULE_6_1_B] == RuleStatus.PASS
    assert results[StatutoryRule.RULE_6_1_C] == RuleStatus.PASS
    assert results[StatutoryRule.RULE_6_1_E] == RuleStatus.PASS
    assert calculate_trust_score(rules) == 100


def test_tax_clause_required():
    results, _, rules = statuses(VALID.replace(" (incl. of all taxes)", ""))
    assert results[StatutoryRule.RULE_6_1_E] == RuleStatus.FAIL
    assert calculate_trust_score(rules) <= 75


def test_legacy_unit_rejected():
    results, _, rules = statuses(VALID.replace("2 kg", "500 gm"))
    assert results[StatutoryRule.RULE_6_1_C] == RuleStatus.FAIL


def test_usp_mismatch_rejected():
    results, _, rules = statuses(VALID.replace("50/kg", "0.40/kg"))
    assert results[StatutoryRule.RULE_6_11] == RuleStatus.FAIL


def test_missing_pin_code_fails_rule_6_1_a():
    results, _, _ = statuses(VALID.replace("411001", ""))
    assert results[StatutoryRule.RULE_6_1_A] == RuleStatus.FAIL


def test_future_date_rejected():
    results, _, _ = statuses(VALID.replace("01/2026", "01/2030"), audit_dt=date(2026, 8, 23))
    assert results[StatutoryRule.RULE_6_1_D] == RuleStatus.FAIL


def test_missing_consumer_care_fails_rule_6_1_f():
    results, _, _ = statuses(VALID.replace("care@acme.example", ""))
    assert results[StatutoryRule.RULE_6_1_F] == RuleStatus.FAIL


def test_pdf_notice_generation():
    pdf_bytes = generate_compounding_notice_pdf(
        inspection_id=42,
        source_filename="test_packet.jpg",
        sha256_digest="a" * 64,
        region="North Delhi",
        gps_location="28.7180° N, 77.1750° E",
        inspected_at=datetime(2026, 8, 29, 10, 0, 0),
        overall_status="FAIL",
        violations=[
            type("ViolationObj", (), {"rule": "Rule 6(1)(e)", "status": "FAIL", "reason": "Missing tax inclusion"})()
        ],
        ocr_text=VALID,
    )
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF")


# ------------------------------------------------------------------
# Additional edge-case tests mandated by master briefing spec
# ------------------------------------------------------------------

def test_imported_goods_without_country_of_origin_fails_rule_6_1_a():
    """Imported by prefix without Country of Origin must fail Rule 6(1)(a)."""
    imported_no_origin = (
        "Imported by Global Foods Pvt Ltd, Plot 5 Export Road, Mumbai, Maharashtra 400001\n"
        "Wheat Flour Net Qty 2 kg MRP Rs. 120 (incl. of all taxes) 03/2026\n"
        "Consumer Care Cell, 400001 9898989898 care@globalfoods.example\n"
        # No 'Country of Origin:' line
    )
    results, _, _ = statuses(imported_no_origin)
    assert results[StatutoryRule.RULE_6_1_A] == RuleStatus.FAIL


def test_future_month_same_year_rejected():
    """A manufacture month in the future within the same audit year must fail Rule 6(1)(d)."""
    # Audit date is August 2026; manufacture date December 2026 is future
    results, _, _ = statuses(VALID.replace("01/2026", "12/2026"), audit_dt=date(2026, 8, 23))
    assert results[StatutoryRule.RULE_6_1_D] == RuleStatus.FAIL


def test_brand_only_commodity_name_fails_rule_6_1_b():
    """A label with only a brand name (no generic commodity) must fail Rule 6(1)(b)."""
    brand_only = (
        "Manufactured by Acme Foods, Plot 4 Industrial Road, Pune, Maharashtra 411001\n"
        "BRANDO CLASSIC Net Qty 200 g MRP Rs. 50 (incl. of all taxes) 06/2026\n"
        "Consumer Care Cell, 411001 9876543210 care@acme.example"
    )
    results, _, _ = statuses(brand_only)
    assert results[StatutoryRule.RULE_6_1_B] == RuleStatus.FAIL


def test_missing_phone_fails_rule_6_1_f():
    """Consumer care without a valid phone number must fail Rule 6(1)(f)."""
    no_phone = VALID.replace("9876543210", "")
    results, _, _ = statuses(no_phone)
    assert results[StatutoryRule.RULE_6_1_F] == RuleStatus.FAIL


def test_missing_email_fails_rule_6_1_f():
    """Consumer care without an email address must fail Rule 6(1)(f)."""
    no_email = VALID.replace("care@acme.example", "")
    results, _, _ = statuses(no_email)
    assert results[StatutoryRule.RULE_6_1_F] == RuleStatus.FAIL


def test_trust_score_decremented_per_violation():
    """Critical rule failures reduce trust score by 25; major infractions by 15."""
    tax_fail_text = VALID.replace(" (incl. of all taxes)", "")
    _, _, rules = statuses(tax_fail_text)
    score = calculate_trust_score(rules)
    assert score <= 75

    unit_fail_text = VALID.replace("2 kg", "500 gm")
    _, _, rules2 = statuses(unit_fail_text)
    score2 = calculate_trust_score(rules2)
    assert score2 <= 75


# ------------------------------------------------------------------
# Rule 5 (font height) and Bilingual Consistency tests
# ------------------------------------------------------------------

def test_rule5_font_height_valid():
    text = "Net Qty 100 g"
    rules, _, _, _, _, _ = audit_text(text, font_height_mm=2.0)
    res = {r.rule: r.status for r in rules}
    assert res[StatutoryRule.RULE_5] == RuleStatus.PASS


def test_rule5_font_height_invalid_small():
    text = "Net Qty 100 g"
    rules, _, _, _, _, _ = audit_text(text, font_height_mm=1.5)
    res = {r.rule: r.status for r in rules}
    assert res[StatutoryRule.RULE_5] == RuleStatus.FAIL


def test_rule5_font_height_invalid_medium():
    text = "Net Qty 300 g"
    rules, _, _, _, _, _ = audit_text(text, font_height_mm=3.5)
    res = {r.rule: r.status for r in rules}
    assert res[StatutoryRule.RULE_5] == RuleStatus.FAIL


def test_rule5_font_height_invalid_large():
    text = "Net Qty 600 g"
    rules, _, _, _, _, _ = audit_text(text, font_height_mm=5.0)
    res = {r.rule: r.status for r in rules}
    assert res[StatutoryRule.RULE_5] == RuleStatus.FAIL



def test_bilingual_exact_match():
    english_text = "Net Qty 500 g MRP Rs. 250 (incl. of all taxes)"
    hindi_text = "शुद्ध मात्रा 500 g अधिकतम खुदरा मूल्य ₹250 सभी करों सहित"
    rules, _, _, _, _, _ = audit_text(english_text, hindi_text=hindi_text)
def test_bilingual_match_passes():
    text = "Net Qty 100 g MRP Rs. 50"
    hindi_text = "Net Qty 100 g MRP Rs. 50"
    rules, _, _, _, _, _ = audit_text(text, hindi_text=hindi_text)
    res = {r.rule: r.status for r in rules}
    assert res[StatutoryRule.BILINGUAL] == RuleStatus.PASS

def test_bilingual_mrp_mismatch():
    english_text = "Net Qty 500 g MRP Rs. 250 (incl. of all taxes)"
    hindi_text = "शुद्ध मात्रा 500 g अधिकतम खुदरा मूल्य ₹200 सभी करों सहित"
    rules, _, _, _, _, _ = audit_text(english_text, hindi_text=hindi_text)
    res = {r.rule: r.status for r in rules}
    assert res[StatutoryRule.BILINGUAL] == RuleStatus.FAIL

def test_bilingual_qty_mismatch():
    english_text = "Net Qty 500 g MRP Rs. 250 (incl. of all taxes)"
    hindi_text = "शुद्ध मात्रा 400 g अधिकतम खुदरा मूल्य ₹250 सभी करों सहित"
    rules, _, _, _, _, _ = audit_text(english_text, hindi_text=hindi_text)
def test_bilingual_mismatch_fails():
    text = "Net Qty 100 g MRP Rs. 50"
    hindi_text = "Net Qty 100 g MRP Rs. 60"
    rules, _, _, _, _, _ = audit_text(text, hindi_text=hindi_text)
    res = {r.rule: r.status for r in rules}
    assert res[StatutoryRule.BILINGUAL] == RuleStatus.FAIL

def test_bilingual_no_hindi():
    english_text = "Net Qty 500 g MRP Rs. 250 (incl. of all taxes)"
    rules, _, _, _, _, _ = audit_text(english_text)
    res = {r.rule: r for r in rules}
    # If hindi_text is None, BILINGUAL shouldn't be evaluated, or shouldn't fail.
    # Currently it might not be in rules if hindi_text is None
    assert StatutoryRule.BILINGUAL not in res




def test_invalid_units_rejected():
    invalid_units = ["gm", "gms", "m.l.", "ltr", "kgs", "gm."]
    for invalid_unit in invalid_units:
        test_text = VALID.replace("2 kg", f"2 {invalid_unit}")
        results, _, _ = statuses(test_text)
        assert results[StatutoryRule.RULE_6_1_C] == RuleStatus.FAIL


def test_missing_mfg_prefix_rejected():
    test_text = VALID.replace("Manufactured by ", "")
    results, _, _ = statuses(test_text)
    assert results[StatutoryRule.RULE_6_1_A] == RuleStatus.FAIL


def test_missing_pin_code_rejected():
    test_text = VALID.replace("411001", "")
    results, _, _ = statuses(test_text)
    assert results[StatutoryRule.RULE_6_1_A] == RuleStatus.FAIL


def test_usp_rounding_edge_cases():
    # 1050g with specific MRP to trigger rounding within ±₹0.01 margin
    # 1050g = 1.05kg. Let's say MRP is 100. USP should be 100 / 1.05 = 95.238... -> 95.24
    test_text_g = VALID.replace("2 kg", "1050 g").replace("100", "100").replace("50/kg", "95.24/kg")
    results_g, usp_g, _ = statuses(test_text_g)
    assert results_g[StatutoryRule.RULE_6_11] == RuleStatus.PASS

    # 1.5L = 1500ml. Let's say MRP is 100. USP should be 100 / 1.5 = 66.666... -> 66.67
    test_text_l = VALID.replace("2 kg", "1.5 L").replace("100", "100").replace("50/kg", "66.67/l")
    results_l, usp_l, _ = statuses(test_text_l)
    assert results_l[StatutoryRule.RULE_6_11] == RuleStatus.PASS

    # Test tolerance margin. 95.23 should pass (diff 0.01)
    test_text_g_lower = VALID.replace("2 kg", "1050 g").replace("100", "100").replace("50/kg", "95.23/kg")
    results_g_lower, usp_g_lower, _ = statuses(test_text_g_lower)
    assert results_g_lower[StatutoryRule.RULE_6_11] == RuleStatus.PASS

    # 95.25 should pass (diff 0.01)
    test_text_g_upper = VALID.replace("2 kg", "1050 g").replace("100", "100").replace("50/kg", "95.25/kg")
    results_g_upper, usp_g_upper, _ = statuses(test_text_g_upper)
    assert results_g_upper[StatutoryRule.RULE_6_11] == RuleStatus.PASS

    # 95.26 should fail (diff > 0.01)
    test_text_g_fail = VALID.replace("2 kg", "1050 g").replace("100", "100").replace("50/kg", "95.26/kg")
    results_g_fail, usp_g_fail, _ = statuses(test_text_g_fail)
    assert results_g_fail[StatutoryRule.RULE_6_11] == RuleStatus.FAIL


def test_missing_tax_suffix():
    test_text = VALID.replace("MRP Rs. 100 (incl. of all taxes)", "MRP Rs. 100/-")
    results, _, _ = statuses(test_text)
    assert results[StatutoryRule.RULE_6_1_E] == RuleStatus.FAIL


# ------------------------------------------------------------------
# Rule engine internal helpers and edge cases tests
# ------------------------------------------------------------------

def test_base_quantity_conversion_kg_to_g():
    qty, unit = _base_quantity(Decimal("2.5"), "kg")
    assert qty == Decimal("2500")
    assert unit == "g"

    qty, unit = _base_quantity(Decimal("2.5"), "KG")
    assert qty == Decimal("2500")
    assert unit == "g"

def test_base_quantity_conversion_l_to_ml():
    qty, unit = _base_quantity(Decimal("1.5"), "l")
    assert qty == Decimal("1500")
    assert unit == "ml"

    qty, unit = _base_quantity(Decimal("1.5"), "L")
    assert qty == Decimal("1500")
    assert unit == "ml"

def test_base_quantity_unchanged_units():
    qty, unit = _base_quantity(Decimal("500"), "g")
    assert qty == Decimal("500")
    assert unit == "g"

    qty, unit = _base_quantity(Decimal("500"), "G")
    assert qty == Decimal("500")
    assert unit == "g"

    qty, unit = _base_quantity(Decimal("500"), "ml")
    assert qty == Decimal("500")
    assert unit == "ml"

    qty, unit = _base_quantity(Decimal("5"), "U")
    assert qty == Decimal("5")
    assert unit == "u"


def test_audit_usp_missing_mrp():
    # Calling audit_usp with None mrp
    rule_result, usp_result = audit_usp("Some text with 50/kg", None, (Decimal("2"), "kg"))

    assert rule_result.rule == StatutoryRule.RULE_6_11
    assert rule_result.status == RuleStatus.WARNING
    assert "USP cannot be calculated without both MRP and net quantity" in rule_result.reason
    assert usp_result.applicable is False


def test_audit_usp_missing_quantity_data():
    # Calling audit_usp with None quantity_data
    rule_result, usp_result = audit_usp("Some text with 50/kg", Decimal("100"), None)

    assert rule_result.rule == StatutoryRule.RULE_6_11
    assert rule_result.status == RuleStatus.WARNING
    assert "USP cannot be calculated without both MRP and net quantity" in rule_result.reason
    assert usp_result.applicable is False


from services.ecommerce_parser import audit_digital_listing
def test_digital_listing_pass():
    text = (
        "Country of Origin: India\n"
        "Manufactured by Swiggy Instamart, Plot 5, New Delhi 411001\n"
        "Net Qty 500 g\n"
        "MRP Rs. 150 (incl. of all taxes)\n"
        "Consumer Care: 1800 123 4567 care@swiggy.in"
    )
    rules = audit_digital_listing(text)
    res = {r.rule: r.status for r in rules}
    assert res[StatutoryRule.RULE_6_1_E] == RuleStatus.PASS
    assert res[StatutoryRule.RULE_6_1_C] == RuleStatus.PASS
    assert res[StatutoryRule.RULE_6_1_A] == RuleStatus.PASS
    assert res[StatutoryRule.RULE_6_1_B] == RuleStatus.PASS
    assert res[StatutoryRule.RULE_6_1_F] == RuleStatus.PASS
def test_ledger_chain_hashing():
    prev = "abc123hash"
    ts = "2026-08-29T10:00:00"
    img_hash = "def456hash"
    gps = "28.7180° N, 77.1750° E"
    summary = "Rule 6(1)(e): FAIL"

    result = compute_ledger_hash(prev, ts, img_hash, gps, summary)

    import hashlib
    expected = hashlib.sha256(f"{prev}{ts}{img_hash}{gps}{summary}".encode("utf-8")).hexdigest()

    assert result == expected

def test_fssai_valid_and_veg_symbol():
    text = "FSSAI Lic No: 10012011000124 with green circle"
    _, _, _, _, _, fssai = audit_text(text)
    assert fssai is not None
    assert fssai.license_number == "10012011000124"
    assert fssai.is_valid_format is True
    assert fssai.veg_nonveg_symbol == "green circle (Veg)"
    assert fssai.status == RuleStatus.PASS

def test_fssai_food_category_strict_units():
    text = "FSSAI Lic No: 10012011000124 Net Qty 500 gm"
    rules, _, _, _, _, fssai = audit_text(text)
    c_rule = next((r for r in rules if r.rule == StatutoryRule.RULE_6_1_C), None)
    assert c_rule is not None
    assert c_rule.status == RuleStatus.FAIL
    assert "Food safety regulations mandate strict SI units" in c_rule.reason

def test_fssai_missing():
    text = "Just some text without license"
    _, _, _, _, _, fssai = audit_text(text)
    assert fssai is None
