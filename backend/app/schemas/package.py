from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, model_validator, ConfigDict

class PackageBase(BaseModel):
    description: str = Field(..., min_length=2, max_length=200)
    weight_kg: float = Field(..., gt=0, description="Package weight in kilograms")
    length_cm: float = Field(..., gt=0, description="Length in centimeters")
    width_cm: float = Field(..., gt=0, description="Width in centimeters")
    height_cm: float = Field(..., gt=0, description="Height in centimeters")
    destination: str = Field(..., min_length=2, max_length=150)
    destination_latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    destination_longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    priority: str = Field("MEDIUM", pattern="^(HIGH|MEDIUM|LOW)$")
    status: str = Field("PENDING", pattern="^(PENDING|ASSIGNED|IN_TRANSIT|DELIVERED|CANCELLED)$")
    requested_delivery_deadline: Optional[datetime] = None

class PackageCreate(PackageBase):
    volume_m3: Optional[float] = None

    @model_validator(mode="after")
    def compute_volume(self):
        if not self.volume_m3 or self.volume_m3 <= 0:
            self.volume_m3 = round((self.length_cm * self.width_cm * self.height_cm) / 1_000_000.0, 4)
        return self

class PackageUpdate(BaseModel):
    description: Optional[str] = Field(None, min_length=2, max_length=200)
    weight_kg: Optional[float] = Field(None, gt=0)
    length_cm: Optional[float] = Field(None, gt=0)
    width_cm: Optional[float] = Field(None, gt=0)
    height_cm: Optional[float] = Field(None, gt=0)
    destination: Optional[str] = Field(None, min_length=2, max_length=150)
    destination_latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    destination_longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    priority: Optional[str] = Field(None, pattern="^(HIGH|MEDIUM|LOW)$")
    status: Optional[str] = Field(None, pattern="^(PENDING|ASSIGNED|IN_TRANSIT|DELIVERED|CANCELLED)$")
    requested_delivery_deadline: Optional[datetime] = None

class PackageResponse(PackageBase):
    package_id: int
    volume_m3: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
