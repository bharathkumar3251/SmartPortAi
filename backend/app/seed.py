import uuid
from datetime import datetime, timezone, timedelta
from app.database import Base, engine, SessionLocal
from app.models import (
    UserAccount,
    Profile,
    UserRole,
    Berth,
    ShipmentSubmission,
    SubmissionDocument,
    Container,
    AiVerification,
    Notification,
    WorkflowEvent,
    AuditLog,
)
from app.auth_utils import hash_password

def utc_now_iso(offset_minutes: int = 0) -> str:
    return (datetime.now(timezone.utc) + timedelta(minutes=offset_minutes)).isoformat()

def seed_database(seed_demo: bool = False):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Berths (Physical Singapore Port Infrastructure)
        if db.query(Berth).count() == 0:
            berths_data = [
                # Pasir Panjang Terminal (PPT)
                {"code": "PPT-01", "terminal_name": "Pasir Panjang Terminal", "length_m": 420.0, "max_draft_m": 18.0, "status": "available"},
                {"code": "PPT-02", "terminal_name": "Pasir Panjang Terminal", "length_m": 400.0, "max_draft_m": 18.0, "status": "available"},
                {"code": "PPT-03", "terminal_name": "Pasir Panjang Terminal", "length_m": 450.0, "max_draft_m": 18.5, "status": "available"},
                {"code": "PPT-04", "terminal_name": "Pasir Panjang Terminal", "length_m": 380.0, "max_draft_m": 16.5, "status": "available"},
                {"code": "PPT-05", "terminal_name": "Pasir Panjang Terminal", "length_m": 420.0, "max_draft_m": 18.0, "status": "available"},
                {"code": "PPT-06", "terminal_name": "Pasir Panjang Terminal", "length_m": 360.0, "max_draft_m": 16.0, "status": "available"},
                {"code": "PPT-07", "terminal_name": "Pasir Panjang Terminal", "length_m": 400.0, "max_draft_m": 17.5, "status": "available"},
                {"code": "PPT-08", "terminal_name": "Pasir Panjang Terminal", "length_m": 450.0, "max_draft_m": 18.5, "status": "available"},
                {"code": "PPT-09", "terminal_name": "Pasir Panjang Terminal", "length_m": 420.0, "max_draft_m": 18.0, "status": "available"},
                {"code": "PPT-10", "terminal_name": "Pasir Panjang Terminal", "length_m": 380.0, "max_draft_m": 16.5, "status": "available"},
                # Tanjong Pagar Terminal (TPT)
                {"code": "TPT-01", "terminal_name": "Tanjong Pagar Terminal", "length_m": 350.0, "max_draft_m": 14.5, "status": "available"},
                {"code": "TPT-02", "terminal_name": "Tanjong Pagar Terminal", "length_m": 350.0, "max_draft_m": 14.5, "status": "available"},
                {"code": "TPT-03", "terminal_name": "Tanjong Pagar Terminal", "length_m": 320.0, "max_draft_m": 14.0, "status": "available"},
                {"code": "TPT-04", "terminal_name": "Tanjong Pagar Terminal", "length_m": 340.0, "max_draft_m": 14.5, "status": "available"},
                {"code": "TPT-05", "terminal_name": "Tanjong Pagar Terminal", "length_m": 300.0, "max_draft_m": 13.5, "status": "available"},
                {"code": "TPT-06", "terminal_name": "Tanjong Pagar Terminal", "length_m": 360.0, "max_draft_m": 14.5, "status": "available"},
                # Keppel Terminal (KEP)
                {"code": "KEP-01", "terminal_name": "Keppel Terminal", "length_m": 320.0, "max_draft_m": 14.0, "status": "available"},
                {"code": "KEP-02", "terminal_name": "Keppel Terminal", "length_m": 340.0, "max_draft_m": 14.5, "status": "available"},
                {"code": "KEP-03", "terminal_name": "Keppel Terminal", "length_m": 320.0, "max_draft_m": 14.0, "status": "available"},
                {"code": "KEP-04", "terminal_name": "Keppel Terminal", "length_m": 360.0, "max_draft_m": 15.0, "status": "available"},
                # Jurong Port (JUR)
                {"code": "JUR-01", "terminal_name": "Jurong Port", "length_m": 300.0, "max_draft_m": 13.0, "status": "available"},
                {"code": "JUR-02", "terminal_name": "Jurong Port", "length_m": 280.0, "max_draft_m": 12.5, "status": "available"},
                {"code": "JUR-03", "terminal_name": "Jurong Port", "length_m": 320.0, "max_draft_m": 13.5, "status": "available"},
                {"code": "JUR-04", "terminal_name": "Jurong Port", "length_m": 300.0, "max_draft_m": 13.0, "status": "available"},
                {"code": "JUR-05", "terminal_name": "Jurong Port", "length_m": 350.0, "max_draft_m": 14.0, "status": "available"},
            ]
            for b in berths_data:
                db.add(Berth(**b))
            db.commit()

        # 2. Seed Users across all 10 Roles
        users_seed = [
            {
                "email": "admin@smartport.ai",
                "password": "Admin@123",
                "first_name": "Chief",
                "last_name": "Administrator",
                "org": "SmartPort Global Authority",
                "role": "super_admin",
            },
            {
                "email": "port.authority@smartport.ai",
                "password": "Admin@123",
                "first_name": "Harbor",
                "last_name": "Master",
                "org": "PSA Marine Operations",
                "role": "port_authority",
            },
            {
                "email": "terminal.operator@smartport.ai",
                "password": "Admin@123",
                "first_name": "Marcus",
                "last_name": "Vance",
                "org": "PSA Pasir Panjang Terminal",
                "role": "terminal_operator",
            },
            {
                "email": "shipping.company@smartport.ai",
                "password": "Admin@123",
                "first_name": "Elena",
                "last_name": "Rostova",
                "org": "Ocean Network Express (ONE)",
                "role": "shipping_company",
            },
            {
                "email": "customs.officer@smartport.ai",
                "password": "Admin@123",
                "first_name": "David",
                "last_name": "Tan",
                "org": "Singapore Customs Clearance Bureau",
                "role": "customs_officer",
            },
            {
                "email": "warehouse.manager@smartport.ai",
                "password": "Admin@123",
                "first_name": "Siti",
                "last_name": "Nurhaliza",
                "org": "Keppel Logistics Hub CFS",
                "role": "warehouse_manager",
            },
            {
                "email": "truck.operator@smartport.ai",
                "password": "Admin@123",
                "first_name": "Ravi",
                "last_name": "Kumar",
                "org": "Jurong Express Haulage",
                "role": "truck_operator",
            },
            {
                "email": "logistics.manager@smartport.ai",
                "password": "Admin@123",
                "first_name": "Sarah",
                "last_name": "Jenkins",
                "org": "Intermodal Freight Singapore",
                "role": "logistics_manager",
            },
            {
                "email": "ai.admin@smartport.ai",
                "password": "Admin@123",
                "first_name": "Dr. Kenji",
                "last_name": "Sato",
                "org": "SmartPort AI Lab",
                "role": "ai_administrator",
            },
            {
                "email": "data.analyst@smartport.ai",
                "password": "Admin@123",
                "first_name": "Chloe",
                "last_name": "Dupont",
                "org": "Maritime Economic Intelligence",
                "role": "data_analyst",
            },
        ]

        admin_user_id = None
        for u in users_seed:
            existing = db.query(UserAccount).filter(UserAccount.email == u["email"]).first()
            if not existing:
                uid = str(uuid.uuid4())
                if u["role"] == "super_admin":
                    admin_user_id = uid
                pw_hash = hash_password(u["password"])
                account = UserAccount(id=uid, email=u["email"], password_hash=pw_hash)
                profile = Profile(
                    id=uid,
                    email=u["email"],
                    first_name=u["first_name"],
                    last_name=u["last_name"],
                    organization=u["org"],
                    status="active",
                    requested_role=None,
                )
                role = UserRole(user_id=uid, role=u["role"], granted_by=uid)
                db.add(account)
                db.add(profile)
                db.add(role)
            else:
                if u["role"] == "super_admin":
                    admin_user_id = existing.id
        db.commit()

        # 3. Seed Realistic Shipments & Containers (Only if explicitly requested)
        if seed_demo and db.query(ShipmentSubmission).count() == 0:
            shipments_data = [
                {
                    "reference": "PSA-2026-0891",
                    "vessel_name": "EVER GIVEN",
                    "imo_number": "9811000",
                    "shipping_company": "Evergreen Marine Corp",
                    "cargo_type": "Electronics & Consumer Goods",
                    "container_count": 840,
                    "dangerous_goods": False,
                    "eta": utc_now_iso(180),
                    "stage": "berth_assigned",
                    "ai_risk_score": 14.5,
                    "ai_verdict": "verified",
                    "berth_code": "TPT-01",
                    "notes": "Vessel on schedule. Priority handling for pharmaceutical sub-containers.",
                },
                {
                    "reference": "PSA-2026-0892",
                    "vessel_name": "CMA CGM ANTOINE DE SAINT EXUPERY",
                    "imo_number": "9776418",
                    "shipping_company": "CMA CGM Group",
                    "cargo_type": "Automotive Components",
                    "container_count": 1250,
                    "dangerous_goods": False,
                    "eta": utc_now_iso(360),
                    "stage": "authority_review",
                    "ai_risk_score": 18.0,
                    "ai_verdict": "verified",
                    "berth_code": None,
                    "notes": "Awaiting final harbor master clearance.",
                },
                {
                    "reference": "PSA-2026-0893",
                    "vessel_name": "MAERSK MC-KINNEY MOLLER",
                    "imo_number": "9619907",
                    "shipping_company": "Maersk Line",
                    "cargo_type": "Industrial Chemicals & Machinery",
                    "container_count": 920,
                    "dangerous_goods": True,
                    "eta": utc_now_iso(-120),
                    "stage": "customs_review",
                    "ai_risk_score": 52.0,
                    "ai_verdict": "needs_manual_review",
                    "berth_code": None,
                    "notes": "IMDG Class 3 flammables declared in Bay 14. Inspection team notified.",
                },
                {
                    "reference": "PSA-2026-0894",
                    "vessel_name": "MSC GULSUN",
                    "imo_number": "9839438",
                    "shipping_company": "Mediterranean Shipping Company",
                    "cargo_type": "Textiles & High-Tech Hardware",
                    "container_count": 1600,
                    "dangerous_goods": False,
                    "eta": utc_now_iso(-300),
                    "stage": "terminal_scheduled",
                    "ai_risk_score": 9.2,
                    "ai_verdict": "verified",
                    "berth_code": "PPT-01",
                    "notes": "Quay cranes STS-12 and STS-13 assigned for dual-tandem discharge.",
                },
                {
                    "reference": "PSA-2026-0895",
                    "vessel_name": "COSCO SHIPPING UNIVERSE",
                    "imo_number": "9795610",
                    "shipping_company": "COSCO Shipping Lines",
                    "cargo_type": "Heavy Machinery & Solar Panels",
                    "container_count": 1100,
                    "dangerous_goods": False,
                    "eta": utc_now_iso(-720),
                    "stage": "warehouse_received",
                    "ai_risk_score": 11.0,
                    "ai_verdict": "verified",
                    "berth_code": "PPT-03",
                    "notes": "CFS staging completed. Bulk scanning in progress.",
                },
                {
                    "reference": "PSA-2026-0896",
                    "vessel_name": "ONE APUS",
                    "imo_number": "9806079",
                    "shipping_company": "Ocean Network Express (ONE)",
                    "cargo_type": "Reefer Perishables & Seafood",
                    "container_count": 680,
                    "dangerous_goods": False,
                    "eta": utc_now_iso(-1440),
                    "stage": "in_transit",
                    "ai_risk_score": 8.0,
                    "ai_verdict": "verified",
                    "berth_code": "PPT-09",
                    "notes": "Cold chain monitored. Haulage dispatched toward regional hubs.",
                },
                {
                    "reference": "PSA-2026-0897",
                    "vessel_name": "HMM ALGECIRAS",
                    "imo_number": "9863297",
                    "shipping_company": "HMM Co., Ltd.",
                    "cargo_type": "Consumer Electronics",
                    "container_count": 1400,
                    "dangerous_goods": False,
                    "eta": utc_now_iso(-2880),
                    "stage": "delivered",
                    "ai_risk_score": 5.4,
                    "ai_verdict": "verified",
                    "berth_code": "KEP-01",
                    "notes": "All container lots cleared gate and verified at consignee destination.",
                },
                {
                    "reference": "PSA-2026-0898",
                    "vessel_name": "OOCL HONG KONG",
                    "imo_number": "9776171",
                    "shipping_company": "Orient Overseas Container Line",
                    "cargo_type": "Raw Materials & Plastic Granules",
                    "container_count": 750,
                    "dangerous_goods": False,
                    "eta": utc_now_iso(600),
                    "stage": "uploaded",
                    "ai_risk_score": 22.0,
                    "ai_verdict": "verified",
                    "berth_code": None,
                    "notes": "Fresh submission uploaded by line agent. Ready for AI validation.",
                },
                {
                    "reference": "PSA-2026-0899",
                    "vessel_name": "YANG MING WISH",
                    "imo_number": "9684641",
                    "shipping_company": "Yang Ming Marine Transport",
                    "cargo_type": "Precision Instruments & Medical Tech",
                    "container_count": 420,
                    "dangerous_goods": False,
                    "eta": utc_now_iso(-900),
                    "stage": "dispatch_ready",
                    "ai_risk_score": 7.8,
                    "ai_verdict": "verified",
                    "berth_code": "JUR-02",
                    "notes": "Truck appointments booked in TAS gate queue.",
                },
                {
                    "reference": "PSA-2026-0900",
                    "vessel_name": "EVER GOLDEN",
                    "imo_number": "9832717",
                    "shipping_company": "Evergreen Marine Corp",
                    "cargo_type": "Retail Apparel & Footwear",
                    "container_count": 980,
                    "dangerous_goods": False,
                    "eta": utc_now_iso(60),
                    "stage": "customs_cleared",
                    "ai_risk_score": 12.2,
                    "ai_verdict": "verified",
                    "berth_code": None,
                    "notes": "Customs clearance passed with zero discrepancies. Ready for berth assignment.",
                },
            ]

            doc_types = [
                "vessel_arrival_notice",
                "cargo_manifest",
                "bill_of_lading",
                "crew_list",
                "container_list",
                "insurance_certificate",
                "port_clearance",
                "eta_information",
            ]

            for s_data in shipments_data:
                sub_id = str(uuid.uuid4())
                sub = ShipmentSubmission(id=sub_id, created_by=admin_user_id, **s_data)
                db.add(sub)

                # Documents
                for dt in doc_types:
                    db.add(
                        SubmissionDocument(
                            submission_id=sub_id,
                            doc_type=dt,
                            filename=f"{s_data['reference']}_{dt}.pdf",
                            storage_path=f"documents/{sub_id}/{dt}.pdf",
                        )
                    )

                # AI Verification
                checks = {
                    "missing_documents": "passed",
                    "dangerous_goods_mismatch": "flagged" if s_data["dangerous_goods"] else "passed",
                    "duplicate_check": "passed",
                    "date_validity": "passed",
                    "imo_cross_check": "passed",
                    "ocr_consistency": "passed",
                }
                issues = []
                if s_data["dangerous_goods"]:
                    issues.append({
                        "severity": "medium",
                        "check": "Dangerous Goods Verification",
                        "detail": "IMDG Class 3 flammables detected. Berth safety perimeter must be confirmed.",
                    })
                recs = [
                    "Proceed with scheduled berth line-up.",
                    "Verify container reefer temperature log upon offloading.",
                ]

                db.add(
                    AiVerification(
                        submission_id=sub_id,
                        scope="document_cargo_compliance",
                        verdict=s_data["ai_verdict"],
                        risk_score=s_data["ai_risk_score"],
                        confidence=0.96,
                        checks=checks,
                        issues=issues,
                        recommendations=recs,
                        model="smartport-ensemble-v2.1",
                    )
                )

                # Containers (generate 3-5 containers for each submission)
                container_stages = {
                    "uploaded": "at_vessel",
                    "authority_review": "at_vessel",
                    "customs_review": "at_vessel",
                    "customs_cleared": "at_vessel",
                    "berth_assigned": "at_vessel",
                    "terminal_scheduled": "unloading",
                    "warehouse_received": "stored",
                    "dispatch_ready": "dispatch_ready",
                    "in_transit": "in_transit",
                    "delivered": "delivered",
                }
                c_stage = container_stages.get(s_data["stage"], "at_vessel")

                for i in range(1, 5):
                    c_num = f"{s_data['shipping_company'][:3].upper()}U{100000 + i * 37 + (int(s_data['imo_number']) % 1000)}"
                    db.add(
                        Container(
                            submission_id=sub_id,
                            container_number=c_num,
                            iso_type="40HC" if i % 2 == 0 else "20GP",
                            seal_number=f"SL-{88000 + i}",
                            gross_weight_kg=22000.0 + (i * 1250),
                            is_reefer=(i == 1),
                            is_hazardous=(i == 2 and s_data["dangerous_goods"]),
                            yard_block=f"B{i}" if c_stage not in ("at_vessel",) else None,
                            bay_row_tier=f"1{i}-04-02" if c_stage not in ("at_vessel",) else None,
                            assigned_truck=f"TRK-SG-{400 + i}" if c_stage in ("dispatch_ready", "in_transit", "delivered") else None,
                            destination="Tuas Inland Port" if i % 2 == 0 else "Jurong Cold Chain Center",
                            stage=c_stage,
                        )
                    )

                # Initial Workflow Event
                db.add(
                    WorkflowEvent(
                        submission_id=sub_id,
                        actor_id=admin_user_id,
                        from_stage="uploaded",
                        to_stage=s_data["stage"],
                        comment=f"Initial pipeline synchronization: {s_data['notes']}",
                    )
                )

            db.commit()

        # 4. Seed Notifications & Audit Logs
        if seed_demo and db.query(Notification).count() == 0:
            db.add(
                Notification(
                    user_id=admin_user_id,
                    title="Vessel Arrival Alert: EVER GIVEN",
                    body="Berth TPT-01 assigned. Quay cranes deployed for inbound cargo clearance.",
                    category="berth_assigned",
                    priority="high",
                    link="/app/port-authority",
                )
            )
            db.add(
                Notification(
                    user_id=admin_user_id,
                    title="Customs Inspection Required: MAERSK MC-KINNEY MOLLER",
                    body="IMDG Class 3 flammables flagged by AI document verification. Officer review required.",
                    category="customs_review",
                    priority="critical",
                    link="/app/customs",
                )
            )
            db.add(
                Notification(
                    user_id=admin_user_id,
                    title="System Initialized: SmartPort AI SQLite Persistence",
                    body="Local SQLite operational engine online with full role-based access control.",
                    category="system",
                    priority="normal",
                    link="/app/admin",
                )
            )
            db.commit()

        if db.query(AuditLog).count() == 0:
            db.add(
                AuditLog(
                    actor_id=admin_user_id,
                    actor_email="admin@smartport.ai",
                    action="system_initialized",
                    target_type="database",
                    target_id="smartport.db",
                    meta={"engine": "SQLite", "version": "3.50+", "backend": "FastAPI", "demo_data": "cleared"},
                    success=True,
                )
            )
            db.commit()

    finally:
        db.close()

if __name__ == "__main__":
    import sys
    with_demo = "--demo" in sys.argv
    seed_database(seed_demo=with_demo)
    if with_demo:
        print("Database seeded with all roles, PSA berths, vessels, and containers!")
    else:
        print("Database initialized with user accounts and berths (clean, no demo shipments).")
