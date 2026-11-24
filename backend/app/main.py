from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings, UPLOADS_DIR
from app.seed import seed_database
from app.routers import (
    auth,
    users,
    submissions,
    containers,
    berths,
    documents,
    workflow,
    notifications,
    audit,
    analytics,
    ai,
    public,
    db_shim,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure SQLite database is created with users and infrastructure (clean, no demo data)
    seed_database(seed_demo=False)
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="SmartPort AI — Enterprise Port Logistics Intelligence Platform (FastAPI + SQLite Engine)",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Include Routers with /api prefix
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(users.router, prefix=settings.API_PREFIX)
app.include_router(submissions.router, prefix=settings.API_PREFIX)
app.include_router(containers.router, prefix=settings.API_PREFIX)
app.include_router(berths.router, prefix=settings.API_PREFIX)
app.include_router(documents.router, prefix=settings.API_PREFIX)
app.include_router(workflow.router, prefix=settings.API_PREFIX)
app.include_router(notifications.router, prefix=settings.API_PREFIX)
app.include_router(audit.router, prefix=settings.API_PREFIX)
app.include_router(analytics.router, prefix=settings.API_PREFIX)
app.include_router(ai.router, prefix=settings.API_PREFIX)
app.include_router(public.router, prefix=settings.API_PREFIX)
app.include_router(db_shim.router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "status": "online",
        "platform": "SmartPort AI",
        "backend": "Python / FastAPI",
        "database": "SQLite 3",
        "docs": "/docs",
        "version": settings.VERSION,
    }

@app.get("/health")
@app.get(f"{settings.API_PREFIX}/health")
def health_check():
    return {"status": "healthy", "database": "connected"}

