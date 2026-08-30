import pytest
from httpx import AsyncClient, ASGITransport
from main import app
from fastapi import Depends
from main import app
from services.auth import RoleChecker, User, Role, create_access_token

def override_role_checker(allowed_roles=None):
    def checker():
        return User(username="test_user", role=Role.CENTRAL_ADMIN)
    return checker

app.dependency_overrides[RoleChecker] = override_role_checker()

import io

@pytest.mark.asyncio
async def test_file_upload_limit_scan():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", headers={"Authorization": f"Bearer {create_access_token({'sub': 'test', 'role': Role.CENTRAL_ADMIN.value})}"}) as ac:
        large_content = b"x" * (10 * 1024 * 1024 + 1) # 10MB + 1 byte
        response = await ac.post("/api/scan", files={"file": ("test.jpg", large_content, "image/jpeg")})
        assert response.status_code == 413
        assert response.json() == {"detail": "File size exceeds 10 MB limit"}

@pytest.mark.asyncio
async def test_file_upload_limit_batch_scan():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", headers={"Authorization": f"Bearer {create_access_token({'sub': 'test', 'role': Role.CENTRAL_ADMIN.value})}"}) as ac:
        large_content = b"x" * (10 * 1024 * 1024 + 1) # 10MB + 1 byte
        response = await ac.post("/api/scan/batch", files={"files": ("test.jpg", io.BytesIO(large_content), "image/jpeg")})
        assert response.status_code == 413
        assert response.json() == {"detail": "File size exceeds 10 MB limit"}

@pytest.mark.asyncio
async def test_file_upload_success_scan():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", headers={"Authorization": f"Bearer {create_access_token({'sub': 'test', 'role': Role.CENTRAL_ADMIN.value})}"}) as ac:
        small_content = b"x" * 1024 # 1KB
        response = await ac.post("/api/scan", files={"file": ("test.jpg", io.BytesIO(small_content), "image/jpeg")})
        # The test database might not be initialized cleanly or rules may be evaluated,
        # but the request should definitely not be a 413.
        assert response.status_code != 413

@pytest.mark.asyncio
async def test_file_upload_success_batch_scan():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", headers={"Authorization": f"Bearer {create_access_token({'sub': 'test', 'role': Role.CENTRAL_ADMIN.value})}"}) as ac:
        small_content = b"x" * 1024 # 1KB
        response = await ac.post("/api/scan/batch", files={"files": ("test.jpg", io.BytesIO(small_content), "image/jpeg")})
        assert response.status_code != 413
