from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class OptimizationRequest(BaseModel):
    truck_ids: Optional[List[int]] = None
    package_ids: Optional[List[int]] = None
    priority_weight: float = Field(1.5, ge=0.0, le=5.0)
    destination_affinity_weight: float = Field(1.0, ge=0.0, le=5.0)
    utilization_balance_weight: float = Field(1.0, ge=0.0, le=5.0)

class AssignedPackageDetail(BaseModel):
    package_id: int
    description: str
    weight_kg: float
    volume_m3: float
    destination: str
    destination_latitude: Optional[float] = None
    destination_longitude: Optional[float] = None
    priority: str
    loading_order: int
    assignment_reason: str

class DeliveryStopDetail(BaseModel):
    stop_number: int
    destination: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    package_count: int
    estimated_leg_distance_km: float

class TruckLoadResult(BaseModel):
    truck_id: int
    truck_number: str
    truck_model: str
    max_weight_kg: float
    max_volume_m3: float
    total_assigned_weight_kg: float
    total_assigned_volume_m3: float
    weight_utilization_pct: float
    volume_utilization_pct: float
    assigned_packages: List[AssignedPackageDetail]
    loading_sequence: List[int]
    delivery_stops: List[DeliveryStopDetail]
    total_route_distance_km: float

class UnassignedPackageDetail(BaseModel):
    package_id: int
    description: str
    weight_kg: float
    volume_m3: float
    destination: str
    priority: str
    reason: str

class OptimizationRunResponse(BaseModel):
    run_id: int
    algorithm_version: str
    status: str
    total_packages: int
    assigned_packages_count: int
    unassigned_packages_count: int
    overall_weight_utilization_pct: float
    overall_volume_utilization_pct: float
    trucks: List[TruckLoadResult]
    unassigned: List[UnassignedPackageDetail]
    warnings: List[str]
    created_at: datetime
