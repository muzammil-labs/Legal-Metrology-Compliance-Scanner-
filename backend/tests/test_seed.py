import sys
import importlib
from unittest.mock import patch, MagicMock

def test_seed_import_fallback_error():
    """
    Test the import fallback mechanism in seed.py.
    When backend.models is not available, it should fallback to importing from models directly.
    """
    import backend.seed

    mock_models_module = MagicMock()
    mock_models_module.AuditCertificate = "MockAuditCertificate"
    mock_models_module.Inspection = "MockInspection"
    mock_models_module.SessionLocal = "MockSessionLocal"
    mock_models_module.Violation = "MockViolation"
    mock_models_module.init_db = "MockInitDb"

    # Store the original __import__ to use for everything else
    orig_import = __import__

    def mock_import(name, globals=None, locals=None, fromlist=(), level=0):
        if name == "backend.models":
            raise ModuleNotFoundError("No module named 'backend.models'")
        if name == "models":
            return mock_models_module
        return orig_import(name, globals, locals, fromlist, level)

    try:
        with patch("builtins.__import__", side_effect=mock_import):
            # Force a reload so the module-level code runs again with our mock
            importlib.reload(backend.seed)

        # Verify that the variables were loaded from our mock (i.e. the fallback worked)
        assert backend.seed.AuditCertificate == "MockAuditCertificate"
        assert backend.seed.Inspection == "MockInspection"
        assert backend.seed.SessionLocal == "MockSessionLocal"
        assert backend.seed.Violation == "MockViolation"
        assert backend.seed.init_db == "MockInitDb"
    finally:
        # Restore normal state even if test fails
        importlib.reload(backend.seed)
