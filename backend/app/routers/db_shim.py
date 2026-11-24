import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, text
from app.database import get_db
from app.models import (
    Base,
    Profile,
    UserRole,
    ShipmentSubmission,
    SubmissionDocument,
    Container,
    AiVerification,
    Berth,
    AuditLog,
    LoginHistory,
    Notification,
    WorkflowEvent,
)
from app.auth_utils import get_current_user_optional, get_current_user

router = APIRouter(tags=["Database Shim"])

TABLE_MAP = {
    "profiles": Profile,
    "user_roles": UserRole,
    "shipment_submissions": ShipmentSubmission,
    "submission_documents": SubmissionDocument,
    "containers": Container,
    "ai_verifications": AiVerification,
    "berths": Berth,
    "audit_logs": AuditLog,
    "login_history": LoginHistory,
    "notifications": Notification,
    "workflow_events": WorkflowEvent,
}

def model_to_dict(obj):
    if not obj:
        return {}
    res = {}
    for col in obj.__table__.columns:
        if col.name == "metadata":
            res["metadata"] = getattr(obj, "meta", {})
        else:
            res[col.name] = getattr(obj, col.name, None)

    # Provide automatic compatibility aliases for SubmissionDocument
    if isinstance(obj, SubmissionDocument):
        res["file_name"] = res.get("filename")
        res["file_path"] = res.get("storage_path")

    return res

@router.get("/db/{table}")
def query_table(
    table: str,
    request: Request,
    db: Session = Depends(get_db),
    user: Any = Depends(get_current_user_optional),
):
    model = TABLE_MAP.get(table)
    if not model:
        raise HTTPException(status_code=400, detail=f"Table {table} not recognized")
        
    query = db.query(model)
    params = dict(request.query_params)
    
    # Process filters
    limit = 1000
    offset = 0
    order_col = None
    order_desc = False
    
    for k, v in params.items():
        if k == "limit":
            try:
                limit = int(v)
            except ValueError:
                pass
        elif k == "offset":
            try:
                offset = int(v)
            except ValueError:
                pass
        elif k == "order":
            parts = v.split(".")
            col_name = parts[0]
            if hasattr(model, col_name):
                order_col = getattr(model, col_name)
                order_desc = len(parts) > 1 and parts[1].lower() == "desc"
        elif k == "select":
            continue
        else:
            # Column filters: e.g. eq.val, in.(val1,val2), is.null, neq.val
            if hasattr(model, k):
                attr = getattr(model, k)
                if v.startswith("eq."):
                    val = v[3:]
                    # Boolean conversions
                    if val.lower() == "true":
                        val = True
                    elif val.lower() == "false":
                        val = False
                    query = query.filter(attr == val)
                elif v.startswith("neq."):
                    val = v[4:]
                    query = query.filter(attr != val)
                elif v.startswith("is."):
                    val = v[3:].lower()
                    if val == "null":
                        query = query.filter(attr.is_(None))
                    elif val == "not.null":
                        query = query.filter(attr.isnot(None))
                elif v.startswith("in.(") and v.endswith(")"):
                    items = [x.strip().strip('"').strip("'") for x in v[4:-1].split(",") if x.strip()]
                    query = query.filter(attr.in_(items))
                else:
                    query = query.filter(attr == v)
                    
    if order_col is not None:
        query = query.order_by(desc(order_col) if order_desc else asc(order_col))
        
    records = query.offset(offset).limit(limit).all()
    return [model_to_dict(r) for r in records]

@router.post("/db/{table}")
async def insert_table(
    table: str,
    request: Request,
    db: Session = Depends(get_db),
    user: Any = Depends(get_current_user_optional),
):
    model = TABLE_MAP.get(table)
    if not model:
        raise HTTPException(status_code=400, detail=f"Table {table} not recognized")
        
    body = await request.json()
    if isinstance(body, list):
        items = body
    else:
        items = [body]
        
    created = []
    for item in items:
        # Handle field alias mapping for submission_documents
        if table == "submission_documents":
            if "file_name" in item and "filename" not in item:
                item["filename"] = item["file_name"]
            if "file_path" in item and "storage_path" not in item:
                item["storage_path"] = item["file_path"]
            if "filename" not in item or not item["filename"]:
                item["filename"] = f"{item.get('doc_type', 'document')}.pdf"
            if "id" not in item:
                item["id"] = str(uuid.uuid4())
            if "uploaded_at" not in item:
                item["uploaded_at"] = datetime.now(timezone.utc).isoformat()

            # Check if this document already exists to avoid unique/duplicate constraint errors
            sub_id = item.get("submission_id")
            d_type = item.get("doc_type")
            if sub_id and d_type:
                existing = db.query(SubmissionDocument).filter(
                    SubmissionDocument.submission_id == sub_id,
                    SubmissionDocument.doc_type == d_type
                ).first()
                if existing:
                    existing.filename = item.get("filename", existing.filename)
                    existing.storage_path = item.get("storage_path", existing.storage_path)
                    existing.uploaded_at = item.get("uploaded_at", existing.uploaded_at)
                    created.append(existing)
                    continue

        # Handle field alias mapping for workflow_events
        if table == "workflow_events":
            if "stage" in item and "to_stage" not in item:
                item["to_stage"] = item["stage"]
            if "to_stage" not in item or not item["to_stage"]:
                item["to_stage"] = "ai_verification"
            if "comment" not in item:
                parts = [str(item.get("action", "")), str(item.get("notes", ""))]
                item["comment"] = " · ".join([p for p in parts if p]).strip() or "Workflow event"
            if "id" not in item:
                item["id"] = str(uuid.uuid4())
            if "created_at" not in item:
                item["created_at"] = datetime.now(timezone.utc).isoformat()

        # Handle field alias mapping for ai_verifications
        if table == "ai_verifications":
            if "id" not in item:
                item["id"] = str(uuid.uuid4())
            if "created_at" not in item:
                item["created_at"] = datetime.now(timezone.utc).isoformat()
            if "scope" not in item:
                item["scope"] = "documents"
            if "verdict" not in item:
                item["verdict"] = "verified"
            if "risk_score" not in item:
                item["risk_score"] = 15.0
            if "confidence" not in item:
                item["confidence"] = 0.95

        # Filter out unknown keys
        valid_keys = {c.name for c in model.__table__.columns}
        filtered = {k: v for k, v in item.items() if k in valid_keys}
        obj = model(**filtered)
        db.add(obj)
        created.append(obj)
        
    db.commit()
    for obj in created:
        db.refresh(obj)
    return [model_to_dict(obj) for obj in created]

@router.patch("/db/{table}")
async def update_table(
    table: str,
    request: Request,
    db: Session = Depends(get_db),
    user: Any = Depends(get_current_user_optional),
):
    model = TABLE_MAP.get(table)
    if not model:
        raise HTTPException(status_code=400, detail=f"Table {table} not recognized")
        
    params = dict(request.query_params)
    query = db.query(model)
    
    for k, v in params.items():
        if hasattr(model, k):
            attr = getattr(model, k)
            if v.startswith("eq."):
                query = query.filter(attr == v[3:])
            elif v.startswith("in.(") and v.endswith(")"):
                items = [x.strip() for x in v[4:-1].split(",")]
                query = query.filter(attr.in_(items))
            else:
                query = query.filter(attr == v)
                
    body = await request.json()
    valid_keys = {c.name for c in model.__table__.columns}
    filtered = {k: v for k, v in body.items() if k in valid_keys}
    
    query.update(filtered, synchronize_session=False)
    db.commit()
    return {"ok": True}

@router.delete("/db/{table}")
def delete_table(
    table: str,
    request: Request,
    db: Session = Depends(get_db),
    user: Any = Depends(get_current_user_optional),
):
    model = TABLE_MAP.get(table)
    if not model:
        raise HTTPException(status_code=400, detail=f"Table {table} not recognized")
        
    params = dict(request.query_params)
    query = db.query(model)
    
    for k, v in params.items():
        if hasattr(model, k):
            attr = getattr(model, k)
            if v.startswith("eq."):
                query = query.filter(attr == v[3:])
            elif v.startswith("in.(") and v.endswith(")"):
                items = [x.strip() for x in v[4:-1].split(",")]
                query = query.filter(attr.in_(items))
            else:
                query = query.filter(attr == v)
                
    count = query.delete(synchronize_session=False)
    db.commit()
    return {"ok": True, "deleted": count}

# RPC emulation endpoint
@router.post("/rpc/{rpc_name}")
async def handle_rpc(
    rpc_name: str,
    request: Request,
    db: Session = Depends(get_db),
    user: Any = Depends(get_current_user_optional),
):
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass
        
    if rpc_name == "get_dashboard_summary":
        from app.routers.analytics import get_dashboard_summary
        return get_dashboard_summary(db)
        
    elif rpc_name == "claim_super_admin":
        if not user:
            raise HTTPException(status_code=401, detail="Authentication required")
        from app.routers.auth import claim_super_admin
        return claim_super_admin(user, db)
        
    elif rpc_name == "ensure_system_admin":
        from app.routers.auth import ensure_system_admin
        return ensure_system_admin(db)
        
    elif rpc_name == "approve_role_request":
        user_id = body.get("_user_id") or body.get("user_id")
        role = body.get("_role") or body.get("role")
        from app.routers.users import approve_role
        from app.schemas import RoleActionRequest
        return approve_role(user_id, RoleActionRequest(role=role), user or {"id": "system", "email": "admin@smartport.ai", "roles": ["super_admin"]}, db)
        
    elif rpc_name == "reject_role_request":
        user_id = body.get("_user_id") or body.get("user_id")
        from app.routers.users import reject_role
        return reject_role(user_id, user or {"id": "system", "email": "admin@smartport.ai", "roles": ["super_admin"]}, db)
        
    elif rpc_name == "grant_role":
        user_id = body.get("_user_id") or body.get("user_id")
        role = body.get("_role") or body.get("role")
        from app.routers.users import grant_role
        from app.schemas import RoleActionRequest
        return grant_role(user_id, RoleActionRequest(role=role), user or {"id": "system", "email": "admin@smartport.ai", "roles": ["super_admin"]}, db)
        
    elif rpc_name == "revoke_role":
        user_id = body.get("_user_id") or body.get("user_id")
        role = body.get("_role") or body.get("role")
        from app.routers.users import revoke_role
        from app.schemas import RoleActionRequest
        return revoke_role(user_id, RoleActionRequest(role=role), user or {"id": "system", "email": "admin@smartport.ai", "roles": ["super_admin"]}, db)
        
    elif rpc_name == "set_account_status":
        user_id = body.get("_user_id") or body.get("user_id")
        status_val = body.get("_status") or body.get("status")
        from app.routers.users import set_status
        from app.schemas import StatusUpdateRequest
        return set_status(user_id, StatusUpdateRequest(status=status_val), user or {"id": "system", "email": "admin@smartport.ai", "roles": ["super_admin"]}, db)
        
    return {"ok": True}
