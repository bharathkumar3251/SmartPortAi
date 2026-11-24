from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Berth, AuditLog
from app.auth_utils import get_current_user, get_current_user_optional

router = APIRouter(prefix="/berths", tags=["Berth Infrastructure"])

class BerthUpdateBody(BaseModel):
    status: Optional[str] = None
    current_vessel_name: Optional[str] = None

@router.get("")
def list_berths(
    db: Session = Depends(get_db),
    user: Any = Depends(get_current_user_optional),
):
    berths = db.query(Berth).order_by(Berth.code.asc()).all()
    return [
        {
            "id": b.id,
            "code": b.code,
            "terminal_name": b.terminal_name,
            "length_m": b.length_m,
            "max_draft_m": b.max_draft_m,
            "status": b.status,
            "created_at": b.created_at,
        }
        for b in berths
    ]

@router.patch("/{identifier}")
@router.patch("/{identifier}/status")
def update_berth_status(
    identifier: str,
    req: Optional[BerthUpdateBody] = None,
    status_val: Optional[str] = None,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Berth)
    if identifier.isdigit():
        berth = query.filter(Berth.id == int(identifier)).first()
    else:
        berth = query.filter(Berth.code == identifier).first()

    if not berth:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Berth not found")
        
    new_status = (req.status if req else None) or status_val or berth.status
    berth.status = new_status
    db.add(AuditLog(
        actor_id=user["id"],
        actor_email=user["email"],
        action="data_updated",
        target_type="berth",
        target_id=berth.code,
        metadata={"status": new_status},
        success=True
    ))
    db.commit()
    return {"id": berth.id, "code": berth.code, "status": berth.status, "terminal_name": berth.terminal_name}

