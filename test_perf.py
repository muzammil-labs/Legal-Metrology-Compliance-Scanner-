import time
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from backend.models import Base, Inspection, Violation
import random

engine = create_engine("sqlite:///backend/inspections.db")
Session = sessionmaker(bind=engine)
db = Session()

# Measure baseline
start = time.time()
rows = db.query(Inspection).all()
total = len(rows)
compliant = sum(1 for row in rows if row.overall_status == "PASS")
failed = sum(1 for row in rows if row.overall_status == "FAIL")
warning = sum(1 for row in rows if row.overall_status == "WARNING")
compliance_rate = round((compliant / total * 100), 1) if total > 0 else 0.0

by_region: dict[str, int] = {}
regional_non_compliance: dict[str, int] = {}
for row in rows:
    by_region[row.region] = by_region.get(row.region, 0) + 1
    if row.overall_status != "PASS":
        regional_non_compliance[row.region] = regional_non_compliance.get(row.region, 0) + 1

active_districts = len(by_region)

violations_query = db.query(Violation).all()
violation_breakdown: dict[str, int] = {}
for v in violations_query:
    violation_breakdown[v.rule] = violation_breakdown.get(v.rule, 0) + 1

top_violations = [{"rule": k, "count": v} for k, v in sorted(violation_breakdown.items(), key=lambda item: item[1], reverse=True)[:5]]
end = time.time()
print(f"Baseline time: {end - start:.5f}s")


# Measure optimization
start = time.time()

# 1. Total and status counts
status_counts = db.query(Inspection.overall_status, func.count(Inspection.id)).group_by(Inspection.overall_status).all()
total_opt = 0
compliant_opt = 0
failed_opt = 0
warning_opt = 0

for status, count in status_counts:
    total_opt += count
    if status == "PASS":
        compliant_opt = count
    elif status == "FAIL":
        failed_opt = count
    elif status == "WARNING":
        warning_opt = count

compliance_rate_opt = round((compliant_opt / total_opt * 100), 1) if total_opt > 0 else 0.0

# 2. Region counts
region_counts = db.query(Inspection.region, func.count(Inspection.id)).group_by(Inspection.region).all()
by_region_opt = {region: count for region, count in region_counts}
active_districts_opt = len(by_region_opt)

# 3. Regional non-compliance
regional_nc_counts = db.query(Inspection.region, func.count(Inspection.id)).filter(Inspection.overall_status != "PASS").group_by(Inspection.region).all()
regional_non_compliance_opt = {region: count for region, count in regional_nc_counts}

# 4. Violation breakdown
violation_counts = db.query(Violation.rule, func.count(Violation.id)).group_by(Violation.rule).all()
violation_breakdown_opt = {rule: count for rule, count in violation_counts}

top_violations_opt = [{"rule": k, "count": v} for k, v in sorted(violation_breakdown_opt.items(), key=lambda item: item[1], reverse=True)[:5]]

end = time.time()
print(f"Optimized time: {end - start:.5f}s")
print(f"Baseline top violations: {top_violations}")
print(f"Optimized top violations: {top_violations_opt}")
