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
    assert all(results.get(rule, RuleStatus.PASS) == RuleStatus.PASS for rule in StatutoryRule)
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

def test_rule5_font_height_valid():
    text = "Net Qty 100 g"
    rules, _, _ = audit_text(text, font_height_mm=2.0)
    res = {r.rule: r.status for r in rules}
    assert res[StatutoryRule.RULE_5] == RuleStatus.PASS

def test_rule5_font_height_invalid_small():
    text = "Net Qty 100 g"
    rules, _, _ = audit_text(text, font_height_mm=1.5)
    res = {r.rule: r.status for r in rules}
    assert res[StatutoryRule.RULE_5] == RuleStatus.FAIL

def test_rule5_font_height_invalid_medium():
    text = "Net Qty 300 g"
    rules, _, _ = audit_text(text, font_height_mm=3.5)
    res = {r.rule: r.status for r in rules}
    assert res[StatutoryRule.RULE_5] == RuleStatus.FAIL

def test_rule5_font_height_invalid_large():
    text = "Net Qty 600 g"
    rules, _, _ = audit_text(text, font_height_mm=5.0)
    res = {r.rule: r.status for r in rules}
    assert res[StatutoryRule.RULE_5] == RuleStatus.FAIL

def test_bilingual_match_passes():
    text = "Net Qty 100 g MRP Rs. 50"
    hindi_text = "Net Qty 100 g MRP Rs. 50"
    rules, _, _ = audit_text(text, hindi_text=hindi_text)
    res = {r.rule: r.status for r in rules}
    assert res[StatutoryRule.BILINGUAL] == RuleStatus.PASS

def test_bilingual_mismatch_fails():
    text = "Net Qty 100 g MRP Rs. 50"
    hindi_text = "Net Qty 100 g MRP Rs. 60"
    rules, _, _ = audit_text(text, hindi_text=hindi_text)
    res = {r.rule: r.status for r in rules}
    assert res[StatutoryRule.BILINGUAL] == RuleStatus.FAIL
