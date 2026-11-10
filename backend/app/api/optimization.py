import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.truck import Truck, TruckStatus
from app.models.package import Package, PackageStatus
from app.models.optimization import (
    OptimizationRun,
    Assignment,
    Delivery,
    Route,
    AssignmentStatus,
    RunStatus,
    DeliveryStatus,
)
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.optimization import (
    OptimizationRequest,
    OptimizationRunResponse,
    TruckLoadResult,
    AssignedPackageDetail,
    DeliveryStopDetail,
    UnassignedPackageDetail,
)
from app.security import (
    get_current_user,
    require_manager_or_admin,
)
from app.optimization.engine import OptimizationEngine

router = APIRouter(prefix="/api/optimization", tags=["Load Optimization Engine"])

@router.post("/run", response_model=OptimizationRunResponse)
def execute_load_optimization(
    payload: OptimizationRequest = OptimizationRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    """
    Executes the constraint-aware multi-dimensional knapsack optimization algorithm on live database records.
    Atomically persists active assignments, routes, and delivery sequences.
    """
    # 1. Fetch trucks
    truck_query = db.query(Truck)
    if payload.truck_ids:
        truck_query = truck_query.filter(Truck.truck_id.in_(payload.truck_ids))
    trucks = truck_query.all()

    # 2. Fetch packages
    pkg_query = db.query(Package)
    if payload.package_ids:
        pkg_query = pkg_query.filter(Package.package_id.in_(payload.package_ids))
    else:
        # Default to all packages that are PENDING or currently ASSIGNED (for re-optimization)
        pkg_query = pkg_query.filter(Package.status.in_([PackageStatus.PENDING.value, PackageStatus.ASSIGNED.value]))
    packages = pkg_query.all()

    if not packages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No eligible pending or assignable packages found in the database."
        )

    # 3. Instantiate optimization engine
    engine = OptimizationEngine(
        priority_weight=payload.priority_weight,
        destination_affinity_weight=payload.destination_affinity_weight,
        utilization_balance_weight=payload.utilization_balance_weight
    )

    # Reset package statuses in memory for optimization run
    for p in packages:
        p.status = PackageStatus.PENDING.value

    # Run optimization
    opt_result = engine.run_optimization(trucks, packages, run_id=0)

    try:
        # 4. Atomic Database Transaction: Archive old assignments and persist new run
        db.query(Assignment).filter(Assignment.assignment_status == AssignmentStatus.ACTIVE.value).update(
            {"assignment_status": AssignmentStatus.HISTORICAL.value}
        )

        db_run = OptimizationRun(
            created_by_id=current_user.user_id,
            algorithm_version=opt_result.algorithm_version,
            status=RunStatus.COMPLETED.value,
            total_packages=opt_result.total_packages,
            assigned_packages=opt_result.assigned_packages_count,
            unassigned_packages=opt_result.unassigned_packages_count,
            notes=f"Optimization run executed by {current_user.name} ({current_user.role})"
        )
        db.add(db_run)
        db.flush()

        # Update run_id in response
        opt_result.run_id = db_run.optimization_run_id

        # Persist assignments, routes, deliveries
        for t_res in opt_result.trucks:
            for p_detail in t_res.assigned_packages:
                assignment = Assignment(
                    optimization_run_id=db_run.optimization_run_id,
                    truck_id=t_res.truck_id,
                    package_id=p_detail.package_id,
                    loading_order=p_detail.loading_order,
                    assignment_status=AssignmentStatus.ACTIVE.value
                )
                db.add(assignment)

                # Mark package as ASSIGNED in database
                pkg_obj = db.query(Package).filter(Package.package_id == p_detail.package_id).first()
                if pkg_obj:
                    pkg_obj.status = PackageStatus.ASSIGNED.value

            # Persist route & deliveries
            if t_res.delivery_stops:
                stops_json = json.dumps([s.model_dump() for s in t_res.delivery_stops])
                route = Route(
                    truck_id=t_res.truck_id,
                    optimization_run_id=db_run.optimization_run_id,
                    source=next((t.starting_location for t in trucks if t.truck_id == t_res.truck_id), "Delhi Hub"),
                    destination_sequence=stops_json,
                    total_distance_km=t_res.total_route_distance_km,
                    estimated_travel_time_hours=round(t_res.total_route_distance_km / 50.0 + len(t_res.delivery_stops) * 0.5, 2)
                )
                db.add(route)

                for stop in t_res.delivery_stops:
                    delivery = Delivery(
                        truck_id=t_res.truck_id,
                        sequence_number=stop.stop_number,
                        destination=stop.destination,
                        delivery_status=DeliveryStatus.SCHEDULED.value,
                        estimated_distance_km=stop.estimated_leg_distance_km
                    )
                    db.add(delivery)

        # Mark unassigned packages as PENDING
        for u_detail in opt_result.unassigned:
            pkg_obj = db.query(Package).filter(Package.package_id == u_detail.package_id).first()
            if pkg_obj:
                pkg_obj.status = PackageStatus.PENDING.value

        # Log audit
        audit = AuditLog(
            user_id=current_user.user_id,
            action="RUN_OPTIMIZATION",
            entity_type="OPTIMIZATION_RUN",
            entity_id=str(db_run.optimization_run_id),
            details=f"Assigned {opt_result.assigned_packages_count}/{opt_result.total_packages} packages across {len(opt_result.trucks)} trucks."
        )
        db.add(audit)
        db.commit()

        return opt_result

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database transaction error during plan persistence: {str(e)}"
        )

@router.get("/runs")
def list_optimization_runs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves historical optimization runs."""
    runs = db.query(OptimizationRun).order_by(OptimizationRun.optimization_run_id.desc()).limit(20).all()
    return [
        {
            "run_id": r.optimization_run_id,
            "created_by": r.created_by.name if r.created_by else "System",
            "algorithm_version": r.algorithm_version,
            "status": r.status,
            "total_packages": r.total_packages,
            "assigned_packages": r.assigned_packages,
            "unassigned_packages": r.unassigned_packages,
            "notes": r.notes,
            "created_at": r.created_at
        }
        for r in runs
    ]

@router.post("/reset")
def reset_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    """Admin/Manager tool to reset all assignments back to pending for interactive re-testing."""
    db.query(Assignment).filter(Assignment.assignment_status == AssignmentStatus.ACTIVE.value).update(
        {"assignment_status": AssignmentStatus.HISTORICAL.value}
    )
    db.query(Package).filter(Package.status == PackageStatus.ASSIGNED.value).update(
        {"status": PackageStatus.PENDING.value}
    )
    audit = AuditLog(
        user_id=current_user.user_id,
        action="RESET_ASSIGNMENTS",
        entity_type="ASSIGNMENT",
        entity_id="ALL",
        details="Reset all active assignments to pending."
    )
    db.add(audit)
    db.commit()
    return {"message": "All active assignments have been reset to PENDING status."}
