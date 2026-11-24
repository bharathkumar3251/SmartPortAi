from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import ShipmentSubmission, Container, Berth
from app.schemas import DashboardSummaryResponse

router = APIRouter(prefix="/analytics", tags=["Analytics & Reporting"])

@router.get("/dashboard-summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_sub = db.query(ShipmentSubmission).count()
    auth_rev = db.query(ShipmentSubmission).filter(ShipmentSubmission.stage == "authority_review").count()
    customs_rev = db.query(ShipmentSubmission).filter(ShipmentSubmission.stage.in_(["customs_review", "customs_hold"])).count()
    active_ops = db.query(ShipmentSubmission).filter(ShipmentSubmission.stage.in_(["berth_assigned", "terminal_scheduled", "unloading"])).count()
    wh_recv = db.query(ShipmentSubmission).filter(ShipmentSubmission.stage == "warehouse_received").count()
    dispatch_rdy = db.query(ShipmentSubmission).filter(ShipmentSubmission.stage == "dispatch_ready").count()
    in_trans = db.query(ShipmentSubmission).filter(ShipmentSubmission.stage == "in_transit").count()
    dlvd = db.query(ShipmentSubmission).filter(ShipmentSubmission.stage == "delivered").count()
    
    total_cnt = db.query(Container).count()
    active_cnt = db.query(Container).filter(Container.stage != "delivered").count()
    
    active_berths = (
        db.query(func.count(func.distinct(ShipmentSubmission.berth_code)))
        .filter(
            ShipmentSubmission.berth_code.isnot(None),
            ShipmentSubmission.stage.notin_(["delivered", "authority_rejected", "customs_rejected"])
        )
        .scalar() or 0
    )
    
    # Stage breakdown
    stage_rows = db.query(ShipmentSubmission.stage, func.count(ShipmentSubmission.id)).group_by(ShipmentSubmission.stage).all()
    stages_breakdown = {s[0]: s[1] for s in stage_rows}

    return {
        "total_submissions": total_sub,
        "authority_review": auth_rev,
        "customs_review": customs_rev,
        "active_operations": active_ops,
        "warehouse_received": wh_recv,
        "dispatch_ready": dispatch_rdy,
        "in_transit": in_trans,
        "delivered": dlvd,
        "total_containers": total_cnt,
        "active_containers": active_cnt,
        "active_berths": int(active_berths),
        "active_vessels": total_sub,
        "berth_utilization_pct": round((int(active_berths) / 25.0) * 100.0, 1),
        "containers_in_yard": active_cnt,
        "avg_clearance_hours": 3.8,
        "stages_breakdown": stages_breakdown,
    }

