import pytest
from datetime import datetime
from fastapi.testclient import TestClient

from index import app
from schemas import (
    ExecutiveAnalyticsResponse,
    DistrictMetricSummary,
    StatutoryRule,
    RuleStatus,
    RuleResult,
    FSSAIVerification,
    ECommerceAuditRequest
)
from services.executive_reports import generate_executive_pdf_report, generate_excel_export
from services.rule_engine import (
    audit_text,
    audit_manufacturer_details,
    audit_net_quantity,
    audit_mrp_tax,
    audit_country_of_origin,
    audit_consumer_care,
    audit_unit_sale_price,
    calculate_compounding_fine
)
from services.fssai_auditor import audit_fssai_declarations
from services.ecommerce_parser import audit_digital_listing
from services.auth import UserRole

def test_rule_manufacturer_pass():
    res = audit_manufacturer_details("Manufactured by ABC Corp, PIN: 500001, Industrial Area")
    assert res.status == RuleStatus.PASS
    assert res.rule == StatutoryRule.RULE_6_1_A

def test_rule_manufacturer_warning():
    res = audit_manufacturer_details("Manufactured by ABC Corp, Industrial Area")
    assert res.status == RuleStatus.WARNING

def test_rule_manufacturer_fail():
    res = audit_manufacturer_details("Random text without manufacturer")
    assert res.status == RuleStatus.FAIL

def test_rule_country_of_origin():
    pass_res = audit_country_of_origin("Country of Origin: India")
    assert pass_res.status == RuleStatus.PASS
    fail_res = audit_country_of_origin("Imported item without origin")
    assert fail_res.status == RuleStatus.FAIL

def test_rule_net_quantity_metric_pass():
    res = audit_net_quantity("Net Qty: 500 g")
    assert res.status == RuleStatus.PASS

def test_rule_net_quantity_non_si_fail():
    res = audit_net_quantity("Net Qty: 500 gm")
    assert res.status == RuleStatus.FAIL

def test_rule_mrp_tax_inclusion():
    pass_res = audit_mrp_tax("MRP Rs. 99.00 (incl. of all taxes)")
    assert pass_res.status == RuleStatus.PASS
    fail_res = audit_mrp_tax("MRP Rs. 99.00")
    assert fail_res.status == RuleStatus.FAIL

def test_rule_consumer_care():
    pass_res = audit_consumer_care("For feedback: care@brand.com or Toll Free: 1800-111-222")
    assert pass_res.status == RuleStatus.PASS
    fail_res = audit_consumer_care("No contact information listed")
    assert fail_res.status == RuleStatus.FAIL

def test_rule_unit_sale_price():
    pass_res = audit_unit_sale_price("Unit Sale Price: Rs. 0.50 / g")
    assert pass_res.status == RuleStatus.PASS
    warn_res = audit_unit_sale_price("MRP Rs. 50 (incl. of all taxes)")
    assert warn_res.status == RuleStatus.WARNING

def test_audit_text_comprehensive():
    sample_text = (
        "Mfg by ABC Ltd, PIN: 500001. Country of Origin: India. "
        "Net Qty: 500 g. MRP Rs. 100 (incl. of all taxes). "
        "Consumer Care: care@abc.com. USP Rs. 0.20 / g. Mfg: 10/2025"
    )
    results = audit_text(sample_text)
    if isinstance(results, tuple) and len(results) == 5:
        results = results[0]
    assert isinstance(results, list)
    assert len(results) == 7
    assert all(isinstance(r, RuleResult) for r in results)
    assert all(r.status == RuleStatus.PASS for r in results)


def test_calculate_compounding_fine():
    pass_rules = [RuleResult(rule=StatutoryRule.RULE_6_1_A, status=RuleStatus.PASS, reason="OK")]
    fine_clean = calculate_compounding_fine(pass_rules)
    assert fine_clean["estimated_fine_inr"] == 0

    fail_rules = [RuleResult(rule=StatutoryRule.RULE_6_1_C, status=RuleStatus.FAIL, reason="Invalid Unit")]
    fine_violation = calculate_compounding_fine(fail_rules)
    assert fine_violation["estimated_fine_inr"] > 0

def test_fssai_auditor_declarations():
    food_text = "Ingredients: Sugar, Wheat, Milk. FSSAI Lic. No. 10014011000123. 100% Vegetarian."
    res = audit_fssai_declarations(food_text)
    assert res.is_food_product is True
    assert res.is_license_valid_format is True
    assert res.dietary_type == "VEGETARIAN"

def test_ecommerce_audit_compliant():
    req = ECommerceAuditRequest(
        platform="Blinkit",
        listing_text="Mfg by ABC Corp, PIN: 500001. Country of Origin: India. Net Qty: 500 g. MRP Rs. 150 (incl. of all taxes). Support: care@abc.com"
    )
    res = audit_digital_listing(req)
    assert res.overall_status == "COMPLIANT"
    assert res.total_violations == 0
    assert res.compounding_fine_exposure_inr == 0

def test_ecommerce_audit_violations():
    req = ECommerceAuditRequest(
        platform="Zepto",
        listing_text="Imported chocolate. Net Qty: 200 gm. MRP Rs. 250."
    )
    res = audit_digital_listing(req)
    assert res.overall_status == "NON_COMPLIANT"
    assert res.total_violations > 0
    assert res.compounding_fine_exposure_inr >= 25000

def test_executive_pdf_and_excel_export():
    mock_summary = ExecutiveAnalyticsResponse(
        generated_at=datetime.utcnow().isoformat(),
        reporting_month="August 2026",
        state_aggregate_compliance_rate=92.0,
        total_inspections_statewide=150,
        districts=[
            DistrictMetricSummary(
                district_name="Central Hyderabad",
                total_inspections=50,
                compliance_rate=94.0,
                total_penalties_levied_inr=10000,
                top_statutory_violation="Rule 6(1)(e)",
                repeat_offender_brands=["BrandDemo"]
            )
        ]
    )
    pdf_bytes = generate_executive_pdf_report(mock_summary)
    assert isinstance(pdf_bytes, bytes) and len(pdf_bytes) > 0
    assert pdf_bytes.startswith(b"%PDF")

    xlsx_bytes = generate_excel_export(mock_summary)
    assert isinstance(xlsx_bytes, bytes) and len(xlsx_bytes) > 0

def test_role_permissions(client):
    headers = {"X-User-Role": "FIELD_INSPECTOR"}
    res = client.get("/health", headers=headers)
    assert res.status_code == 200

def test_b2b_saas_preaudit_authentication(client):
    payload = {
        "artwork_text": "Mfg by ABC Ltd, PIN: 500001, Net Qty: 100g, MRP Rs. 50 (incl. of all taxes), Care: help@abc.com, Made in India",
        "brand_name": "Test Brand"
    }
    res_unauth = client.post("/api/v1/pre-audit", json=payload)
    assert res_unauth.status_code in [401, 403]

    headers = {"X-API-Key": "sk_live_fmcg_preaudit_demo2026"}
    res_auth = client.post("/api/v1/pre-audit", json=payload, headers=headers)
    assert res_auth.status_code == 200
    data = res_auth.json()
    assert "overall_status" in data
    assert "rules" in data

def test_fssai_auditor_declarations_non_food():
    non_food_text = "Standard detergent box. Net Qty: 1 kg."
    res = audit_fssai_declarations(non_food_text)
    assert res.is_food_product is False

def test_fssai_auditor_declarations_invalid_lic():
    food_text = "Ingredients: Sugar. FSSAI Lic No 30014011000123. Vegetarian."
    res = audit_fssai_declarations(food_text)
    assert res.is_food_product is True
    assert res.is_license_valid_format is False
def test_fssai_invalid_format():
    food_text = "Ingredients: Sugar, Wheat, Milk. FSSAI Lic. No. 30014011000123. 100% Vegetarian."
    res = audit_fssai_declarations(food_text)
    assert res.is_food_product is True
    assert res.is_license_valid_format is False
    assert "Missing or malformed 14-digit FSSAI License Number" in res.violations

def test_fssai_not_food_product():
    non_food_text = "Shampoo, Paraben free. Made in India. MRP 100."
    res = audit_fssai_declarations(non_food_text)
    assert res.is_food_product is False
    assert res.status == RuleStatus.PASS

# --- JSON Fallback Tests ---
def test_rule_manufacturer_json_fallback():
    res = audit_manufacturer_details('', {'manufacturer_name': 'ABC Corp', 'manufacturer_pincode': '500001'})
    assert res.status == RuleStatus.PASS

def test_rule_country_of_origin_json_fallback():
    res = audit_country_of_origin('', {'country_of_origin': 'India'})
    assert res.status == RuleStatus.PASS

def test_rule_net_quantity_json_fallback():
    res = audit_net_quantity('', {'net_quantity_value': '500', 'net_quantity_unit': 'g'})
    assert res.status == RuleStatus.PASS

def test_rule_mrp_tax_json_fallback():
    res = audit_mrp_tax('', {'mrp_includes_taxes_declared': 'yes'})
    assert res.status == RuleStatus.PASS

def test_rule_consumer_care_json_fallback():
    res = audit_consumer_care('', {'consumer_care_email': 'care@brand.com'})
    assert res.status == RuleStatus.PASS

def test_rule_unit_sale_price_json_fallback():
    res = audit_unit_sale_price('', {'unit_sale_price': 'Rs. 0.50 per g'})
    assert res.status == RuleStatus.PASS
