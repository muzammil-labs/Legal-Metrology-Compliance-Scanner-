import sys, subprocess, time, json, urllib.request, urllib.error
import httpx

print('PASS: no crash')

print('Starting uvicorn...')
p = subprocess.Popen(['..\\\\.venv\\\\Scripts\\\\uvicorn.exe', 'index:app', '--port', '8001'])
time.sleep(4)

try:
    with urllib.request.urlopen('http://localhost:8001/health') as r:
        d = json.loads(r.read().decode())
        assert d['status'] == 'ok', d
        print('PASS: health')
except Exception as e:
    print('FAIL health:', e)

try:
    r = httpx.get('http://localhost:8001/nonexistent')
    d = r.json()
    assert d['status_code'] == 404, d
    print('PASS: 404 handler')
except Exception as e:
    print('FAIL 404:', e)

try:
    r = httpx.post('http://localhost:8001/api/scan')
    d = r.json()
    assert d.get('status_code') in [400,422,500], d
    print('PASS: error shape')
except Exception as e:
    print('FAIL scan:', e)

p.terminate()
