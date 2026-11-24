# SmartPort AI — Python FastAPI Backend

Enterprise Port Congestion Prediction & Logistics Intelligence Platform Backend.
Powered by **Python 3.10+**, **FastAPI**, **SQLAlchemy**, and **SQLite**.

---

## 1. Quick Start

### Prerequisites
- Python 3.10+ (tested on Python 3.13)
- Dependencies installed from `requirements.txt`

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Run Server
```bash
python run_backend.py
```
Or with uvicorn directly:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

* **API Server:** http://localhost:8000
* **Interactive Swagger UI:** http://localhost:8000/docs
* **Alternative ReDoc UI:** http://localhost:8000/redoc

---

## 2. SQLite Database Architecture

* **Database File:** `backend/data/smartport.db` (also mirrored at `database/smartport.db`)
* **Tables:**
  - `auth_users`: User credentials with PBKDF2-SHA256 salted password hashing
  - `profiles`: User profile data and account approval statuses (`pending`, `active`, `disabled`)
  - `user_roles`: 10 RBAC roles (`super_admin`, `port_authority`, `terminal_operator`, `shipping_company`, `customs_officer`, `warehouse_manager`, `truck_operator`, `logistics_manager`, `ai_administrator`, `data_analyst`)
  - `shipment_submissions`: 21-stage vessel arrival and cargo clearance records
  - `submission_documents`: Uploaded maritime documentation
  - `containers`: Physical TEU container records, yard block assignments, truck numbers
  - `ai_verifications`: Automated compliance checks, risk scores, and recommendations
  - `berths`: PSA Singapore berths (Pasir Panjang, Tanjong Pagar, Keppel, Jurong)
  - `audit_logs`: Tamper-evident compliance audit trail
  - `login_history`: Security and authentication audit logs
  - `notifications`: Real-time operational alert dispatch feed
  - `workflow_events`: Complete timeline of shipment stage advancements

---

## 3. Pre-Seeded Demonstration Accounts (All Passwords: see below)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@smartport.ai` | `Admin@123` |
| **Port Authority** | `port.authority@smartport.ai` | `Port@123` |
| **Terminal Operator** | `terminal.operator@smartport.ai` | `Terminal@123` |
| **Shipping Company** | `shipping.company@smartport.ai` | `Ship@123` |
| **Customs Officer** | `customs.officer@smartport.ai` | `Customs@123` |
| **Warehouse Manager** | `warehouse.manager@smartport.ai` | `Warehouse@123` |
| **Truck Operator** | `truck.operator@smartport.ai` | `Truck@123` |
| **Logistics Manager** | `logistics.manager@smartport.ai` | `Logistics@123` |
| **AI Administrator** | `ai.admin@smartport.ai` | `Ai@123` |
| **Data Analyst** | `data.analyst@smartport.ai` | `Analyst@123` |

---

## 4. Key Endpoints

- `POST /api/auth/login` — Authenticate and receive JWT token + profile + roles
- `POST /api/auth/register` — Create account with requested role
- `GET /api/submissions` — List all submissions (with optional `?stages=...` filter)
- `GET /api/submissions/{id}` — Full submission detail with docs, verifications, and history
- `POST /api/submissions` — Create new submission + auto-generate containers
- `PATCH /api/submissions/{id}/stage` — Advance submission through the 21-stage pipeline
- `PATCH /api/submissions/{id}/berth` — Assign berth to vessel
- `GET /api/containers` — Query containers (with optional `?stages=...` filter)
- `PATCH /api/containers/bulk-update` — Batch update container yard blocks/stages
- `GET /api/berths` — List all 25 PSA Singapore berths
- `POST /api/ai/verify/{submission_id}` — Trigger AI verification and risk assessment
- `GET /api/ai/stats` — Aggregate verification statistics
- `GET /api/analytics/dashboard-summary` — Fast real-time dashboard counts
- `GET /api/public/weather` — Live Singapore weather (Open-Meteo)
- `GET /api/public/ais` — Live AIS vessel tracking positions in Singapore Strait
- `GET /api/db/{table}` — Universal REST query engine with filtering and sorting
- `POST /api/rpc/{func_name}` — Stored procedure execution engine

