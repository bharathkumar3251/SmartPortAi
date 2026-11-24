from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import WorkflowEvent
from app.auth_utils import get_current_user_optional

router = APIRouter(prefix="/workflow", tags=["Workflow Engine"])

@router.get("/events")
def list_workflow_events(
    limit: int = Query(15, ge=1, le=100),
    submission_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: Any = Depends(get_current_user_optional),
):
    query = db.query(WorkflowEvent)
    if submission_id:
        query = query.filter(WorkflowEvent.submission_id == submission_id)
        
    events = query.order_by(WorkflowEvent.created_at.desc()).limit(limit).all()
    return [
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
    ]

