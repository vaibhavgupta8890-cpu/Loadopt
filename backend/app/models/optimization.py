import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class RunStatus(str, enum.Enum):
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    SIMULATION = "SIMULATION"

class AssignmentStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    HISTORICAL = "HISTORICAL"
    CANCELLED = "CANCELLED"

class DeliveryStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    IN_TRANSIT = "IN_TRANSIT"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class OptimizationRun(Base):
    __tablename__ = "optimization_runs"

    optimization_run_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_by_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    algorithm_version = Column(String(50), nullable=False, default="Heuristic-MultiKnapsack-v1.0")
    status = Column(String(30), nullable=False, default=RunStatus.COMPLETED.value)
    total_packages = Column(Integer, default=0, nullable=False)
    assigned_packages = Column(Integer, default=0, nullable=False)
    unassigned_packages = Column(Integer, default=0, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    created_by = relationship("User", back_populates="optimization_runs")
    assignments = relationship("Assignment", back_populates="optimization_run", cascade="all, delete-orphan")
    routes = relationship("Route", back_populates="optimization_run", cascade="all, delete-orphan")

class Assignment(Base):
    __tablename__ = "assignments"

    assignment_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    optimization_run_id = Column(Integer, ForeignKey("optimization_runs.optimization_run_id"), index=True, nullable=False)
    truck_id = Column(Integer, ForeignKey("trucks.truck_id"), index=True, nullable=False)
    package_id = Column(Integer, ForeignKey("packages.package_id"), index=True, nullable=False)
    loading_order = Column(Integer, default=1, nullable=False)
    assignment_status = Column(String(30), nullable=False, default=AssignmentStatus.ACTIVE.value, index=True)
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    optimization_run = relationship("OptimizationRun", back_populates="assignments")
    truck = relationship("Truck", back_populates="assignments")
    package = relationship("Package", back_populates="assignments")
    delivery = relationship("Delivery", back_populates="assignment", uselist=False, cascade="all, delete-orphan")

class Delivery(Base):
    __tablename__ = "deliveries"

    delivery_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    assignment_id = Column(Integer, ForeignKey("assignments.assignment_id"), nullable=True)
    truck_id = Column(Integer, ForeignKey("trucks.truck_id"), index=True, nullable=False)
    sequence_number = Column(Integer, default=1, nullable=False)
    destination = Column(String(150), nullable=False)
    delivery_status = Column(String(30), default=DeliveryStatus.SCHEDULED.value, nullable=False)
    estimated_distance_km = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    assignment = relationship("Assignment", back_populates="delivery")
    truck = relationship("Truck", back_populates="deliveries")

class Route(Base):
    __tablename__ = "routes"

    route_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    truck_id = Column(Integer, ForeignKey("trucks.truck_id"), index=True, nullable=False)
    optimization_run_id = Column(Integer, ForeignKey("optimization_runs.optimization_run_id"), index=True, nullable=False)
    source = Column(String(150), nullable=False)
    destination_sequence = Column(Text, nullable=False)  # JSON encoded list of destinations with coordinates
    total_distance_km = Column(Float, default=0.0, nullable=False)
    estimated_travel_time_hours = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    truck = relationship("Truck", back_populates="routes")
    optimization_run = relationship("OptimizationRun", back_populates="routes")
