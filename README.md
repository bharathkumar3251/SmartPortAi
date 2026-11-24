# SMARTPORT AI — AI Powered Port Congestion Prediction & Logistics Intelligence Platform

**SmartPort AI** is an enterprise-grade maritime logistics intelligence and smart port operating system. Centered on the operations of major container hubs (featuring PSA Singapore and the Singapore Strait), the platform orchestrates end-to-end maritime workflows: vessel arrival notices, AI-assisted document verification, customs clearance, terminal berth assignments, yard crane operations, warehouse intake, truck appointment scheduling (TAS), and intermodal logistics delivery.

---

## 1. System Architecture & Tech Stack

```
                              +------------------------------------+
                              |       SmartPort AI Frontend        |
                              |   (React 19 / TanStack Router)     |
                              +-----------------+------------------+
                                                |
                                                | REST APIs / JWT Auth
                                                v
                              +------------------------------------+
                              |      Python FastAPI Backend        |
                              |    (FastAPI / SQLAlchemy ORM)      |
                              +-----------------+------------------+
                                                |
                                                | Native Storage & Queries
                                                v
                              +------------------------------------+
                              |     SQLite Database Engine         |
                              |    (backend/data/smartport.db)     |
                              +------------------------------------+
```

### Backend (Python + FastAPI)
* **Framework:** **FastAPI 0.115+** with asynchronous routing, Pydantic v2 schemas, and interactive Swagger UI.
* **Database Engine:** **SQLite 3** (`backend/data/smartport.db`) with Write-Ahead Logging (WAL) and foreign keys enabled.
* **ORM & Persistence:** **SQLAlchemy 2.0+** with declarative models and relation cascading.
* **Security & Auth:** PBKDF2-SHA256 salted password hashing + stateless JSON Web Tokens (JWT).
* **Endpoints:** Over 30 RESTful endpoints covering authentication, role approvals, shipment pipelines, container operations, berth allocation, AI verification, audit logs, and Singapore maritime feeds.

### Frontend (React 19 + TypeScript)
* **Framework:** **React 19** + **TanStack Start** (file-based routing with code-generation).
* **Styling:** **Tailwind CSS v4** with custom OKLCH dark-navy theme tokens and glassmorphism.
* **Components:** **Radix UI** primitives styled with modern enterprise aesthetics.
* **Data Visualization:** **Recharts** (trends, donut breakdowns, bar distributions) + **Mapbox GL** (Singapore Strait live nautical tracking).
* **State & Query:** **TanStack React Query v5** with real-time polling and optimistic updates.

---

## 2. Directory Structure

```
SMART/
├── backend/                       # Python FastAPI Backend
│   ├── app/
│   │   ├── config.py              # Configuration & environment settings
│   │   ├── database.py            # SQLite connection, sessionmaker, and Base
│   │   ├── models.py              # SQLAlchemy database models
│   │   ├── schemas.py             # Pydantic request and response schemas
│   │   ├── auth_utils.py          # Password hashing and JWT generation
│   │   ├── seed.py                # Database population (berths, users, shipments)
│   │   ├── main.py                # FastAPI application entrypoint & middleware
│   │   └── routers/
│   │       ├── auth.py            # Login, register, session, claim-admin
│   │       ├── users.py           # Admin user management & role approvals
│   │       ├── submissions.py     # 21-stage shipment lifecycle
│   │       ├── containers.py      # Yard stacking, reefer & hazardous handling
│   │       ├── berths.py          # PSA Singapore berth allocation
│   │       ├── documents.py       # Maritime document storage and downloads
│   │       ├── workflow.py        # Pipeline audit timeline
│   │       ├── notifications.py   # Real-time operational alert dispatch
│   │       ├── audit.py           # Tamper-evident compliance trail
│   │       ├── analytics.py       # High-performance dashboard summaries
│   │       ├── ai.py              # Machine learning verification & co-pilot
│   │       ├── public.py          # Live Singapore weather, AIS, throughput
│   │       └── db_shim.py         # Universal REST query interface
│   ├── data/
│   │   └── smartport.db           # SQLite database file
│   ├── uploads/                   # Uploaded maritime documents
│   ├── requirements.txt           # Python dependency definitions
│   ├── run_backend.py             # Backend startup script
│   └── README.md
├── database/
│   └── smartport.db               # Direct standalone SQLite database file
├── frontend/                      # Production React 19 web application
│   ├── src/
│   │   ├── components/            # UI components, layout, charts, workflow boards
│   │   ├── hooks/                 # React Query hooks (useOps, useAuth, useWorkflow)
│   │   ├── integrations/          # SQLite + FastAPI isomorphic client adapter
│   │   ├── lib/                   # Roles, state machine, metrics, audit logger
│   │   ├── routes/                # 23 file-based routes for all 10 roles
│   │   └── styles.css             # Tailwind v4 theme & OKLCH tokens
│   ├── package.json
│   ├── vite.config.ts
│   └── .env
├── SPA/                           # Directory junction to frontend (backward-compatible)
├── run_project.bat                # 1-Click launcher for both Backend & Frontend (Windows)
├── run_project.ps1                # PowerShell launcher
├── run_backend.bat                # 1-Click launcher for FastAPI backend
├── run_frontend.bat               # 1-Click launcher for Frontend
└── README.md                      # Master documentation
```

---

## 3. How to Run the Project

### Option A: 1-Click Quick Launch (Recommended)
Simply double-click:
```bash
run_project.bat
```
*(Or in PowerShell: `.\run_project.ps1`)*

This launches:
1. The **FastAPI Backend** at `http://localhost:8000` (Swagger UI at `http://localhost:8000/docs`)
2. The **Frontend Web App** at `http://localhost:3000`

---

### Option B: Manual Terminal Execution

#### 1. Start the Python FastAPI Backend:
```bash
cd backend
pip install -r requirements.txt
python run_backend.py
```

#### 2. Start the Frontend Application:
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```

---

## 4. Demonstration Accounts for the Jury

The database comes pre-seeded with accounts for all **10 operational roles**:

| Role | Email | Password | Primary Portal / Focus |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@smartport.ai` | `Admin@123` | `/app/admin` (Full Governance & "View As" Mode) |
| **Port Authority** | `port.authority@smartport.ai` | `Admin@123` *(or `Port@123`)* | `/app/port-authority` (Vessel Queue & Berth Control) |
| **Terminal Operator** | `terminal.operator@smartport.ai` | `Admin@123` *(or `Terminal@123`)* | `/app/terminal` (Quay Cranes & Yard Utilization) |
| **Shipping Company** | `shipping.company@smartport.ai` | `Admin@123` *(or `Ship@123`)* | `/app/shipping` (Voyages, ETAs, Document Filings) |
| **Customs Officer** | `customs.officer@smartport.ai` | `Admin@123` *(or `Customs@123`)* | `/app/customs` (Risk Scoring & Cargo Clearances) |
| **Warehouse Manager** | `warehouse.manager@smartport.ai` | `Admin@123` *(or `Warehouse@123`)* | `/app/warehouse` (CFS Intake & Storage Dwell Times) |
| **Truck Operator** | `truck.operator@smartport.ai` | `Admin@123` *(or `Truck@123`)* | `/app/truck` (Gate Appointments & E-Gate QR Passes) |
| **Logistics Manager** | `logistics.manager@smartport.ai` | `Admin@123` *(or `Logistics@123`)* | `/app/logistics` (Multimodal Tower & SLA Tracking) |
| **AI Administrator** | `ai.admin@smartport.ai` | `Admin@123` *(or `Ai@123`)* | `/app/ai` (Model Registry, SHAP Features & Drift) |
| **Data Analyst** | `data.analyst@smartport.ai` | `Admin@123` *(or `Analyst@123`)* | `/app/analytics` (Macro Throughput & Turnaround Stats) |

> **Note for Jury Testing:** All 10 pre-seeded role accounts can be accessed using the universal password `Admin@123`.

---

## 5. Key Highlights for Evaluation

1. **Native SQLite Database:** Pure SQLite storage without any external database server requirement. Inspectable via DB Browser for SQLite or standard Python scripts.
2. **FastAPI Backend:** Fully asynchronous, typed with Pydantic v2 schemas, documented interactively at `/docs`.
3. **No External Supabase Dependency:** The application is self-contained and operates completely offline/locally.
4. **Preserved Web Architecture:** All 23 dashboards, the 21-stage shipment state machine, physical container tracking, and user experience remain identical and fully functional.
5. **Real Pre-Seeded Datasets:** Active Singapore container ships (Ever Given, CMA CGM Antoine, Maersk Mc-Kinney Moller, MSC Gulsun), 25 PSA Singapore berths, and realistic manifests.

