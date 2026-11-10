from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class TruckBase(BaseModel):
    truck_number: str = Field(..., min_length=2, max_length=50, description="Unique registration number or code")
    truck_model: str = Field(..., min_length=2, max_length=100, description="Make and model of the truck")
    max_weight_kg: float = Field(..., gt=0, description="Maximum gross payload weight capacity in kg")
    max_volume_m3: float = Field(..., gt=0, description="Maximum internal cargo volume in cubic meters")
    status: str = Field("AVAILABLE", pattern="^(AVAILABLE|IN_TRANSIT|MAINTENANCE|OUT_OF_SERVICE)$")
    starting_location: str = Field("Central Logistics Depot, Delhi", min_length=2, max_length=150)

class TruckCreate(TruckBase):
    pass

class TruckUpdate(BaseModel):
    truck_number: Optional[str] = Field(None, min_length=2, max_length=50)
    truck_model: Optional[str] = Field(None, min_length=2, max_length=100)
    max_weight_kg: Optional[float] = Field(None, gt=0)
    max_volume_m3: Optional[float] = Field(None, gt=0)
    status: Optional[str] = Field(None, pattern="^(AVAILABLE|IN_TRANSIT|MAINTENANCE|OUT_OF_SERVICE)$")
    starting_location: Optional[str] = Field(None, min_length=2, max_length=150)

class TruckResponse(TruckBase):
    truck_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TruckWithUtilizationResponse(TruckResponse):
    total_assigned_weight_kg: float = 0.0
    total_assigned_volume_m3: float = 0.0
    weight_utilization_pct: float = 0.0
    volume_utilization_pct: float = 0.0
    assigned_package_count: int = 0
