from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Container, AuditLog
from app.schemas import ContainerBulkUpdateRequest
from app.auth_utils import get_current_user, get_current_user_optional

router = APIRouter(prefix="/containers", tags=["Container Operations"])

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

@router.get("")
def list_containers(
    submission_id: Optional[str] = Query(None),
    stages: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
):
    query = db.query(Container)
    if submission_id:
        query = query.filter(Container.submission_id == submission_id)
    if stages:
        stage_list = [s.strip() for s in stages.split(",") if s.strip()]
        if stage_list:
            query = query.filter(Container.stage.in_(stage_list))
            
    containers = query.order_by(Container.updated_at.desc()).all()
    return [
        {
            "id": c.id,
            "submission_id": c.submission_id,
            "container_number": c.container_number,
            "iso_type": c.iso_type,
            "seal_number": c.seal_number,
            "gross_weight_kg": c.gross_weight_kg,
            "is_reefer": c.is_reefer,
            "is_hazardous": c.is_hazardous,
            "yard_block": c.yard_block,
            "bay_row_tier": c.bay_row_tier,
            "assigned_truck": c.assigned_truck,
            "destination": c.destination,
            "stage": c.stage,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
        }
        for c in containers
    ]

@router.patch("/bulk-update")
def bulk_update_containers(
    req: ContainerBulkUpdateRequest,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not req.container_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No containers provided")
        
    update_data = {"updated_at": utc_now_iso()}
    if req.stage:
        update_data["stage"] = req.stage
    if req.yard_block:
        update_data["yard_block"] = req.yard_block
    if req.bay_row_tier:
        update_data["bay_row_tier"] = req.bay_row_tier
    if req.assigned_truck:
        update_data["assigned_truck"] = req.assigned_truck
    if req.destination:
        update_data["destination"] = req.destination
        
    db.query(Container).filter(Container.id.in_(req.container_ids)).update(update_data, synchronize_session=False)
    
    db.add(AuditLog(
        actor_id=user["id"],
        actor_email=user["email"],
        action="data_updated",
        target_type="containers",
        metadata={"count": len(req.container_ids), "updates": update_data},
        success=True
    ))
    db.commit()
    return {"ok": True, "updated_count": len(req.container_ids)}

from pydantic import BaseModel

class ContainerUpdateSingle(BaseModel):
    status: Optional[str] = None
    stage: Optional[str] = None
    yard_block: Optional[str] = None
    yard_row: Optional[int] = None
    yard_tier: Optional[int] = None
    bay_row_tier: Optional[str] = None
    assigned_truck: Optional[str] = None
    destination: Optional[str] = None

@router.get("/{container_id}")
def get_container(
    container_id: str,
    db: Session = Depends(get_db)
):
    c = db.query(Container).filter(Container.id == container_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Container not found")
    return {
        "id": c.id,
        "submission_id": c.submission_id,
        "container_number": c.container_number,
        "iso_type": c.iso_type,
        "seal_number": c.seal_number,
        "gross_weight_kg": c.gross_weight_kg,
        "is_reefer": c.is_reefer,
        "is_hazardous": c.is_hazardous,
        "yard_block": c.yard_block,
        "bay_row_tier": c.bay_row_tier,
        "assigned_truck": c.assigned_truck,
        "destination": c.destination,
        "stage": c.stage,
        "status": c.stage,
        "created_at": c.created_at,
        "updated_at": c.updated_at,
    }

@router.patch("/{container_id}")
def update_single_container(
    container_id: str,
    req: ContainerUpdateSingle,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    c = db.query(Container).filter(Container.id == container_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Container not found")
        
    stage_val = req.stage or req.status
    if stage_val:
        c.stage = stage_val
    if req.yard_block:
        c.yard_block = req.yard_block
    if req.bay_row_tier:
        c.bay_row_tier = req.bay_row_tier
    elif req.yard_row is not None and req.yard_tier is not None:
        c.bay_row_tier = f"R{req.yard_row}-T{req.yard_tier}"
    if req.assigned_truck:
        c.assigned_truck = req.assigned_truck
    if req.destination:
        c.destination = req.destination
        
    c.updated_at = utc_now_iso()
    db.commit()
    return {
        "id": c.id,
        "container_number": c.container_number,
        "stage": c.stage,
        "status": c.stage,
        "yard_block": c.yard_block,
        "bay_row_tier": c.bay_row_tier,
    }

