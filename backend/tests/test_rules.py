from datetime import date

from services.rule_engine import audit_text
from schemas import RuleStatus, StatutoryRule

VALID = """Manufactured by Acme Foods, Plot 4 Industrial Road, Pune, Maharashtra 411001
Wheat Flour Net Qty 2 kg MRP Rs. 100 (incl. of all taxes) 01/2026
Consumer Care Cell, Plot 4 Industrial Road, Pune, Maharashtra 411001 9876543210 care@acme.example
Country of Origin: India 50/kg"""


def statuses(text):
    rules, usp, _, penalty = audit_text(text, date(2026, 8, 23))
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
