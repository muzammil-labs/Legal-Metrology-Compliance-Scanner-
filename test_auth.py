import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.auth import create_access_token, UserRole

client = TestClient(app)

def test_auth_login():
    response = client.post("/api/token", json={"username": "inspector", "password": "any", "role": "FIELD_INSPECTOR"})
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_role_guard_pre_audit():
    # Only Central Admin should have access
    token = create_access_token({"sub": "admin", "role": UserRole.CENTRAL_ADMIN.value})
    response = client.post("/api/v1/pre-audit", headers={"Authorization": f"Bearer {token}"}, json={"text": "test"})
    assert response.status_code == 200

    token = create_access_token({"sub": "inspector", "role": UserRole.FIELD_INSPECTOR.value})
    response = client.post("/api/v1/pre-audit", headers={"Authorization": f"Bearer {token}"}, json={"text": "test"})
    assert response.status_code == 403

def test_unauthenticated_access():
    response = client.get("/api/analytics/summary")
    assert response.status_code == 401
