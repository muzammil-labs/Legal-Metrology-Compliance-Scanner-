import httpx
import sys

print('Testing Live Production Endpoints...')

# 1. Health
try:
    r = httpx.get('https://legal-metrology-compliance-scanner.vercel.app/api/health')
    d = r.json()
    assert d.get('status') == 'ok', f"Expected status 'ok', got {d}"
    print('PASS: API live')
except Exception as e:
    print(f'FAIL API live: {e}')
    if 'r' in locals(): print(r.text)

# 2. 404 shape
try:
    r = httpx.get('https://legal-metrology-compliance-scanner.vercel.app/nonexistent')
    d = r.json()
    assert d.get('status_code') == 404, f"Expected status_code 404, got {d}"
    print('PASS: 404 is JSON')
except Exception as e:
    print(f'FAIL 404 is JSON: {e}')
    if 'r' in locals(): print(r.text)

# 3. Scan without file
try:
    r = httpx.post('https://legal-metrology-compliance-scanner.vercel.app/api/scan')
    d = r.json()
    assert d.get('status_code') in (400, 422), f"Expected status_code 400 or 422, got {d}"
    print('PASS: 422 shape correct')
except Exception as e:
    print(f'FAIL 422 shape correct: {e}')
    if 'r' in locals(): print(r.text)

