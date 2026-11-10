from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.truck import Truck, TruckStatus
from app.models.optimization import Assignment, AssignmentStatus
from app.models.package import Package
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.truck import (
    TruckCreate,
    TruckUpdate,
    TruckResponse,
    TruckWithUtilizationResponse,
)
from app.security import (
    get_current_user,
    require_manager_or_admin,
)

router = APIRouter(prefix="/api/trucks", tags=["Truck Management"])

@router.get("", response_model=List[TruckWithUtilizationResponse])
def get_trucks(
    search: Optional[str] = Query(None, description="Search by truck number or model"),
    status_filter: Optional[str] = Query(None, alias="status"),
    min_weight: Optional[float] = Query(None, ge=0),
    max_weight: Optional[float] = Query(None, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lists trucks with live active assignment utilization calculations and filters."""
    query = db.query(Truck)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter((Truck.truck_number.ilike(search_fmt)) | (Truck.truck_model.ilike(search_fmt)))

    if status_filter:
        query = query.filter(Truck.status == status_filter.upper())

    if min_weight is not None:
        query = query.filter(Truck.max_weight_kg >= min_weight)

    if max_weight is not None:
        query = query.filter(Truck.max_weight_kg <= max_weight)

    trucks = query.order_by(Truck.truck_id.asc()).all()

    # Calculate active assignment utilization for each truck
    result = []
    for t in trucks:
        # Sum active assigned packages
        assigned_stats = (
            db.query(
                func.coalesce(func.sum(Package.weight_kg), 0.0).label("tot_weight"),
                func.coalesce(func.sum(Package.volume_m3), 0.0).label("tot_volume"),
                func.count(Assignment.assignment_id).label("pkg_count")
            )
            .join(Assignment, Assignment.package_id == Package.package_id)
            .filter(
                Assignment.truck_id == t.truck_id,
                Assignment.assignment_status == AssignmentStatus.ACTIVE.value
            )
            .first()
        )

        tot_weight = float(assigned_stats.tot_weight) if assigned_stats else 0.0
        tot_volume = float(assigned_stats.tot_volume) if assigned_stats else 0.0
        pkg_count = int(assigned_stats.pkg_count) if assigned_stats else 0

        w_pct = round((tot_weight / t.max_weight_kg) * 100.0, 2) if t.max_weight_kg > 0 else 0.0
        v_pct = round((tot_volume / t.max_volume_m3) * 100.0, 2) if t.max_volume_m3 > 0 else 0.0

        result.append(
            TruckWithUtilizationResponse(
                truck_id=t.truck_id,
                truck_number=t.truck_number,
                truck_model=t.truck_model,
                max_weight_kg=t.max_weight_kg,
                max_volume_m3=t.max_volume_m3,
                status=t.status,
                starting_location=t.starting_location,
                created_at=t.created_at,
                total_assigned_weight_kg=round(tot_weight, 2),
                total_assigned_volume_m3=round(tot_volume, 4),
                weight_utilization_pct=w_pct,
                volume_utilization_pct=v_pct,
                assigned_package_count=pkg_count
            )
        )

    return result

@router.get("/{truck_id}", response_model=TruckWithUtilizationResponse)
def get_truck_detail(
    truck_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves full details for a single truck."""
    t = db.query(Truck).filter(Truck.truck_id == truck_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Truck not found")

    assigned_stats = (
        db.query(
            func.coalesce(func.sum(Package.weight_kg), 0.0).label("tot_weight"),
            func.coalesce(func.sum(Package.volume_m3), 0.0).label("tot_volume"),
            func.count(Assignment.assignment_id).label("pkg_count")
        )
        .join(Assignment, Assignment.package_id == Package.package_id)
        .filter(
            Assignment.truck_id == t.truck_id,
            Assignment.assignment_status == AssignmentStatus.ACTIVE.value
        )
        .first()
    )

    tot_weight = float(assigned_stats.tot_weight) if assigned_stats else 0.0
    tot_volume = float(assigned_stats.tot_volume) if assigned_stats else 0.0
    pkg_count = int(assigned_stats.pkg_count) if assigned_stats else 0

    return TruckWithUtilizationResponse(
        truck_id=t.truck_id,
        truck_number=t.truck_number,
        truck_model=t.truck_model,
        max_weight_kg=t.max_weight_kg,
        max_volume_m3=t.max_volume_m3,
        status=t.status,
        starting_location=t.starting_location,
        created_at=t.created_at,
        total_assigned_weight_kg=round(tot_weight, 2),
        total_assigned_volume_m3=round(tot_volume, 4),
        weight_utilization_pct=round((tot_weight / t.max_weight_kg) * 100.0, 2),
        volume_utilization_pct=round((tot_volume / t.max_volume_m3) * 100.0, 2),
        assigned_package_count=pkg_count
    )

@router.post("", response_model=TruckResponse, status_code=status.HTTP_201_CREATED)
def create_truck(
    payload: TruckCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    """Creates a new truck. Enforces uniqueness of truck registration number."""
    existing = db.query(Truck).filter(Truck.truck_number == payload.truck_number.strip().upper()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Truck with registration number '{payload.truck_number}' already exists."
        )

    truck = Truck(
        truck_number=payload.truck_number.strip().upper(),
        truck_model=payload.truck_model.strip(),
        max_weight_kg=payload.max_weight_kg,
        max_volume_m3=payload.max_volume_m3,
        status=payload.status,
        starting_location=payload.starting_location.strip()
    )
    db.add(truck)
    db.flush()

    audit = AuditLog(
        user_id=current_user.user_id,
        action="CREATE_TRUCK",
        entity_type="TRUCK",
        entity_id=str(truck.truck_id),
        details=f"Created truck {truck.truck_number} ({truck.truck_model})"
    )
    db.add(audit)
    db.commit()
    db.refresh(truck)
    return truck

@router.put("/{truck_id}", response_model=TruckResponse)
def update_truck(
    truck_id: int,
    payload: TruckUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    """Updates truck parameters and status."""
    truck = db.query(Truck).filter(Truck.truck_id == truck_id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")

    if payload.truck_number and payload.truck_number.strip().upper() != truck.truck_number:
        existing = db.query(Truck).filter(Truck.truck_number == payload.truck_number.strip().upper()).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Truck number '{payload.truck_number}' is already registered."
            )
        truck.truck_number = payload.truck_number.strip().upper()

    if payload.truck_model is not None:
        truck.truck_model = payload.truck_model.strip()
    if payload.max_weight_kg is not None:
        truck.max_weight_kg = payload.max_weight_kg
    if payload.max_volume_m3 is not None:
        truck.max_volume_m3 = payload.max_volume_m3
    if payload.status is not None:
        truck.status = payload.status
    if payload.starting_location is not None:
        truck.starting_location = payload.starting_location.strip()

    audit = AuditLog(
        user_id=current_user.user_id,
        action="UPDATE_TRUCK",
        entity_type="TRUCK",
        entity_id=str(truck.truck_id),
        details=f"Updated truck {truck.truck_number}"
    )
    db.add(audit)
    db.commit()
    db.refresh(truck)
    return truck

@router.delete("/{truck_id}", status_code=status.HTTP_200_OK)
def delete_truck(
    truck_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    """Deletes or deactivates a truck. Blocks deletion if active assignments exist."""
    truck = db.query(Truck).filter(Truck.truck_id == truck_id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")

    active_assign = db.query(Assignment).filter(
        Assignment.truck_id == truck_id,
        Assignment.assignment_status == AssignmentStatus.ACTIVE.value
    ).first()

    if active_assign:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete truck with active cargo assignments. Please unassign packages or mark deliveries complete first."
        )

    db.delete(truck)
    audit = AuditLog(
        user_id=current_user.user_id,
        action="DELETE_TRUCK",
        entity_type="TRUCK",
        entity_id=str(truck_id),
        details=f"Deleted truck {truck.truck_number}"
    )
    db.add(audit)
    db.commit()
    return {"message": f"Truck {truck.truck_number} successfully deleted."}
