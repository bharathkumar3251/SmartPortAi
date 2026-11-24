from typing import Optional, Any, List, Dict
from pydantic import BaseModel, EmailStr

# Auth Schemas
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    organization: Optional[str] = None
    requested_role: Optional[str] = None

class UserProfileResponse(BaseModel):
    id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    organization: Optional[str] = None
    status: str
    requested_role: Optional[str] = None
    roles: List[str] = []
    created_at: str

# Submissions
class SubmissionCreate(BaseModel):
    reference: Optional[str] = None
    vessel_name: str
    imo_number: Optional[str] = None
    shipping_company: str
    cargo_type: Optional[str] = "Containerized General"
    container_count: Optional[int] = 1
    dangerous_goods: Optional[bool] = False
    eta: Optional[str] = None
    notes: Optional[str] = None

class StageAdvanceRequest(BaseModel):
    stage: str
    comment: Optional[str] = None

class BerthAssignRequest(BaseModel):
    berth_code: str

# Containers
class ContainerBulkUpdateRequest(BaseModel):
    container_ids: List[str]
    stage: Optional[str] = None
    yard_block: Optional[str] = None
    bay_row_tier: Optional[str] = None
    assigned_truck: Optional[str] = None
    destination: Optional[str] = None

# Roles & Admin
class RoleActionRequest(BaseModel):
    role: Optional[str] = None

class StatusUpdateRequest(BaseModel):
    status: str  # pending | active | disabled

# Audit
class AuditLogCreate(BaseModel):
    action: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    success: Optional[bool] = True
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

# Dashboard Summary
class DashboardSummaryResponse(BaseModel):
    total_submissions: int
    authority_review: int
    customs_review: int
    active_operations: int
    warehouse_received: int
    dispatch_ready: int
    in_transit: int
    delivered: int
    total_containers: int
    active_containers: int
    active_berths: int
    active_vessels: Optional[int] = 0
    berth_utilization_pct: Optional[float] = 0.0
    containers_in_yard: Optional[int] = 0
    avg_clearance_hours: Optional[float] = 0.0
    stages_breakdown: Optional[Dict[str, int]] = {}

