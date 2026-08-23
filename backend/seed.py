from datetime import datetime, timedelta
from hashlib import sha256

try:
    from backend.models import AuditCertificate, Inspection, SessionLocal, Violation, init_db
except ModuleNotFoundError:
    from models import AuditCertificate, Inspection, SessionLocal, Violation, init_db

REGIONS = ["Delhi", "Maharashtra", "Karnataka", "Gujarat", "Tamil Nadu"]


def seed(count: int = 25):
    init_db()
    db = SessionLocal()
    if db.query(Inspection).count() >= count:
        db.close()
        return
    for index in range(count):
        status = "PASS" if index % 3 else "FAIL"
        text = "Historical packaged commodity audit"
        inspection = Inspection(inspected_at=datetime.utcnow() - timedelta(days=index * 3), source_filename=f"historical-{index + 1:02d}.jpg", sha256=sha256(f"historical-{index}".encode()).hexdigest(), region=REGIONS[index % len(REGIONS)], overall_status=status, ocr_text=text)
        db.add(inspection)
        db.flush()
        if status == "FAIL":
            db.add(Violation(inspection_id=inspection.id, rule="Rule 6(1)(e)", status="FAIL", reason="Historical record: tax inclusion declaration requires review."))
        db.add(AuditCertificate(inspection_id=inspection.id, certificate_number=f"LM-{inspection.id:08d}"))
    db.commit()
    db.close()


if __name__ == "__main__":
    seed()
    print("Seeded historical inspections")
