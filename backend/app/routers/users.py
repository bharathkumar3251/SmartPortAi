from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Profile, UserRole, AuditLog
from app.schemas import RoleActionRequest, StatusUpdateRequest
from app.auth_utils import get_current_user

router = APIRouter(prefix="/users", tags=["Users & Admin Governance"])

def require_super_admin(current_user: Dict[str, Any] = Depends(get_current_user)):
    if "super_admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super Admin privilege required")
    return current_user

@router.get("")
def list_users(
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    profiles = db.query(Profile).all()
    result = []
    for p in profiles:
        roles = [r.role for r in db.query(UserRole).filter(UserRole.user_id == p.id).all()]
        result.append({
            "id": p.id,
            "email": p.email,
            "first_name": p.first_name,
            "last_name": p.last_name,
            "organization": p.organization,
            "status": p.status,
            "requested_role": p.requested_role,
            "roles": roles,
            "created_at": p.created_at,
        })
    return result

@router.post("/{user_id}/approve-role")
def approve_role(
    user_id: str,
    req: RoleActionRequest,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    role_to_grant = req.role or profile.requested_role or "shipping_company"
    
    # Check if role already exists
    existing = db.query(UserRole).filter(UserRole.user_id == user_id, UserRole.role == role_to_grant).first()
    if not existing:
        db.add(UserRole(user_id=user_id, role=role_to_grant, granted_by=admin["id"]))
        
    profile.status = "active"
    profile.requested_role = None
    
    db.add(AuditLog(
        actor_id=admin["id"],
        actor_email=admin["email"],
        action="role_change",
        target_type="user",
        target_id=user_id,
        metadata={"action": "approve_role", "granted_role": role_to_grant, "status": "active"},
        success=True
    ))
    db.commit()
    return {"ok": True, "message": f"Role {role_to_grant} approved for {profile.email}"}

@router.post("/{user_id}/reject-role")
def reject_role(
    user_id: str,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    profile.requested_role = None
    db.add(AuditLog(
        actor_id=admin["id"],
        actor_email=admin["email"],
        action="user_updated",
        target_type="user",
        target_id=user_id,
        metadata={"action": "reject_role_request"},
        success=True
    ))
    db.commit()
    return {"ok": True, "message": "Role request rejected"}

@router.post("/{user_id}/grant-role")
def grant_role(
    user_id: str,
    req: RoleActionRequest,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    if not req.role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role is required")
        
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    existing = db.query(UserRole).filter(UserRole.user_id == user_id, UserRole.role == req.role).first()
    if not existing:
        db.add(UserRole(user_id=user_id, role=req.role, granted_by=admin["id"]))
        
    db.add(AuditLog(
        actor_id=admin["id"],
        actor_email=admin["email"],
        action="role_change",
        target_type="user",
        target_id=user_id,
        metadata={"action": "grant_role", "role": req.role},
        success=True
    ))
    db.commit()
    return {"ok": True, "message": f"Role {req.role} granted"}

@router.post("/{user_id}/revoke-role")
def revoke_role(
    user_id: str,
    req: RoleActionRequest,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    if not req.role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role is required")
        
    if req.role == "super_admin":
        admin_count = db.query(UserRole).filter(UserRole.role == "super_admin").count()
        if admin_count <= 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot revoke the last Super Admin role")
            
    db.query(UserRole).filter(UserRole.user_id == user_id, UserRole.role == req.role).delete()
    db.add(AuditLog(
        actor_id=admin["id"],
        actor_email=admin["email"],
        action="role_change",
        target_type="user",
        target_id=user_id,
        metadata={"action": "revoke_role", "role": req.role},
        success=True
    ))
    db.commit()
    return {"ok": True, "message": f"Role {req.role} revoked"}

@router.post("/{user_id}/status")
def set_status(
    user_id: str,
    req: StatusUpdateRequest,
    admin: Dict[str, Any] = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    if req.status not in ("pending", "active", "disabled"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status value")
        
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    profile.status = req.status
    db.add(AuditLog(
        actor_id=admin["id"],
        actor_email=admin["email"],
        action="user_updated",
        target_type="user",
        target_id=user_id,
        metadata={"action": "set_status", "status": req.status},
        success=True
    ))
    db.commit()
    return {"ok": True, "message": f"Status updated to {req.status}"}

