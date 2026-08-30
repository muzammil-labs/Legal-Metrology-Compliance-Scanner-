import os
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Setup our engine FIRST before importing main
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Patch main's engine logic to point directly to our memory engine
patch('models.engine', engine).start()
patch('models.SessionLocal', TestingSessionLocal).start()

from models import Base
Base.metadata.create_all(bind=engine)

# Because main.py executes init_db() and seed_db() on load, they will run against our testing engine!
# That's perfectly fine, because it initializes the test DB with seed data.

from main import app, get_db, status_for
from services.auth import create_access_token, UserRole

def get_auth_headers(role: UserRole = UserRole.CENTRAL_ADMIN):
    token = create_access_token(data={"sub": "testuser", "role": role.value})
    return {"Authorization": f"Bearer {token}"}
from fastapi import Depends
from main import app
from services.auth import RoleChecker, User, Role

def override_role_checker(allowed_roles=None):
    def checker():
        return User(username="test_user", role=Role.CENTRAL_ADMIN)
    return checker

app.dependency_overrides[RoleChecker] = override_role_checker()
from main import get_db, status_for
from schemas import RuleResult, RuleStatus, StatutoryRule, USPResult, PenaltyEstimate
from models import Inspection, Violation, AuditCertificate

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

from services.auth import create_access_token, Role
token = create_access_token({"sub": "test", "role": Role.CENTRAL_ADMIN.value})
client.headers.update({"Authorization": f"Bearer {token}"})


@pytest.fixture(autouse=True)
def clean_db():
    # Setup: clean the database before each test
    db = TestingSessionLocal()
    db.query(Violation).delete()
    db.query(AuditCertificate).delete()
    db.query(Inspection).delete()
    db.commit()
    db.close()
    yield

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_root_status():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "project" in data
    assert "ministry" in data
    assert "docs" in data

def test_status_for():
    # All PASS
    rules_pass = [
        RuleResult(rule=StatutoryRule.RULE_6_1_A, status=RuleStatus.PASS, reason="Ok"),
        RuleResult(rule=StatutoryRule.RULE_6_1_B, status=RuleStatus.PASS, reason="Ok"),
    ]
    assert status_for(rules_pass) == RuleStatus.PASS

    # WARNING present
    rules_warning = [
        RuleResult(rule=StatutoryRule.RULE_6_1_A, status=RuleStatus.PASS, reason="Ok"),
        RuleResult(rule=StatutoryRule.RULE_6_1_B, status=RuleStatus.WARNING, reason="Warn"),
    ]
    assert status_for(rules_warning) == RuleStatus.WARNING

    # FAIL present
    rules_fail = [
        RuleResult(rule=StatutoryRule.RULE_6_1_A, status=RuleStatus.PASS, reason="Ok"),
        RuleResult(rule=StatutoryRule.RULE_6_1_B, status=RuleStatus.WARNING, reason="Warn"),
        RuleResult(rule=StatutoryRule.RULE_6_1_F, status=RuleStatus.FAIL, reason="Fail"),
    ]
    assert status_for(rules_fail) == RuleStatus.FAIL

def test_analytics_summary_empty():
    response = client.get("/api/analytics/summary", headers=get_auth_headers())
    assert response.status_code == 200
    data = response.json()
    assert data["total_inspections"] == 0

def test_inspections_empty():
    response = client.get("/api/inspections", headers=get_auth_headers())
    assert response.status_code == 200
    assert response.json() == []

def test_analytics_export_csv_empty():
    response = client.get("/api/analytics/export-csv", headers=get_auth_headers())
    response = client.get("/api/analytics/export-excel")
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
    content = response.text.strip().replace("\r\n", "\n")
    assert content == "inspection_id,inspected_at,region,source_filename,overall_status,violation_count,trust_score"

@patch("main.audit_text")
@patch("main.extract_label_with_gemini")
def test_scan_api(mock_extract, mock_audit):
    # Setup mock returns
    mock_extract.return_value = {
        "ocr_text": "Dummy extracted text",
        "bounding_boxes": []
    }

    # audit_text returns (rules, usp, extracted_fields, penalty)
    mock_rules = [
        RuleResult(rule=StatutoryRule.RULE_6_1_A, status=RuleStatus.PASS, reason="Mock PASS")
    ]
    mock_usp = USPResult(applicable=False)
    mock_fields = []
    mock_penalty = PenaltyEstimate(sections_violated=[], estimated_fine_range="0")

    mock_audit.return_value = (mock_rules, mock_usp, mock_fields, mock_penalty, None)

    # Prepare dummy file
    response = client.post(
            "/api/scan",
            files=[dummy_file],
            data={"region": "Test Region", "gps_location": "0.0, 0.0"},
            headers=get_auth_headers()
        )
        "/api/scan",
        files={"file": ("test_image.jpg", b"dummy image data", "image/jpeg")},
        data={"region": "Test Region", "gps_location": "0.0, 0.0"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "metadata" in data
    assert data["metadata"]["source_filename"] == "test_image.jpg"
    assert data["overall_status"] == RuleStatus.PASS
    assert data["trust_score"] == 100
