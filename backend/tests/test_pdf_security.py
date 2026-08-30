import pytest
from datetime import datetime
from services.pdf_generator import generate_section_36_notice

class MockViolation:
    def __init__(self, rule, status, reason):
        self.rule = rule
        self.status = status
        self.reason = reason

def test_pdf_content_injection_sanitization():
    v = MockViolation("<rule_tag>", "FAIL", "<reason_tag>")

    try:
        pdf_bytes = generate_section_36_notice(
            inspection_id=1,
            source_filename="<script>alert(1)</script>.jpg",
            sha256_digest="abcdef1234567890",
            region="<Delhi_Region>",
            gps_location="<gps_coordinates>",
            inspected_at=datetime.now(),
            overall_status="FAIL",
            violations=[v],
            ocr_text="<ocr_text_data>"
        )
        # Should generate successfully without any paraparser exception
        assert isinstance(pdf_bytes, bytes)
        assert len(pdf_bytes) > 0
    except Exception as e:
        pytest.fail(f"PDF generation failed due to unescaped tags: {e}")
