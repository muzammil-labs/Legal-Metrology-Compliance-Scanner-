import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import selectinload
from backend.models import Base, Inspection, Violation
import random
import csv
from io import StringIO

engine = create_engine("sqlite:///backend/inspections.db")
Session = sessionmaker(bind=engine)
db = Session()

# Measure baseline
start = time.time()
rows = db.query(Inspection).all()
output = StringIO()
writer = csv.writer(output)
writer.writerow(["inspection_id", "inspected_at", "region", "overall_status", "violation_count"])
for row in rows:
    writer.writerow([row.id, row.inspected_at.isoformat(), row.region, row.overall_status, len(row.violations)])
out1 = output.getvalue()
end = time.time()
print(f"Baseline time: {end - start:.5f}s")

# Measure optimization
start = time.time()
rows = db.query(Inspection).options(selectinload(Inspection.violations)).all()
output = StringIO()
writer = csv.writer(output)
writer.writerow(["inspection_id", "inspected_at", "region", "overall_status", "violation_count"])
for row in rows:
    writer.writerow([row.id, row.inspected_at.isoformat(), row.region, row.overall_status, len(row.violations)])
out2 = output.getvalue()
end = time.time()
print(f"Optimized time: {end - start:.5f}s")
assert out1 == out2
print("Outputs match!")
