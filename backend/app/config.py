import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend or root directory
root_dir = Path(__file__).resolve().parent.parent.parent
backend_dir = Path(__file__).resolve().parent.parent

if (backend_dir / ".env").exists():
    load_dotenv(dotenv_path=backend_dir / ".env")
elif (root_dir / ".env").exists():
    load_dotenv(dotenv_path=root_dir / ".env")
else:
    load_dotenv()

class Settings:
    PROJECT_NAME: str = os.getenv("APP_NAME", "LoadOpt — Smart Truck Loading and Delivery Optimization")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "loadopt-super-secret-development-key-change-in-production-2026")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))
    
    # Database URL resolution: anchor SQLite path to project root
    raw_db_url = os.getenv("DATABASE_URL", "sqlite:///./loadopt.db")
    if raw_db_url.startswith("sqlite:///./"):
        sqlite_file = raw_db_url.replace("sqlite:///./", "")
        DATABASE_URL: str = f"sqlite:///{(root_dir / sqlite_file).as_posix()}"
    else:
        DATABASE_URL: str = raw_db_url
    
    # CORS
    cors_str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173")
    CORS_ORIGINS: list[str] = [origin.strip() for origin in cors_str.split(",") if origin.strip()]

settings = Settings()
