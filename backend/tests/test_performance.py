import time
import pytest
from services.rule_engine import audit_text
VALID = """Mfg by ABC Ltd, PIN: 500001. Country of Origin: India. Net Qty: 500 g. MRP Rs. 100 (incl. of all taxes). Consumer Care: care@abc.com. USP Rs. 0.20 / g"""

def test_benchmark_audit_text(benchmark):
    benchmark(audit_text, VALID)
