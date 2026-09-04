# DEPRECATED — real implementation is in services/gemini_service.py
# This file is a forwarding shim only. Do not add logic here.
from services.gemini_service import (  # noqa: F401
    extract_label_with_gemini as extract_label_with_gemini,
)
