from app.schemas.user import UserBase, UserCreate, UserLogin, UserResponse, TokenResponse
from app.schemas.truck import TruckBase, TruckCreate, TruckUpdate, TruckResponse, TruckWithUtilizationResponse
from app.schemas.package import PackageBase, PackageCreate, PackageUpdate, PackageResponse
from app.schemas.optimization import (
    OptimizationRequest,
    AssignedPackageDetail,
    DeliveryStopDetail,
    TruckLoadResult,
    UnassignedPackageDetail,
    OptimizationRunResponse,
)
from app.schemas.simulation import (
    ProposedPackage,
    SimulationRequest,
    SimulationComparisonResponse,
    ApplySimulationPlanRequest,
)
from app.schemas.report import DashboardKpiResponse, ReportSummaryResponse

__all__ = [
    "UserBase", "UserCreate", "UserLogin", "UserResponse", "TokenResponse",
    "TruckBase", "TruckCreate", "TruckUpdate", "TruckResponse", "TruckWithUtilizationResponse",
    "PackageBase", "PackageCreate", "PackageUpdate", "PackageResponse",
    "OptimizationRequest", "AssignedPackageDetail", "DeliveryStopDetail", "TruckLoadResult",
    "UnassignedPackageDetail", "OptimizationRunResponse",
    "ProposedPackage", "SimulationRequest", "SimulationComparisonResponse", "ApplySimulationPlanRequest",
    "DashboardKpiResponse", "ReportSummaryResponse"
]
