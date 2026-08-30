import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app
import io

@pytest.mark.asyncio
async def test_file_upload_limit_scan():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        large_content = b"x" * (10 * 1024 * 1024 + 1) # 10MB + 1 byte
        response = await ac.post("/api/scan", files={"file": ("test.jpg", io.BytesIO(large_content), "image/jpeg")})
        assert response.status_code == 413
        assert response.json() == {"detail": "File size exceeds 10 MB limit"}

@pytest.mark.asyncio
async def test_file_upload_limit_batch_scan():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        large_content = b"x" * (10 * 1024 * 1024 + 1) # 10MB + 1 byte
        response = await ac.post("/api/scan/batch", files={"files": ("test.jpg", io.BytesIO(large_content), "image/jpeg")})
        assert response.status_code == 413
        assert response.json() == {"detail": "File size exceeds 10 MB limit"}

@pytest.mark.asyncio
async def test_file_upload_success_scan():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        small_content = b"x" * 1024 # 1KB
        response = await ac.post("/api/scan", files={"file": ("test.jpg", io.BytesIO(small_content), "image/jpeg")})
        # The test database might not be initialized cleanly or rules may be evaluated,
        # but the request should definitely not be a 413.
        assert response.status_code != 413

@pytest.mark.asyncio
async def test_file_upload_success_batch_scan():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        small_content = b"x" * 1024 # 1KB
        response = await ac.post("/api/scan/batch", files={"files": ("test.jpg", io.BytesIO(small_content), "image/jpeg")})
        assert response.status_code != 413
