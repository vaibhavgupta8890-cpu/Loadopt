from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.optimization import OptimizationRunResponse, AssignedPackageDetail

class ProposedPackage(BaseModel):
    description: str = Field(..., min_length=2)
    weight_kg: float = Field(..., gt=0)
    length_cm: float = Field(..., gt=0)
    width_cm: float = Field(..., gt=0)
    height_cm: float = Field(..., gt=0)
    destination: str = Field(..., min_length=2)
    priority: str = Field("HIGH", pattern="^(HIGH|MEDIUM|LOW)$")

class SimulationRequest(BaseModel):
    scenario_type: str = Field(..., pattern="^(EXCLUDE_TRUCK|URGENT_PACKAGE|REDUCE_CAPACITY)$")
    excluded_truck_id: Optional[int] = None
    reduced_capacity_truck_id: Optional[int] = None
    capacity_reduction_pct: Optional[float] = Field(None, ge=1.0, le=90.0)
    proposed_package: Optional[ProposedPackage] = None

class SimulationComparisonResponse(BaseModel):
    scenario_type: str
    original_run_id: Optional[int] = None
    original_summary: Dict[str, Any]
    simulated_summary: Dict[str, Any]
    delta: Dict[str, Any]
    simulated_result: OptimizationRunResponse
    impact_summary: str
    reassigned_packages_count: int
    newly_unassigned_packages: List[str]

class ApplySimulationPlanRequest(BaseModel):
    simulated_result: OptimizationRunResponse
    persist_proposed_package: bool = False
    proposed_package: Optional[ProposedPackage] = None
