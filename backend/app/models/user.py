import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    LOGISTICS_MANAGER = "LOGISTICS_MANAGER"
    VIEWER = "VIEWER"

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False, default=UserRole.VIEWER.value)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    optimization_runs = relationship("OptimizationRun", back_populates="created_by")
    audit_logs = relationship("AuditLog", back_populates="user")
