import time
import pytest
from services.rule_engine import audit_text
from tests.test_rules import VALID

def test_benchmark_audit_text(benchmark):
    benchmark(audit_text, VALID)
