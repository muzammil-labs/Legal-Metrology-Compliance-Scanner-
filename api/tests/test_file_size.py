import pytest
from httpx import AsyncClient, ASGITransport
from index import app
from services.auth import Role
import io

def get_auth_headers():
    return {"Authorization": "Bearer mock_token"}

@pytest.mark.asyncio
async def test_file_upload_limit_scan():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", headers={"Authorization": "Bearer mock_token"}) as ac:
        large_content = b"x" * (10 * 1024 * 1024 + 1)
        response = await ac.post("/api/scan", headers=get_auth_headers(), files={"file": ("test.jpg", io.BytesIO(large_content), "image/jpeg")})
        assert response.status_code == 413
