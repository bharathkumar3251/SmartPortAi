from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Notification
from app.auth_utils import get_current_user_optional, get_current_user

router = APIRouter(prefix="/notifications", tags=["Notification Center"])

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

@router.get("")
def list_notifications(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
):
    query = db.query(Notification).filter(Notification.archived_at.is_(None))
    if user:
        # Match user notifications OR broadcast (user_id is None)
        query = query.filter((Notification.user_id == user["id"]) | (Notification.user_id.is_(None)))
    else:
        query = query.filter(Notification.user_id.is_(None))
        
    notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()
    return [
        {
            "id": n.id,
            "title": n.title,
            "body": n.body,
            "category": n.category,
            "priority": n.priority,
            "link": n.link,
            "read": n.read,
            "read_at": n.read_at,
            "created_at": n.created_at,
        }
        for n in notifications
    ]

@router.patch("/{notification_id}/read")
def mark_read(
    notification_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
        
    n.read = True
    n.read_at = utc_now_iso()
    db.commit()
    return {"ok": True, "id": notification_id}

@router.post("/mark-all-read")
def mark_all_read(
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = utc_now_iso()
    db.query(Notification).filter((Notification.user_id == user["id"]) | (Notification.user_id.is_(None))).update(
        {"read": True, "read_at": now},
        synchronize_session=False
    )
    db.commit()
    return {"ok": True}

