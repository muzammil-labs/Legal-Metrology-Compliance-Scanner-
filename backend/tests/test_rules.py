from datetime import date

from services.rule_engine import audit_text
from schemas import RuleStatus, StatutoryRule

VALID = """Manufactured by Acme Foods, Plot 4 Industrial Road, Pune, Maharashtra 411001
Wheat Flour Net Qty 2 kg MRP Rs. 100 (incl. of all taxes) 01/2026
Consumer Care Cell, Plot 4 Industrial Road, Pune, Maharashtra 411001 9876543210 care@acme.example
Country of Origin: India 50/kg"""


def statuses(text):
    rules, usp, _ = audit_text(text, date(2026, 8, 23))
    return {rule.rule: rule.status for rule in rules}, usp


def test_valid_baseline():
    results, usp = statuses(VALID)
    assert all(results[rule] == RuleStatus.PASS for rule in StatutoryRule)
    assert usp.within_tolerance is True


def test_tax_clause_required():
    results, _ = statuses(VALID.replace(" (incl. of all taxes)", ""))
    assert results[StatutoryRule.RULE_6_1_E] == RuleStatus.FAIL


def test_legacy_unit_rejected():
    results, _ = statuses(VALID.replace("2 kg", "500 gm"))
    assert results[StatutoryRule.RULE_6_1_C] == RuleStatus.FAIL


def test_usp_mismatch_rejected():
    results, _ = statuses(VALID.replace("50/kg", "0.40/kg"))
    assert results[StatutoryRule.RULE_6_11] == RuleStatus.FAIL


def test_invalid_units_rejected():
    invalid_units = ["gm", "gms", "m.l.", "ltr", "kgs", "gm."]
    for invalid_unit in invalid_units:
        test_text = VALID.replace("2 kg", f"2 {invalid_unit}")
        results, _ = statuses(test_text)
        assert results[StatutoryRule.RULE_6_1_C] == RuleStatus.FAIL


def test_missing_mfg_prefix_rejected():
    test_text = VALID.replace("Manufactured by ", "")
    results, _ = statuses(test_text)
    assert results[StatutoryRule.RULE_6_1_A] == RuleStatus.FAIL


def test_missing_pin_code_rejected():
    test_text = VALID.replace("411001", "")
    results, _ = statuses(test_text)
    assert results[StatutoryRule.RULE_6_1_A] == RuleStatus.FAIL


def test_usp_rounding_edge_cases():
    # 1050g with specific MRP to trigger rounding within ±₹0.01 margin
    # 1050g = 1.05kg. Let's say MRP is 100. USP should be 100 / 1.05 = 95.238... -> 95.24
    test_text_g = VALID.replace("2 kg", "1050 g").replace("100", "100").replace("50/kg", "95.24/kg")
    results_g, usp_g = statuses(test_text_g)
    assert results_g[StatutoryRule.RULE_6_11] == RuleStatus.PASS

    # 1.5L = 1500ml. Let's say MRP is 100. USP should be 100 / 1.5 = 66.666... -> 66.67
    test_text_l = VALID.replace("2 kg", "1.5 L").replace("100", "100").replace("50/kg", "66.67/l")
    results_l, usp_l = statuses(test_text_l)
    assert results_l[StatutoryRule.RULE_6_11] == RuleStatus.PASS

    # Test tolerance margin. 95.23 should pass (diff 0.01)
    test_text_g_lower = VALID.replace("2 kg", "1050 g").replace("100", "100").replace("50/kg", "95.23/kg")
    results_g_lower, usp_g_lower = statuses(test_text_g_lower)
    assert results_g_lower[StatutoryRule.RULE_6_11] == RuleStatus.PASS

    # 95.25 should pass (diff 0.01)
    test_text_g_upper = VALID.replace("2 kg", "1050 g").replace("100", "100").replace("50/kg", "95.25/kg")
    results_g_upper, usp_g_upper = statuses(test_text_g_upper)
    assert results_g_upper[StatutoryRule.RULE_6_11] == RuleStatus.PASS

    # 95.26 should fail (diff > 0.01)
    test_text_g_fail = VALID.replace("2 kg", "1050 g").replace("100", "100").replace("50/kg", "95.26/kg")
    results_g_fail, usp_g_fail = statuses(test_text_g_fail)
    assert results_g_fail[StatutoryRule.RULE_6_11] == RuleStatus.FAIL


def test_missing_tax_suffix():
    test_text = VALID.replace("MRP Rs. 100 (incl. of all taxes)", "MRP Rs. 100/-")
    results, _ = statuses(test_text)
    assert results[StatutoryRule.RULE_6_1_E] == RuleStatus.FAIL
