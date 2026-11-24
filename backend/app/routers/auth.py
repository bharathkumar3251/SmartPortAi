import uuid
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import UserAccount, Profile, UserRole, AuditLog, LoginHistory
from app.schemas import LoginRequest, RegisterRequest, TokenResponse
from app.auth_utils import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_user_optional,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    user = db.query(UserAccount).filter(UserAccount.email == email).first()
    
    if not user or not verify_password(req.password, user.password_hash):
        # Record failed login
        db.add(LoginHistory(user_id=user.id if user else None, email=email, success=False, failure_reason="Invalid credentials"))
        db.add(AuditLog(actor_id=user.id if user else None, actor_email=email, action="failed_login", success=False, metadata={"reason": "Invalid credentials"}))
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    profile = db.query(Profile).filter(Profile.id == user.id).first()
    if profile and profile.status == "disabled":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account has been disabled by an administrator")
        
    roles = [r.role for r in db.query(UserRole).filter(UserRole.user_id == user.id).all()]
    
    token = create_access_token(data={"sub": user.id, "email": user.email, "roles": roles})
    
    # Audit log
    db.add(LoginHistory(user_id=user.id, email=email, success=True))
    db.add(AuditLog(actor_id=user.id, actor_email=email, action="login", success=True))
    db.commit()
    
    user_payload = {
        "id": user.id,
        "email": user.email,
        "first_name": profile.first_name if profile else "",
        "last_name": profile.last_name if profile else "",
        "organization": profile.organization if profile else "",
        "status": profile.status if profile else "active",
        "requested_role": profile.requested_role if profile else None,
        "roles": roles,
        "role": roles[0] if roles else None,
    }
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_payload
    }

@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    existing = db.query(UserAccount).filter(UserAccount.email == email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered")
        
    user_id = str(uuid.uuid4())
    pw_hash = hash_password(req.password)
    
    # Check if this is the first user; if so, make them super_admin
    user_count = db.query(UserAccount).count()
    initial_status = "active" if user_count == 0 else "pending"
    initial_role = "super_admin" if user_count == 0 else (req.requested_role or "shipping_company")
    
    user = UserAccount(id=user_id, email=email, password_hash=pw_hash)
    profile = Profile(
        id=user_id,
        email=email,
        first_name=req.first_name,
        last_name=req.last_name,
        organization=req.organization,
        status=initial_status,
        requested_role=req.requested_role if initial_status == "pending" else None,
    )
    user_role = UserRole(user_id=user_id, role=initial_role, granted_by=user_id)
    
    db.add(user)
    db.add(profile)
    db.add(user_role)
    db.add(AuditLog(actor_id=user_id, actor_email=email, action="user_created", success=True, metadata={"initial_role": initial_role, "status": initial_status}))
    db.commit()
    
    roles = [initial_role]
    token = create_access_token(data={"sub": user_id, "email": email, "roles": roles})
    
    user_payload = {
        "id": user_id,
        "email": email,
        "first_name": req.first_name,
        "last_name": req.last_name,
        "organization": req.organization,
        "status": initial_status,
        "requested_role": profile.requested_role,
        "roles": roles,
        "role": roles[0] if roles else None,
    }
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_payload
    }

@router.get("/me")
@router.get("/session")
def get_me(user: Dict[str, Any] = Depends(get_current_user)):
    return {"user": user}

@router.post("/logout")
def logout(user: Optional[Dict[str, Any]] = Depends(get_current_user_optional), db: Session = Depends(get_db)):
    if user:
        db.add(AuditLog(actor_id=user["id"], actor_email=user["email"], action="logout", success=True))
        db.commit()
    return {"message": "Logged out successfully"}

@router.post("/claim-super-admin")
def claim_super_admin(user: Dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if a super admin already exists
    admin_count = db.query(UserRole).filter(UserRole.role == "super_admin").count()
    if admin_count > 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A Super Admin already exists in this workspace")
        
    db.add(UserRole(user_id=user["id"], role="super_admin", granted_by=user["id"]))
    profile = db.query(Profile).filter(Profile.id == user["id"]).first()
    if profile:
        profile.status = "active"
        profile.requested_role = None
        
    db.add(AuditLog(actor_id=user["id"], actor_email=user["email"], action="role_change", success=True, metadata={"claimed_role": "super_admin"}))
    db.commit()
    return {"ok": True, "message": "Super Admin role claimed successfully"}

@router.post("/ensure-system-admin")
def ensure_system_admin(db: Session = Depends(get_db)):
    admin_email = "admin@smartport.ai"
    existing = db.query(UserAccount).filter(UserAccount.email == admin_email).first()
    if not existing:
        uid = str(uuid.uuid4())
        pw_hash = hash_password("Admin@123")
        db.add(UserAccount(id=uid, email=admin_email, password_hash=pw_hash))
        db.add(Profile(id=uid, email=admin_email, first_name="Chief", last_name="Administrator", organization="SmartPort Global Authority", status="active"))
        db.add(UserRole(user_id=uid, role="super_admin", granted_by=uid))
        db.commit()
    return {"ok": True}

