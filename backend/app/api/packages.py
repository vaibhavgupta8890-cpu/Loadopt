from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.package import Package, PackagePriority, PackageStatus
from app.models.optimization import Assignment, AssignmentStatus
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.package import (
    PackageCreate,
    PackageUpdate,
    PackageResponse,
)
from app.security import (
    get_current_user,
    require_manager_or_admin,
)

router = APIRouter(prefix="/api/packages", tags=["Package Management"])

@router.get("", response_model=List[PackageResponse])
def get_packages(
    search: Optional[str] = Query(None, description="Search description or destination"),
    priority: Optional[str] = Query(None, description="Filter by priority: HIGH, MEDIUM, LOW"),
    destination: Optional[str] = Query(None, description="Filter by destination"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves all packages with search, priority, destination, and status filters."""
    query = db.query(Package)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            (Package.description.ilike(search_fmt)) | (Package.destination.ilike(search_fmt))
        )

    if priority:
        query = query.filter(Package.priority == priority.upper())

    if destination:
        query = query.filter(Package.destination.ilike(f"%{destination.strip()}%"))

    if status_filter:
        query = query.filter(Package.status == status_filter.upper())

    return query.order_by(Package.package_id.desc()).all()

@router.get("/{package_id}", response_model=PackageResponse)
def get_package_detail(
    package_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves details of a single package."""
    pkg = db.query(Package).filter(Package.package_id == package_id).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")
    return pkg

@router.post("", response_model=PackageResponse, status_code=status.HTTP_201_CREATED)
def create_package(
    payload: PackageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    """Creates a new package with automatically calculated volume."""
    vol = round((payload.length_cm * payload.width_cm * payload.height_cm) / 1_000_000.0, 4)
    pkg = Package(
        description=payload.description.strip(),
        weight_kg=payload.weight_kg,
        length_cm=payload.length_cm,
        width_cm=payload.width_cm,
        height_cm=payload.height_cm,
        volume_m3=vol,
        destination=payload.destination.strip(),
        destination_latitude=payload.destination_latitude,
        destination_longitude=payload.destination_longitude,
        priority=payload.priority,
        status=payload.status,
        requested_delivery_deadline=payload.requested_delivery_deadline
    )
    db.add(pkg)
    db.flush()

    audit = AuditLog(
        user_id=current_user.user_id,
        action="CREATE_PACKAGE",
        entity_type="PACKAGE",
        entity_id=str(pkg.package_id),
        details=f"Created package '{pkg.description}' ({pkg.weight_kg}kg, {pkg.volume_m3}m³ to {pkg.destination})"
    )
    db.add(audit)
    db.commit()
    db.refresh(pkg)
    return pkg

@router.put("/{package_id}", response_model=PackageResponse)
def update_package(
    package_id: int,
    payload: PackageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    """Updates package attributes. Prevents silent modification of DELIVERED packages."""
    pkg = db.query(Package).filter(Package.package_id == package_id).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")

    if pkg.status == PackageStatus.DELIVERED.value and payload.status != PackageStatus.DELIVERED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Package has already been marked DELIVERED and cannot be modified."
        )

    if payload.description is not None:
        pkg.description = payload.description.strip()
    if payload.weight_kg is not None:
        pkg.weight_kg = payload.weight_kg
    if payload.length_cm is not None:
        pkg.length_cm = payload.length_cm
    if payload.width_cm is not None:
        pkg.width_cm = payload.width_cm
    if payload.height_cm is not None:
        pkg.height_cm = payload.height_cm

    # Recalculate volume if dimensions changed
    pkg.volume_m3 = round((pkg.length_cm * pkg.width_cm * pkg.height_cm) / 1_000_000.0, 4)

    if payload.destination is not None:
        pkg.destination = payload.destination.strip()
    if payload.destination_latitude is not None:
        pkg.destination_latitude = payload.destination_latitude
    if payload.destination_longitude is not None:
        pkg.destination_longitude = payload.destination_longitude
    if payload.priority is not None:
        pkg.priority = payload.priority
    if payload.status is not None:
        pkg.status = payload.status
    if payload.requested_delivery_deadline is not None:
        pkg.requested_delivery_deadline = payload.requested_delivery_deadline

    audit = AuditLog(
        user_id=current_user.user_id,
        action="UPDATE_PACKAGE",
        entity_type="PACKAGE",
        entity_id=str(pkg.package_id),
        details=f"Updated package '{pkg.description}'"
    )
    db.add(audit)
    db.commit()
    db.refresh(pkg)
    return pkg

@router.delete("/{package_id}", status_code=status.HTTP_200_OK)
def delete_package(
    package_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    """Deletes an unassigned or cancelled package."""
    pkg = db.query(Package).filter(Package.package_id == package_id).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")

    active_assign = db.query(Assignment).filter(
        Assignment.package_id == package_id,
        Assignment.assignment_status == AssignmentStatus.ACTIVE.value
    ).first()

    if active_assign:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete package with an active truck assignment. Please unassign first."
        )

    db.delete(pkg)
    audit = AuditLog(
        user_id=current_user.user_id,
        action="DELETE_PACKAGE",
        entity_type="PACKAGE",
        entity_id=str(package_id),
        details=f"Deleted package '{pkg.description}'"
    )
    db.add(audit)
    db.commit()
    return {"message": f"Package #{package_id} successfully deleted."}
