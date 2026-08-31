import json
import os
import sys
import sqlite3
import io
from hashlib import sha256
from pathlib import Path

# Add project root to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient

from main import app
from schemas import AuditResponse

class ReadinessError(Exception):
    pass

def verify_database():
    db_path = Path("inspections.db")
    if not db_path.exists():
        raise ReadinessError("backend/inspections.db does not exist.")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM inspections")
    count = cursor.fetchone()[0]
    conn.close()

    if count < 25:
        raise ReadinessError(f"inspections.db has {count} records, expected >= 25.")

def verify_endpoints(client: TestClient):
    response = client.get("/health")
    if response.status_code != 200:
        raise ReadinessError(f"/health failed with {response.status_code}")

    dummy_file = {"file": ("test_image.jpg", io.BytesIO(b"dummy image data"), "image/jpeg")}
    response = client.post("/api/scan", files=dummy_file, data={"region": "Test Region", "gps_location": "0.0, 0.0"})
    if response.status_code != 200:
        raise ReadinessError(f"/api/scan failed with {response.status_code}")

    response = client.get("/api/analytics/summary")
    if response.status_code != 200:
        raise ReadinessError(f"/api/analytics/summary failed with {response.status_code}")

    response = client.post("/api/v1/pre-audit", json={})
    if response.status_code != 200:
        raise ReadinessError(f"/api/v1/pre-audit failed with {response.status_code}")

def verify_pdf_generation(client: TestClient):
    response = client.get("/api/inspections/1/export-notice")
    if response.status_code != 200:
        raise ReadinessError(f"/api/inspections/1/export-notice failed with {response.status_code}")

    content = response.content
    if not content:
        raise ReadinessError("PDF content is empty.")

    hash_str = sha256(content).hexdigest()
    if len(hash_str) != 64:
        raise ReadinessError("Invalid SHA-256 hash for PDF notice.")

def verify_fixtures():
    fixtures = ["control_pass.json", "control_fail_tax.json", "control_fail_unit.json"]
    base_dir = Path("../frontend/src/fixtures")

    schema_keys = set(AuditResponse.model_fields.keys())

    for fixture in fixtures:
        path = base_dir / fixture
        if not path.exists():
            raise ReadinessError(f"Fixture {fixture} does not exist.")

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        fixture_keys = set(data.keys())
        if fixture_keys != schema_keys:
            raise ReadinessError(f"Fixture {fixture} keys do not match AuditResponse keys. Expected {schema_keys}, got {fixture_keys}")

def main():
    try:
        verify_database()

        client = TestClient(app)
        verify_endpoints(client)
        verify_pdf_generation(client)

        verify_fixtures()

        print("\033[92m100% STAGE DEMO READY\033[0m")
    except Exception as e:
        print(f"\033[91mDiagnostic Failed: {e}\033[0m")
        exit(1)

if __name__ == "__main__":
    main()
