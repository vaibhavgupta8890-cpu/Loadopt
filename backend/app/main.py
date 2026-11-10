from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db, SessionLocal
from app.models.user import User, UserRole
from app.security import hash_password
from app.api import (
    auth_router,
    trucks_router,
    packages_router,
    optimization_router,
    simulation_router,
    dashboard_router,
    reports_router,
    users_router,
    tracking_router,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schemas and SQL Views
    init_db()

    # Bootstrap default admin user if none exists
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email == "admin@loadopt.io").first()
        if not admin_user:
            default_admin = User(
                name="System Administrator",
                email="admin@loadopt.io",
                password_hash=hash_password("Admin@123"),
                role=UserRole.ADMIN.value,
                is_active=True
            )
            db.add(default_admin)
            db.commit()
            print("Notice: Initialized default administrator: admin@loadopt.io / Admin@123")
    except Exception as e:
        print(f"Notice during bootstrap: {e}")
    finally:
        db.close()

    yield

app = FastAPI(
    title="LoadOpt API",
    description="Smart Truck Loading and Delivery Optimization System - REST API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router)
app.include_router(trucks_router)
app.include_router(packages_router)
app.include_router(optimization_router)
app.include_router(simulation_router)
app.include_router(dashboard_router)
app.include_router(reports_router)
app.include_router(users_router)
app.include_router(tracking_router)

@app.get("/")
def root():
    return {
        "system": "LoadOpt — Smart Truck Loading and Delivery Optimization System",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs",
        "environment": settings.ENVIRONMENT
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "database": "connected"}
