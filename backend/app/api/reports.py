import io
import csv
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.truck import Truck
from app.models.package import Package
from app.models.optimization import Assignment, AssignmentStatus
from app.models.user import User
from app.schemas.report import ReportSummaryResponse
from app.security import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports & Analytics"])

@router.get("/summary", response_model=ReportSummaryResponse)
def get_report_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns aggregated reports with truck and package records."""
    trucks = db.query(Truck).all()
    packages = db.query(Package).all()
    active_assignments = db.query(Assignment).filter(Assignment.assignment_status == AssignmentStatus.ACTIVE.value).all()

    truck_records = []
    tot_w_util = 0.0
    tot_v_util = 0.0
    valid_trucks = 0

    for t in trucks:
        stats = (
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
        w = float(stats.w) if stats else 0.0
        v = float(stats.v) if stats else 0.0
        c = int(stats.c) if stats else 0

        w_pct = round((w / t.max_weight_kg) * 100.0, 2) if t.max_weight_kg > 0 else 0.0
        v_pct = round((v / t.max_volume_m3) * 100.0, 2) if t.max_volume_m3 > 0 else 0.0

        if t.max_weight_kg > 0:
            tot_w_util += w_pct
            tot_v_util += v_pct
            valid_trucks += 1

        truck_records.append({
            "truck_id": t.truck_id,
            "truck_number": t.truck_number,
            "model": t.truck_model,
            "status": t.status,
            "max_weight_kg": t.max_weight_kg,
            "max_volume_m3": t.max_volume_m3,
            "assigned_weight_kg": round(w, 2),
            "assigned_volume_m3": round(v, 4),
            "weight_utilization_pct": w_pct,
            "volume_utilization_pct": v_pct,
            "assigned_packages": c
        })

    package_records = [
        {
            "package_id": p.package_id,
            "description": p.description,
            "weight_kg": p.weight_kg,
            "volume_m3": p.volume_m3,
            "destination": p.destination,
            "priority": p.priority,
            "status": p.status,
            "deadline": p.requested_delivery_deadline.isoformat() if p.requested_delivery_deadline else "None"
        }
        for p in packages
    ]

    avg_w = round(tot_w_util / valid_trucks, 2) if valid_trucks > 0 else 0.0
    avg_v = round(tot_v_util / valid_trucks, 2) if valid_trucks > 0 else 0.0

    return ReportSummaryResponse(
        generated_at=datetime.utcnow(),
        truck_count=len(trucks),
        package_count=len(packages),
        active_assignments_count=len(active_assignments),
        avg_weight_utilization=avg_w,
        avg_volume_utilization=avg_v,
        truck_records=truck_records,
        package_records=package_records
    )

@router.get("/export/trucks")
def export_trucks_csv(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Exports truck fleet utilization records to CSV."""
    trucks = db.query(Truck).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Truck ID", "Truck Number", "Model", "Status",
        "Max Weight (kg)", "Max Volume (m3)",
        "Assigned Weight (kg)", "Assigned Volume (m3)",
        "Weight Util %", "Volume Util %"
    ])

    for t in trucks:
        stats = (
            db.query(
                func.coalesce(func.sum(Package.weight_kg), 0.0).label("w"),
                func.coalesce(func.sum(Package.volume_m3), 0.0).label("v")
            )
            .join(Assignment, Assignment.package_id == Package.package_id)
            .filter(
                Assignment.truck_id == t.truck_id,
                Assignment.assignment_status == AssignmentStatus.ACTIVE.value
            )
            .first()
        )
        w = float(stats.w) if stats else 0.0
        v = float(stats.v) if stats else 0.0
        w_pct = round((w / t.max_weight_kg) * 100.0, 2) if t.max_weight_kg > 0 else 0.0
        v_pct = round((v / t.max_volume_m3) * 100.0, 2) if t.max_volume_m3 > 0 else 0.0

        writer.writerow([
            t.truck_id, t.truck_number, t.truck_model, t.status,
            t.max_weight_kg, t.max_volume_m3,
            round(w, 2), round(v, 4),
            w_pct, v_pct
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=loadopt_trucks_report.csv"}
    )

@router.get("/export/packages")
def export_packages_csv(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Exports package inventory records to CSV."""
    packages = db.query(Package).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Package ID", "Description", "Weight (kg)", "Length (cm)", "Width (cm)", "Height (cm)",
        "Volume (m3)", "Destination", "Priority", "Status"
    ])

    for p in packages:
        writer.writerow([
            p.package_id, p.description, p.weight_kg, p.length_cm, p.width_cm, p.height_cm,
            p.volume_m3, p.destination, p.priority, p.status
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=loadopt_packages_report.csv"}
    )

@router.get("/export/assignments")
def export_assignments_csv(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Exports active package-to-truck assignments to CSV."""
    assignments = (
        db.query(Assignment)
        .filter(Assignment.assignment_status == AssignmentStatus.ACTIVE.value)
        .all()
    )
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Assignment ID", "Optimization Run ID", "Truck Number", "Package ID", "Description",
        "Weight (kg)", "Volume (m3)", "Destination", "Loading Order", "Status"
    ])

    for a in assignments:
        t_num = a.truck.truck_number if a.truck else "N/A"
        p_desc = a.package.description if a.package else "N/A"
        p_w = a.package.weight_kg if a.package else 0.0
        p_v = a.package.volume_m3 if a.package else 0.0
        p_dest = a.package.destination if a.package else "N/A"

        writer.writerow([
            a.assignment_id, a.optimization_run_id, t_num, a.package_id, p_desc,
            p_w, p_v, p_dest, a.loading_order, a.assignment_status
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=loadopt_assignments_report.csv"}
    )
