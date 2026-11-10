import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class TruckStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    IN_TRANSIT = "IN_TRANSIT"
    MAINTENANCE = "MAINTENANCE"
    OUT_OF_SERVICE = "OUT_OF_SERVICE"

class Truck(Base):
    __tablename__ = "trucks"

    truck_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    truck_number = Column(String(50), unique=True, index=True, nullable=False)
    truck_model = Column(String(100), nullable=False)
    max_weight_kg = Column(Float, nullable=False)
    max_volume_m3 = Column(Float, nullable=False)
    status = Column(String(30), nullable=False, default=TruckStatus.AVAILABLE.value)
    starting_location = Column(String(150), nullable=False, default="Central Logistics Depot, Delhi")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        CheckConstraint("max_weight_kg > 0", name="chk_truck_weight_positive"),
        CheckConstraint("max_volume_m3 > 0", name="chk_truck_volume_positive"),
    )

    # Relationships
    assignments = relationship("Assignment", back_populates="truck", cascade="all, delete-orphan")
    deliveries = relationship("Delivery", back_populates="truck")
    routes = relationship("Route", back_populates="truck")
