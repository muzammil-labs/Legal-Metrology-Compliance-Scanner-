"""
Startup smoke tests — run before every Vercel deploy.
These tests catch import crashes and missing env vars before they become 500s in production.
CI command: cd api && python -m pytest tests/test_startup.py -v
"""
import importlib, sys, os, pytest

def test_index_imports_cleanly():
    """api/index.py must import with zero exceptions."""
    os.environ.setdefault("DEMO_MODE", "true")
    if "index" in sys.modules:
        del sys.modules["index"]
    mod = importlib.import_module("index")
    assert hasattr(mod, "app"), "FastAPI app object missing from index.py"

def test_all_services_importable():
    services = [
        "services.rule_engine",
        "services.fssai_auditor",
        "services.gemini_service",
        "services.auth",
        "services.pdf_generator",
        "services.executive_reports",
        "services.ecommerce_parser",
    ]
    for svc in services:
        try:
            importlib.import_module(svc)
        except Exception as e:
            pytest.fail(f"Service {svc} failed to import: {e}")

def test_database_module():
    from database import engine, get_db, Base
    with engine.connect() as conn:
        conn.execute(__import__("sqlalchemy").text("SELECT 1"))

def test_health_endpoint():
    from fastapi.testclient import TestClient
    import index
    client = TestClient(index.app)
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_404_returns_json_not_crash():
    from fastapi.testclient import TestClient
    import index
    client = TestClient(index.app, raise_server_exceptions=False)
    r = client.get("/this-route-does-not-exist-xyz")
    assert r.status_code == 404
    assert "status_code" in r.json()

def test_scan_missing_file_returns_422_not_500():
    from fastapi.testclient import TestClient
    import index
    client = TestClient(index.app, raise_server_exceptions=False)
    r = client.post("/api/scan")  # no file attached
    assert r.status_code in (400, 422), f"Expected 4xx, got {r.status_code}: {r.text}"
