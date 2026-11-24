from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AuditLog
from app.schemas import AuditLogCreate
from app.auth_utils import get_current_user_optional

router = APIRouter(prefix="/audit-logs", tags=["Audit & Compliance"])

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

@router.get("")
def list_audit_logs(
    limit: int = Query(25, ge=1, le=100),
    page: int = Query(0, ge=0),
    action: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: Any = Depends(get_current_user_optional),
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if q:
        term = f"%{q.lower()}%"
        query = query.filter((AuditLog.actor_email.ilike(term)) | (AuditLog.action.ilike(term)) | (AuditLog.target_id.ilike(term)))
        
    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).offset(page * limit).limit(limit).all()
    
    return [
        {
            "id": l.id,
            "actor_id": l.actor_id,
            "actor_email": l.actor_email,
            "action": l.action,
            "target_type": l.target_type,
            "target_id": l.target_id,
            "metadata": l.meta or {},
            "ip_address": l.ip_address,
            "user_agent": l.user_agent,
            "success": l.success,
            "created_at": l.created_at,
        }
        for l in logs
    ]

@router.post("")
def create_audit_log(
    req: AuditLogCreate,
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    log = AuditLog(
        actor_id=user["id"] if user else None,
        actor_email=user["email"] if user else None,
        action=req.action,
        target_type=req.target_type,
        target_id=req.target_id,
        meta=req.metadata or {},
        ip_address=req.ip_address,
        user_agent=req.user_agent,
        success=req.success if req.success is not None else True,
        created_at=utc_now_iso(),
    )
    db.add(log)
    db.commit()
    return {"ok": True, "id": log.id}
