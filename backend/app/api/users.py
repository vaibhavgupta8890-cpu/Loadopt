from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.user import UserResponse
from app.security import require_admin

router = APIRouter(prefix="/api/users", tags=["User Administration"])

@router.get("", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    """Admin-only: list all system users."""
    users = db.query(User).order_by(User.user_id.asc()).all()
    return [UserResponse.model_validate(u) for u in users]

@router.put("/{user_id}/status", response_model=UserResponse)
def toggle_user_status(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    """Admin-only: toggle user active status."""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own administrator account.")

    user.is_active = not user.is_active
    audit = AuditLog(
        user_id=current_user.user_id,
        action="TOGGLE_USER_STATUS",
        entity_type="USER",
        entity_id=str(user.user_id),
        details=f"User {user.email} status toggled to {user.is_active}"
    )
    db.add(audit)
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)

@router.get("/audit-logs")
def get_audit_logs(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    """Admin-only: retrieve full system audit trail."""
    logs = db.query(AuditLog).order_by(AuditLog.audit_id.desc()).limit(100).all()
    return [
        {
            "audit_id": l.audit_id,
            "user": l.user.name if l.user else "System",
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "details": l.details,
            "created_at": l.created_at
        }
        for l in logs
    ]
