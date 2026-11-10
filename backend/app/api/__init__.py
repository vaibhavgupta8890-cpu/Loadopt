from app.api.auth import router as auth_router
from app.api.trucks import router as trucks_router
from app.api.packages import router as packages_router
from app.api.optimization import router as optimization_router
from app.api.simulation import router as simulation_router
from app.api.dashboard import router as dashboard_router
from app.api.reports import router as reports_router
from app.api.users import router as users_router
from app.api.tracking import router as tracking_router

__all__ = [
    "auth_router",
    "trucks_router",
    "packages_router",
    "optimization_router",
    "simulation_router",
    "dashboard_router",
    "reports_router",
    "users_router",
    "tracking_router",
]
