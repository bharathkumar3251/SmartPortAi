import sys
import uvicorn
from pathlib import Path

# Add current directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

if __name__ == "__main__":
    print("=" * 60)
    print("Starting SmartPort AI FastAPI Backend (SQLite Engine)")
    print("API Base URL: http://localhost:8000")
    print("Interactive Swagger Docs: http://localhost:8000/docs")
    print("=" * 60)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

