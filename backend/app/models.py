import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship
from app.database import Base

def gen_uuid() -> str:
    return str(uuid.uuid4())

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

class UserAccount(Base):
    __tablename__ = "auth_users"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(String(64), default=utc_now_iso)

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True)  # Matches auth_users.id
    email = Column(String(255), unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    organization = Column(String(200), nullable=True)
    status = Column(String(30), default="active", nullable=False)  # pending | active | disabled
    requested_role = Column(String(50), nullable=True)
    created_at = Column(String(64), default=utc_now_iso)
    updated_at = Column(String(64), default=utc_now_iso)

    roles = relationship("UserRole", back_populates="profile", cascade="all, delete-orphan")

class UserRole(Base):
    __tablename__ = "user_roles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    role = Column(String(50), index=True, nullable=False)
    granted_by = Column(String(36), nullable=True)
    created_at = Column(String(64), default=utc_now_iso)

    profile = relationship("Profile", back_populates="roles")

class ShipmentSubmission(Base):
    __tablename__ = "shipment_submissions"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    reference = Column(String(50), unique=True, index=True, nullable=False)
    vessel_name = Column(String(200), index=True, nullable=False)
    imo_number = Column(String(20), nullable=True)
    shipping_company = Column(String(200), index=True, nullable=False)
    cargo_type = Column(String(100), default="Containerized General", nullable=False)
    container_count = Column(Integer, default=1, nullable=False)
    dangerous_goods = Column(Boolean, default=False, nullable=False)
    eta = Column(String(64), nullable=True)
    stage = Column(String(50), index=True, default="uploaded", nullable=False)
    ai_risk_score = Column(Float, nullable=True)
    ai_verdict = Column(String(50), nullable=True)  # verified | needs_manual_review | rejected
    berth_code = Column(String(30), nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(String(36), nullable=True)
    created_at = Column(String(64), default=utc_now_iso)
    updated_at = Column(String(64), default=utc_now_iso)

    documents = relationship("SubmissionDocument", back_populates="submission", cascade="all, delete-orphan")
    containers = relationship("Container", back_populates="submission", cascade="all, delete-orphan")
    verifications = relationship("AiVerification", back_populates="submission", cascade="all, delete-orphan")
    events = relationship("WorkflowEvent", back_populates="submission", cascade="all, delete-orphan")

class SubmissionDocument(Base):
    __tablename__ = "submission_documents"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    submission_id = Column(String(36), ForeignKey("shipment_submissions.id", ondelete="CASCADE"), index=True, nullable=False)
    doc_type = Column(String(100), nullable=False)
    filename = Column(String(255), nullable=False)
    storage_path = Column(String(500), nullable=True)
    uploaded_at = Column(String(64), default=utc_now_iso)

    submission = relationship("ShipmentSubmission", back_populates="documents")

class Container(Base):
    __tablename__ = "containers"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    submission_id = Column(String(36), ForeignKey("shipment_submissions.id", ondelete="CASCADE"), index=True, nullable=False)
    container_number = Column(String(50), index=True, nullable=False)
    iso_type = Column(String(20), default="40HC", nullable=False)
    seal_number = Column(String(50), nullable=True)
    gross_weight_kg = Column(Float, default=24000.0, nullable=False)
    is_reefer = Column(Boolean, default=False, nullable=False)
    is_hazardous = Column(Boolean, default=False, nullable=False)
    yard_block = Column(String(20), nullable=True)
    bay_row_tier = Column(String(20), nullable=True)
    assigned_truck = Column(String(50), nullable=True)
    destination = Column(String(200), nullable=True)
    stage = Column(String(50), index=True, default="at_vessel", nullable=False)
    created_at = Column(String(64), default=utc_now_iso)
    updated_at = Column(String(64), default=utc_now_iso)

    submission = relationship("ShipmentSubmission", back_populates="containers")

class AiVerification(Base):
    __tablename__ = "ai_verifications"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    submission_id = Column(String(36), ForeignKey("shipment_submissions.id", ondelete="CASCADE"), index=True, nullable=False)
    scope = Column(String(50), default="document_cargo_compliance", nullable=False)
    verdict = Column(String(50), default="verified", nullable=False)
    risk_score = Column(Float, default=12.0, nullable=False)
    confidence = Column(Float, default=0.96, nullable=False)
    checks = Column(JSON, default=dict)
    issues = Column(JSON, default=list)
    recommendations = Column(JSON, default=list)
    model = Column(String(100), default="smartport-ensemble-v2.1", nullable=True)
    created_at = Column(String(64), default=utc_now_iso)

    submission = relationship("ShipmentSubmission", back_populates="verifications")

class Berth(Base):
    __tablename__ = "berths"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    code = Column(String(30), unique=True, index=True, nullable=False)
    terminal_name = Column(String(100), index=True, nullable=False)
    length_m = Column(Float, default=350.0, nullable=False)
    max_draft_m = Column(Float, default=16.0, nullable=False)
    status = Column(String(30), default="available", nullable=False)
    created_at = Column(String(64), default=utc_now_iso)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    actor_id = Column(String(36), nullable=True)
    actor_email = Column(String(255), nullable=True)
    action = Column(String(100), index=True, nullable=False)
    target_type = Column(String(100), nullable=True)
    target_id = Column(String(100), nullable=True)
    meta = Column("metadata", JSON, default=dict)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(300), nullable=True)
    success = Column(Boolean, default=True, nullable=False)
    created_at = Column(String(64), default=utc_now_iso)

    def __init__(self, **kwargs):
        if "metadata" in kwargs:
            kwargs["meta"] = kwargs.pop("metadata")
        super().__init__(**kwargs)

class LoginHistory(Base):
    __tablename__ = "login_history"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), nullable=True)
    email = Column(String(255), nullable=False)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(300), nullable=True)
    success = Column(Boolean, default=True, nullable=False)
    failure_reason = Column(String(255), nullable=True)
    created_at = Column(String(64), default=utc_now_iso)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=True)
    category = Column(String(100), default="workflow", nullable=False)
    priority = Column(String(30), default="normal", nullable=False)
    link = Column(String(255), nullable=True)
    read = Column(Boolean, default=False, nullable=False)
    read_at = Column(String(64), nullable=True)
    archived_at = Column(String(64), nullable=True)
    created_at = Column(String(64), default=utc_now_iso)

class WorkflowEvent(Base):
    __tablename__ = "workflow_events"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    submission_id = Column(String(36), ForeignKey("shipment_submissions.id", ondelete="CASCADE"), index=True, nullable=False)
    actor_id = Column(String(36), nullable=True)
    from_stage = Column(String(50), nullable=True)
    to_stage = Column(String(50), nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(String(64), default=utc_now_iso)

    submission = relationship("ShipmentSubmission", back_populates="events")
