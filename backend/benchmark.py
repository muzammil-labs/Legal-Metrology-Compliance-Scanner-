import time
from services.rule_engine import audit_text
from datetime import date

sample_text = """
Manufactured by: Some Fake Company
Road, City, Maharashtra 400001
Country of Origin: India
Product: Biscuits
Net Quantity: 100 g
MRP: Rs. 50 (incl. of all taxes)
Date of Manufacture: 01/2023
Consumer Care Officer, Postal Address, 1800-123-4567, email@example.com
"""

# Warmup
for _ in range(100):
    audit_text(sample_text)

start_time = time.perf_counter()
iterations = 10000
for _ in range(iterations):
    audit_text(sample_text)
end_time = time.perf_counter()

print(f"Baseline Time for {iterations} iterations: {end_time - start_time:.4f} seconds")
