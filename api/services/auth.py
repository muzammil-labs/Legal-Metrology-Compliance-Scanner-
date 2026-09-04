from enum import Enum
from typing import List, Optional
from fastapi import Header, HTTPException, status

class UserRole(str, Enum):
    FIELD_INSPECTOR = "FIELD_INSPECTOR"
    DISTRICT_MAGISTRATE = "DISTRICT_MAGISTRATE"
    CENTRAL_ADMIN = "CENTRAL_ADMIN"
    ADMIN = "ADMIN"
    VIEWER = "VIEWER"

Role = UserRole

VALID_API_KEYS = {
    "sk_live_fmcg_preaudit_demo2026": {"company": "FMCG Demo Corp", "tier": "ENTERPRISE_PRO"}
}

def require_role(allowed_roles: List[UserRole]):
    def role_dependency(role: Optional[str] = Header(None, alias="X-User-Role")):
        if not role:
            return UserRole.FIELD_INSPECTOR
        try:
            matched_role = UserRole(role)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid user role specified")
        if matched_role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role permissions")
        return matched_role
    return role_dependency

async def validate_b2b_api_key(x_api_key: Optional[str] = Header(None, alias="X-API-Key")) -> str:
    if not x_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing X-API-Key header")
    if x_api_key not in VALID_API_KEYS:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid X-API-Key")
    return x_api_key
