import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import (
    ShipmentSubmission,
    SubmissionDocument,
    Container,
    AiVerification,
    WorkflowEvent,
    Notification,
    AuditLog,
    Berth,
)
from app.schemas import SubmissionCreate, StageAdvanceRequest, BerthAssignRequest
from app.auth_utils import get_current_user, get_current_user_optional

router = APIRouter(prefix="/submissions", tags=["Shipment Submissions"])

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

@router.get("")
def list_submissions(
    stages: Optional[str] = Query(None, description="Comma-separated stage list"),
    db: Session = Depends(get_db),
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
):
    query = db.query(ShipmentSubmission)
    if stages:
        stage_list = [s.strip() for s in stages.split(",") if s.strip()]
        if stage_list:
            query = query.filter(ShipmentSubmission.stage.in_(stage_list))
    
    submissions = query.order_by(ShipmentSubmission.created_at.desc()).all()
    
    result = []
    for s in submissions:
        result.append({
            "id": s.id,
            "reference": s.reference,
            "vessel_name": s.vessel_name,
            "imo_number": s.imo_number,
            "shipping_company": s.shipping_company,
            "cargo_type": s.cargo_type,
            "container_count": s.container_count,
            "dangerous_goods": s.dangerous_goods,
            "eta": s.eta,
            "stage": s.stage,
            "ai_risk_score": s.ai_risk_score,
            "ai_verdict": s.ai_verdict,
            "berth_code": s.berth_code,
            "notes": s.notes,
            "created_by": s.created_by,
            "created_at": s.created_at,
            "updated_at": s.updated_at,
        })
    return result

@router.get("/{submission_id}")
def get_submission_detail(submission_id: str, db: Session = Depends(get_db)):
    sub = db.query(ShipmentSubmission).filter(ShipmentSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
        
    docs = db.query(SubmissionDocument).filter(SubmissionDocument.submission_id == submission_id).all()
    verifications = db.query(AiVerification).filter(AiVerification.submission_id == submission_id).order_by(AiVerification.created_at.desc()).all()
    events = db.query(WorkflowEvent).filter(WorkflowEvent.submission_id == submission_id).order_by(WorkflowEvent.created_at.desc()).all()
    containers = db.query(Container).filter(Container.submission_id == submission_id).all()
    
    return {
        "submission": {
            "id": sub.id,
            "reference": sub.reference,
            "vessel_name": sub.vessel_name,
            "imo_number": sub.imo_number,
            "shipping_company": sub.shipping_company,
            "cargo_type": sub.cargo_type,
            "container_count": sub.container_count,
            "dangerous_goods": sub.dangerous_goods,
            "eta": sub.eta,
            "stage": sub.stage,
            "ai_risk_score": sub.ai_risk_score,
            "ai_verdict": sub.ai_verdict,
            "berth_code": sub.berth_code,
            "notes": sub.notes,
            "created_by": sub.created_by,
            "created_at": sub.created_at,
            "updated_at": sub.updated_at,
        },
        "documents": [
            {
                "id": d.id,
                "submission_id": d.submission_id,
                "doc_type": d.doc_type,
                "filename": d.filename,
                "storage_path": d.storage_path,
                "uploaded_at": d.uploaded_at,
            }
            for d in docs
        ],
        "verifications": [
            {
                "id": v.id,
                "submission_id": v.submission_id,
                "scope": v.scope,
                "verdict": v.verdict,
                "risk_score": v.risk_score,
                "confidence": v.confidence,
                "checks": v.checks,
                "issues": v.issues,
                "recommendations": v.recommendations,
                "model": v.model,
                "created_at": v.created_at,
            }
            for v in verifications
        ],
        "events": [
            {
                "id": e.id,
                "submission_id": e.submission_id,
                "actor_id": e.actor_id,
                "from_stage": e.from_stage,
                "to_stage": e.to_stage,
                "comment": e.comment,
                "created_at": e.created_at,
            }
            for e in events
        ],
        "containers": [
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
    }

@router.post("")
def create_submission(
    req: SubmissionCreate,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sub_id = str(uuid.uuid4())
    ref = req.reference or f"PSA-{datetime.now().year}-{str(uuid.uuid4().hex[:4]).upper()}"
    
    sub = ShipmentSubmission(
        id=sub_id,
        reference=ref,
        vessel_name=req.vessel_name,
        imo_number=req.imo_number,
        shipping_company=req.shipping_company,
        cargo_type=req.cargo_type or "Containerized General",
        container_count=req.container_count or 1,
        dangerous_goods=req.dangerous_goods or False,
        eta=req.eta or utc_now_iso(),
        stage="uploaded",
        ai_risk_score=15.0 if not req.dangerous_goods else 48.0,
        ai_verdict="verified" if not req.dangerous_goods else "needs_manual_review",
        notes=req.notes,
        created_by=user["id"],
    )
    db.add(sub)
    
    # Generate mock physical containers
    for i in range(1, min((req.container_count or 1) + 1, 6)):
        c_num = f"{req.shipping_company[:3].upper()}U{100000 + i * 41}"
        db.add(Container(
            submission_id=sub_id,
            container_number=c_num,
            iso_type="40HC" if i % 2 == 0 else "20GP",
            seal_number=f"SL-{90000 + i}",
            gross_weight_kg=24000.0,
            is_reefer=(i == 1 and "Reefer" in (req.cargo_type or "")),
            is_hazardous=req.dangerous_goods or False,
            stage="at_vessel",
        ))
        
    # Workflow event
    db.add(WorkflowEvent(
        submission_id=sub_id,
        actor_id=user["id"],
        from_stage=None,
        to_stage="uploaded",
        comment="Submission initialized by shipping line.",
    ))
    
    # Notification
    db.add(Notification(
        user_id=None,
        title=f"New Vessel Submission: {req.vessel_name}",
        body=f"Reference {ref} filed with {req.container_count} TEU. Ready for AI verification.",
        category="submission_created",
        priority="normal",
        link="/app/approvals",
    ))
    
    # Audit log
    db.add(AuditLog(
        actor_id=user["id"],
        actor_email=user["email"],
        action="data_created",
        target_type="shipment_submission",
        target_id=sub_id,
        metadata={"reference": ref, "vessel": req.vessel_name},
        success=True
    ))
    db.commit()
    return {"id": sub_id, "reference": ref, "stage": "uploaded"}

@router.patch("/{submission_id}/stage")
def advance_stage(
    submission_id: str,
    req: StageAdvanceRequest,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sub = db.query(ShipmentSubmission).filter(ShipmentSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
        
    old_stage = sub.stage
    sub.stage = req.stage
    sub.updated_at = utc_now_iso()
    
    # Cascade to containers if advancing to operational stages
    if req.stage == "terminal_scheduled":
        db.query(Container).filter(Container.submission_id == submission_id).update({"stage": "unloading", "updated_at": utc_now_iso()})
    elif req.stage == "warehouse_received":
        db.query(Container).filter(Container.submission_id == submission_id).update({"stage": "stored", "yard_block": "B2", "updated_at": utc_now_iso()})
    elif req.stage == "dispatch_ready":
        db.query(Container).filter(Container.submission_id == submission_id).update({"stage": "dispatch_ready", "updated_at": utc_now_iso()})
    elif req.stage == "in_transit":
        db.query(Container).filter(Container.submission_id == submission_id).update({"stage": "in_transit", "assigned_truck": "TRK-SG-501", "updated_at": utc_now_iso()})
    elif req.stage == "delivered":
        db.query(Container).filter(Container.submission_id == submission_id).update({"stage": "delivered", "updated_at": utc_now_iso()})
        
    # Record event
    db.add(WorkflowEvent(
        submission_id=submission_id,
        actor_id=user["id"],
        from_stage=old_stage,
        to_stage=req.stage,
        comment=req.comment or f"Advanced stage to {req.stage}",
    ))
    
    # Notification
    db.add(Notification(
        user_id=None,
        title=f"Stage Updated: {sub.vessel_name}",
        body=f"Moved from {old_stage} to {req.stage}. {req.comment or ''}",
        category="stage_advanced",
        priority="normal",
        link="/app/approvals",
    ))
    
    # Audit log
    db.add(AuditLog(
        actor_id=user["id"],
        actor_email=user["email"],
        action="data_updated",
        target_type="shipment_submission",
        target_id=submission_id,
        metadata={"from_stage": old_stage, "to_stage": req.stage, "comment": req.comment},
        success=True
    ))
    db.commit()
    return {"ok": True, "id": submission_id, "old_stage": old_stage, "new_stage": req.stage, "stage": req.stage}

@router.patch("/{submission_id}/berth")
def assign_berth(
    submission_id: str,
    req: BerthAssignRequest,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sub = db.query(ShipmentSubmission).filter(ShipmentSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
        
    sub.berth_code = req.berth_code
    sub.stage = "berth_assigned"
    sub.updated_at = utc_now_iso()
    
    # Update berth status
    berth = db.query(Berth).filter(Berth.code == req.berth_code).first()
    if berth:
        berth.status = "occupied"
        
    db.add(WorkflowEvent(
        submission_id=submission_id,
        actor_id=user["id"],
        from_stage=sub.stage,
        to_stage="berth_assigned",
        comment=f"Allocated to Berth {req.berth_code}",
    ))
    
    db.add(Notification(
        user_id=None,
        title=f"Berth Allocated: {sub.vessel_name}",
        body=f"Assigned to {req.berth_code}. Ready for terminal stevedoring schedule.",
        category="berth_assigned",
        priority="high",
        link="/app/terminal",
    ))
    
    db.add(AuditLog(
        actor_id=user["id"],
        actor_email=user["email"],
        action="data_updated",
        target_type="shipment_submission",
        target_id=submission_id,
        metadata={"berth_code": req.berth_code},
        success=True
    ))
    db.commit()
    return {"ok": True, "id": submission_id, "berth_code": req.berth_code, "stage": "berth_assigned"}

@router.delete("/{submission_id}")
def delete_submission(
    submission_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sub = db.query(ShipmentSubmission).filter(ShipmentSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
        
    db.delete(sub)
    db.add(AuditLog(
        actor_id=user["id"],
        actor_email=user["email"],
        action="data_deleted",
        target_type="shipment_submission",
        target_id=submission_id,
        metadata={"reference": sub.reference, "vessel": sub.vessel_name},
        success=True
    ))
    db.commit()
    return {"ok": True, "message": "Submission deleted"}

