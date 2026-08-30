from datetime import datetime, timedelta
from hashlib import sha256

try:
    from backend.models import AuditCertificate, Inspection, SessionLocal, Violation, init_db
except ModuleNotFoundError:
    from models import AuditCertificate, Inspection, SessionLocal, Violation, init_db

REGIONS_DATA = [
    {"region": "North Delhi - Azadpur Mandi", "gps": "28.7180° N, 77.1750° E"},
    {"region": "South Mumbai - Crawford Market", "gps": "18.9482° N, 72.8347° E"},
    {"region": "Bengaluru Urban - KR Market", "gps": "12.9654° N, 77.5753° E"},
    {"region": "Kolkata Central - Burrabazar", "gps": "22.5855° N, 88.3540° E"},
    {"region": "Chennai South - T. Nagar", "gps": "13.0418° N, 80.2341° E"},
    {"region": "Ahmedabad - Kalupur", "gps": "23.0258° N, 72.5960° E"},
    {"region": "Hyderabad - Begum Bazar", "gps": "17.3753° N, 78.4744° E"},
]

SAMPLE_PRODUCTS = [
    ("Wheat Flour 5kg Pack", "PASS", 100, []),
    ("Mustard Oil 1L Bottle", "PASS", 100, []),
    ("Premium Biscuits 200g", "FAIL", 75, [("Rule 6(1)(e)", "FAIL", "MRP Rs. 40/- without mandatory tax inclusion declaration")]),
    ("Packaged Basmati Rice 1000 gm", "FAIL", 50, [
        ("Rule 6(1)(c)", "FAIL", "Non-standard unit 'gm' used instead of statutory SI symbol 'g'"),
        ("Rule 6(11)", "FAIL", "Missing mandatory per-unit Unit Sale Price (USP) for >1kg item")
    ]),
    ("Imported Chocolate Bar", "FAIL", 60, [
        ("Rule 6(1)(a)", "FAIL", "Missing Country of Origin on imported commodity"),
        ("Rule 6(1)(f)", "WARNING", "Consumer care toll-free helpline number missing")
    ]),
    ("Refined Sugar 1 kg", "PASS", 100, []),
    ("Herbal Tea 250g", "PASS", 100, []),
    ("Instant Noodles Family Pack", "FAIL", 70, [("Rule 6(1)(d)", "FAIL", "Date of manufacture is missing standard MM/YYYY format")]),
    ("Detergent Powder 2 kg", "PASS", 100, []),
    ("Spice Mix 100g", "PASS", 100, []),
]


def seed(count: int = 30):
    init_db()
    db = SessionLocal()
    if db.query(Inspection).count() >= count:
        db.close()
        return

    for index in range(count):
        prod = SAMPLE_PRODUCTS[index % len(SAMPLE_PRODUCTS)]
        loc = REGIONS_DATA[index % len(REGIONS_DATA)]
        status = prod[1]
        score = prod[2]
        violations_to_add = prod[3]

        text = f"Audit Record: {prod[0]}. Inspected in {loc['region']}."
        cert_no = f"LM-2026{(index+1):04d}-{index+1000:04d}"

        inspection = Inspection(
            inspected_at=datetime.utcnow() - timedelta(days=index * 2, hours=index % 12),
            source_filename=f"{prod[0].lower().replace(' ', '_')}_{index + 1}.jpg",
            sha256=sha256(f"seed-doca-audit-{index}-{prod[0]}".encode()).hexdigest(),
            region=loc["region"],
            gps_location=loc["gps"],
            trust_score=score,
            overall_status=status,
            ocr_text=text,
        )
        db.add(inspection)
        db.flush()

        for v_rule, v_status, v_reason in violations_to_add:
            db.add(Violation(
                inspection_id=inspection.id,
                rule=v_rule,
                status=v_status,
                reason=v_reason,
            ))

        db.add(AuditCertificate(
            inspection_id=inspection.id,
            certificate_number=cert_no,
            sha256_seal=sha256(f"SEAL-{cert_no}".encode()).hexdigest(),
        ))

    db.commit()
    db.close()


if __name__ == "__main__":
    seed()
    print("Seeded 30 realistic historical inspections across regional retail zones.")
