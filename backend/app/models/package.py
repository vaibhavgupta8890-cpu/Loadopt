import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class PackagePriority(str, enum.Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class PackageStatus(str, enum.Enum):
    PENDING = "PENDING"
    ASSIGNED = "ASSIGNED"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

class Package(Base):
    __tablename__ = "packages"

    package_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    description = Column(String(200), nullable=False)
    weight_kg = Column(Float, nullable=False)
    length_cm = Column(Float, nullable=False)
    width_cm = Column(Float, nullable=False)
    height_cm = Column(Float, nullable=False)
    volume_m3 = Column(Float, nullable=False)
    destination = Column(String(150), nullable=False)
    destination_latitude = Column(Float, nullable=True)
    destination_longitude = Column(Float, nullable=True)
    priority = Column(String(20), nullable=False, default=PackagePriority.MEDIUM.value)
    status = Column(String(30), nullable=False, default=PackageStatus.PENDING.value)
    requested_delivery_deadline = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        CheckConstraint("weight_kg > 0", name="chk_pkg_weight_positive"),
        CheckConstraint("length_cm > 0", name="chk_pkg_length_positive"),
        CheckConstraint("width_cm > 0", name="chk_pkg_width_positive"),
        CheckConstraint("height_cm > 0", name="chk_pkg_height_positive"),
        CheckConstraint("volume_m3 > 0", name="chk_pkg_volume_positive"),
    )

    # Relationships
    assignments = relationship("Assignment", back_populates="package", cascade="all, delete-orphan")
