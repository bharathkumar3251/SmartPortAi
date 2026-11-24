import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = BASE_DIR / "uploads"

DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    PROJECT_NAME: str = "SmartPort AI Backend"
    VERSION: str = "2.1.0"
    API_PREFIX: str = "/api"
    
    # SQLite Database File Path
    SQLITE_DB_PATH: Path = DATA_DIR / "smartport.db"
    DATABASE_URL: str = f"sqlite:///{SQLITE_DB_PATH.as_posix()}"
    
    # JWT Auth Configuration
    SECRET_KEY: str = "smartport-secret-key-for-jwt-tokens-production-grade-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
        "*"
    ]
    
    # Upstream APIs (optional fallback)
    AISSTREAM_API_KEY: str = os.getenv("AISSTREAM_API_KEY", "")
    OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

