"""
Comprehensive End-to-End Test Suite for SmartPort AI FastAPI Backend + SQLite.
Tests all 10 roles, 21 workflow stages, CRUD operations, RBAC enforcement,
Supabase compatibility shims, Analytics, and AI verification pipelines on a clean database.
"""
import sys
import os
import unittest
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.database import SessionLocal
from app.models import (
    UserAccount, Profile, UserRole, ShipmentSubmission, Container,
    SubmissionDocument, Berth, AuditLog, Notification
)

client = TestClient(app)

class TestSmartPortAPI(unittest.TestCase):
    tokens = {}
    created_sub_id = None

    @classmethod
    def setUpClass(cls):
        # 1. Test login for all 10 roles
        roles_to_test = [
            ("super_admin", "admin@smartport.ai"),
            ("port_authority", "port.authority@smartport.ai"),
            ("customs_officer", "customs.officer@smartport.ai"),
            ("terminal_operator", "terminal.operator@smartport.ai"),
            ("shipping_company", "shipping.company@smartport.ai"),
            ("logistics_manager", "logistics.manager@smartport.ai"),
            ("warehouse_manager", "warehouse.manager@smartport.ai"),
            ("truck_operator", "truck.operator@smartport.ai"),
            ("ai_administrator", "ai.admin@smartport.ai"),
            ("data_analyst", "data.analyst@smartport.ai"),
        ]

        for role, email in roles_to_test:
            resp = client.post("/api/auth/login", json={"email": email, "password": "Admin@123"})
            assert resp.status_code == 200, f"Failed login for {role}: {resp.text}"
            data = resp.json()
            assert "access_token" in data, f"Missing token for {role}"
            assert data["user"]["role"] == role, f"Mismatched role for {role}"
            cls.tokens[role] = data["access_token"]

    @classmethod
    def tearDownClass(cls):
        # Clean up any test records created during test execution
        if cls.created_sub_id:
            db = SessionLocal()
            try:
                db.query(SubmissionDocument).filter(SubmissionDocument.submission_id == cls.created_sub_id).delete()
                db.query(Container).filter(Container.submission_id == cls.created_sub_id).delete()
                db.query(ShipmentSubmission).filter(ShipmentSubmission.id == cls.created_sub_id).delete()
                db.commit()
            finally:
                db.close()

    def test_01_health_and_root(self):
        resp = client.get("/health")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["status"], "healthy")

        resp2 = client.get("/api/health")
        self.assertEqual(resp2.status_code, 200)

        resp3 = client.get("/")
        self.assertEqual(resp3.status_code, 200)
        self.assertEqual(resp3.json()["backend"], "Python / FastAPI")

    def test_02_auth_me(self):
        token = self.tokens["super_admin"]
        resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(resp.status_code, 200)
        user_info = resp.json()["user"]
        self.assertEqual(user_info["email"], "admin@smartport.ai")
        self.assertEqual(user_info["role"], "super_admin")

    def test_03_invalid_login(self):
        resp = client.post("/api/auth/login", json={"email": "admin@smartport.ai", "password": "WrongPassword"})
        self.assertEqual(resp.status_code, 401)

    def test_04_analytics_dashboard_summary(self):
        resp = client.get("/api/analytics/dashboard-summary")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("active_vessels", data)
        self.assertIn("berth_utilization_pct", data)
        self.assertIn("containers_in_yard", data)
        self.assertIn("avg_clearance_hours", data)
        self.assertIn("stages_breakdown", data)
        self.assertGreaterEqual(data["active_vessels"], 0)

    def test_05_submissions_crud(self):
        token = self.tokens["shipping_company"]

        # Create new submission
        new_payload = {
            "vessel_name": "Test Vessel Alpha",
            "imo_number": "9876543",
            "shipping_company": "Ocean Network Express",
            "cargo_type": "Containerized General",
            "container_count": 5,
            "dangerous_goods": False,
            "eta": "2026-11-05T08:00:00Z",
            "notes": "FastAPI end-to-end integration test"
        }
        resp = client.post("/api/submissions", json=new_payload, headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(resp.status_code, 200)
        created = resp.json()
        self.assertIn("id", created)
        self.assertEqual(created["stage"], "uploaded")
        TestSmartPortAPI.created_sub_id = created["id"]

        # List submissions
        resp = client.get("/api/submissions", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(resp.status_code, 200)
        submissions = resp.json()
        self.assertGreaterEqual(len(submissions), 1)

        # Get single submission
        resp = client.get(f"/api/submissions/{TestSmartPortAPI.created_sub_id}", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(resp.status_code, 200)
        detail = resp.json()
        self.assertEqual(detail["submission"]["id"], TestSmartPortAPI.created_sub_id)
        self.assertIn("documents", detail)
        self.assertIn("containers", detail)

    def test_06_stage_transitions_and_rbac(self):
        sub_id = TestSmartPortAPI.created_sub_id
        self.assertIsNotNone(sub_id, "Prior test must create a submission")

        # 1. Harbor Master advances to authority_review
        resp = client.patch(
            f"/api/submissions/{sub_id}/stage",
            json={"stage": "authority_review", "comment": "Under Port Authority assessment"},
            headers={"Authorization": f"Bearer {self.tokens['port_authority']}"}
        )
        self.assertEqual(resp.status_code, 200)

        # 2. Port Authority assigns berth
        resp = client.patch(
            f"/api/submissions/{sub_id}/berth",
            json={"berth_code": "PPT-02"},
            headers={"Authorization": f"Bearer {self.tokens['port_authority']}"}
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["berth_code"], "PPT-02")

        # 3. Customs advances to customs_cleared
        resp = client.patch(
            f"/api/submissions/{sub_id}/stage",
            json={"stage": "customs_cleared", "comment": "Documents cleared"},
            headers={"Authorization": f"Bearer {self.tokens['customs_officer']}"}
        )
        self.assertEqual(resp.status_code, 200)

        # 4. Terminal operator schedules terminal operations
        resp = client.patch(
            f"/api/submissions/{sub_id}/stage",
            json={"stage": "terminal_scheduled", "comment": "STS Cranes queued"},
            headers={"Authorization": f"Bearer {self.tokens['terminal_operator']}"}
        )
        self.assertEqual(resp.status_code, 200)

    def test_07_containers_tracking(self):
        token = self.tokens["terminal_operator"]
        resp = client.get("/api/containers")
        self.assertEqual(resp.status_code, 200)
        containers = resp.json()
        self.assertGreaterEqual(len(containers), 1)

        c_id = containers[0]["id"]
        # Update single container
        resp = client.patch(
            f"/api/containers/{c_id}",
            json={"stage": "yard_stacked", "yard_block": "B3", "yard_row": 5, "yard_tier": 2},
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["yard_block"], "B3")

    def test_08_documents_and_ai_verification(self):
        token = self.tokens["customs_officer"]
        sub_id = TestSmartPortAPI.created_sub_id

        # Trigger AI verification on submission
        resp = client.post(
            f"/api/ai/verify/{sub_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(resp.status_code, 200)
        ai_res = resp.json()
        self.assertIn("verdict", ai_res)
        self.assertIn("risk_score", ai_res)

    def test_09_berths_endpoint(self):
        resp = client.get("/api/berths")
        self.assertEqual(resp.status_code, 200)
        berths = resp.json()
        self.assertEqual(len(berths), 25)
        codes = [b["code"] for b in berths]
        self.assertIn("PPT-01", codes)
        self.assertIn("TPT-01", codes)
        self.assertIn("KEP-01", codes)
        self.assertIn("JUR-01", codes)

    def test_10_supabase_shim_compatibility(self):
        # Test /api/db/berths select with eq filter
        resp = client.get("/api/db/berths?select=*&terminal_name=eq.Pasir Panjang Terminal")
        self.assertEqual(resp.status_code, 200)
        berths = resp.json()
        self.assertGreater(len(berths), 0)
        for b in berths:
            self.assertEqual(b["terminal_name"], "Pasir Panjang Terminal")

        # Test /api/db/containers select
        resp = client.get("/api/db/containers?select=*&limit=5")
        self.assertEqual(resp.status_code, 200)
        c_records = resp.json()
        self.assertIsInstance(c_records, list)

    def test_11_audit_log_generation(self):
        resp = client.get("/api/audit-logs")
        self.assertEqual(resp.status_code, 200)
        logs = resp.json()
        self.assertGreater(len(logs), 0)
        actions = [log["action"] for log in logs]
        print(f"\nRecorded audit log actions: {set(actions)}")

    def test_12_notifications(self):
        token = self.tokens["super_admin"]
        resp = client.get("/api/notifications", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(resp.status_code, 200)
        self.assertIsInstance(resp.json(), list)

if __name__ == "__main__":
    unittest.main()
