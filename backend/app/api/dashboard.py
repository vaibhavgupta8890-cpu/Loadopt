from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.truck import Truck, TruckStatus
from app.models.package import Package, PackagePriority, PackageStatus
from app.models.optimization import Assignment, AssignmentStatus
from app.models.audit import AuditLog
from app.models.user import User
from app.schemas.report import DashboardKpiResponse
from app.security import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard KPIs"])

@router.get("", response_model=DashboardKpiResponse)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Calculates live KPI metrics and chart distributions from database records."""
    total_trucks = db.query(func.count(Truck.truck_id)).scalar() or 0
    available_trucks = db.query(func.count(Truck.truck_id)).filter(Truck.status == TruckStatus.AVAILABLE.value).scalar() or 0

    total_packages = db.query(func.count(Package.package_id)).scalar() or 0
    assigned_packages = db.query(func.count(Package.package_id)).filter(Package.status == PackageStatus.ASSIGNED.value).scalar() or 0
    unassigned_packages = total_packages - assigned_packages

    high_prio_pending = db.query(func.count(Package.package_id)).filter(
        Package.status == PackageStatus.PENDING.value,
        Package.priority == PackagePriority.HIGH.value
    ).scalar() or 0

    # Calculate fleet-wide average weight and volume utilization across active trucks
    trucks = db.query(Truck).all()
    truck_util_summaries = []
    tot_weight_util_sum = 0.0
    tot_vol_util_sum = 0.0
    active_truck_count = 0

    for t in trucks:
        assigned_stats = (
            db.query(
                func.coalesce(func.sum(Package.weight_kg), 0.0).label("w"),
                func.coalesce(func.sum(Package.volume_m3), 0.0).label("v"),
                func.count(Assignment.assignment_id).label("c")
            )
            .join(Assignment, Assignment.package_id == Package.package_id)
            .filter(
                Assignment.truck_id == t.truck_id,
                Assignment.assignment_status == AssignmentStatus.ACTIVE.value
            )
            .first()
        )
        w = float(assigned_stats.w) if assigned_stats else 0.0
        v = float(assigned_stats.v) if assigned_stats else 0.0
        c = int(assigned_stats.c) if assigned_stats else 0

        w_pct = round((w / t.max_weight_kg) * 100.0, 2) if t.max_weight_kg > 0 else 0.0
        v_pct = round((v / t.max_volume_m3) * 100.0, 2) if t.max_volume_m3 > 0 else 0.0

        if t.status == TruckStatus.AVAILABLE.value:
            tot_weight_util_sum += w_pct
            tot_vol_util_sum += v_pct
            active_truck_count += 1

        truck_util_summaries.append({
            "truck_id": t.truck_id,
            "truck_number": t.truck_number,
            "truck_model": t.truck_model,
            "status": t.status,
            "max_weight_kg": t.max_weight_kg,
            "max_volume_m3": t.max_volume_m3,
            "assigned_weight_kg": round(w, 2),
            "assigned_volume_m3": round(v, 4),
            "weight_utilization_pct": w_pct,
            "volume_utilization_pct": v_pct,
            "assigned_package_count": c
        })

    avg_w_util = round(tot_weight_util_sum / active_truck_count, 2) if active_truck_count > 0 else 0.0
    avg_v_util = round(tot_vol_util_sum / active_truck_count, 2) if active_truck_count > 0 else 0.0

    # Priority distribution
    prio_counts = (
        db.query(Package.priority, func.count(Package.package_id))
        .group_by(Package.priority)
        .all()
    )
    prio_dict = {p: count for p, count in prio_counts}

    # Delivery status distribution
    status_counts = (
        db.query(Package.status, func.count(Package.package_id))
        .group_by(Package.status)
        .all()
    )
    status_dict = {s: count for s, count in status_counts}

    # Recent Audit Activities
    recent_logs = (
        db.query(AuditLog)
        .order_by(AuditLog.audit_id.desc())
        .limit(8)
        .all()
    )
    recent_activities = [
        {
            "id": log.audit_id,
            "action": log.action,
            "entity": f"{log.entity_type} #{log.entity_id or ''}",
            "details": log.details,
            "created_at": log.created_at.isoformat()
        }
        for log in recent_logs
    ]

    return DashboardKpiResponse(
        total_trucks=total_trucks,
        available_trucks=available_trucks,
        total_packages=total_packages,
        assigned_packages=assigned_packages,
        unassigned_packages=unassigned_packages,
        average_weight_utilization_pct=avg_w_util,
        average_volume_utilization_pct=avg_v_util,
        high_priority_pending_packages=high_prio_pending,
        recent_activities=recent_activities,
        truck_utilization_summary=truck_util_summaries,
        priority_distribution=prio_dict,
        delivery_status_distribution=status_dict,
    )
