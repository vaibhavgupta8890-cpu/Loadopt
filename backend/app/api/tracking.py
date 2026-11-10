import json
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.truck import Truck
from app.models.package import Package
from app.models.optimization import Assignment, AssignmentStatus, Delivery, Route
from app.models.user import User
from app.security import get_current_user

router = APIRouter(prefix="/api/tracking", tags=["Delivery & Cargo Tracking"])

def _build_package_tracking_response(package: Package, db: Session):
    # Find active assignment for this package
    active_assignment = (
        db.query(Assignment)
        .filter(
            Assignment.package_id == package.package_id,
            Assignment.assignment_status == AssignmentStatus.ACTIVE.value
        )
        .first()
    )

    truck_info = None
    delivery_info = None
    route_stops = []

    if active_assignment and active_assignment.truck:
        t = active_assignment.truck
        truck_info = {
            "truck_id": t.truck_id,
            "truck_number": t.truck_number,
            "truck_model": t.truck_model,
            "status": t.status,
            "starting_location": t.starting_location,
        }

        route = (
            db.query(Route)
            .filter(Route.truck_id == t.truck_id)
            .order_by(Route.route_id.desc())
            .first()
        )
        if route and route.destination_sequence:
            try:
                route_stops = json.loads(route.destination_sequence)
            except Exception:
                route_stops = []

        dest_lower = package.destination.strip().lower()
        matching_stop = next(
            (s for s in route_stops if s.get("destination", "").strip().lower() == dest_lower),
            None
        )

        delivery_info = {
            "loading_order": active_assignment.loading_order,
            "stop_number": matching_stop.get("stop_number", 1) if matching_stop else 1,
            "estimated_distance_km": matching_stop.get("estimated_leg_distance_km", 0.0) if matching_stop else 0.0,
        }

    return {
        "type": "PACKAGE",
        "found": True,
        "package": {
            "package_id": package.package_id,
            "description": package.description,
            "weight_kg": package.weight_kg,
            "volume_m3": package.volume_m3,
            "destination": package.destination,
            "priority": package.priority,
            "status": package.status,
            "requested_deadline": package.requested_delivery_deadline.isoformat() if package.requested_delivery_deadline else None,
        },
        "truck": truck_info,
        "delivery": delivery_info,
        "route_stops": route_stops,
    }

def _build_truck_tracking_response(truck: Truck, db: Session):
    active_assignments = (
        db.query(Assignment)
        .filter(
            Assignment.truck_id == truck.truck_id,
            Assignment.assignment_status == AssignmentStatus.ACTIVE.value
        )
        .order_by(Assignment.loading_order.asc())
        .all()
    )

    route = (
        db.query(Route)
        .filter(Route.truck_id == truck.truck_id)
        .order_by(Route.route_id.desc())
        .first()
    )

    stops = []
    if route and route.destination_sequence:
        try:
            stops = json.loads(route.destination_sequence)
        except Exception:
            stops = []

    packages_manifest = [
        {
            "package_id": a.package.package_id,
            "description": a.package.description,
            "destination": a.package.destination,
            "weight_kg": a.package.weight_kg,
            "volume_m3": a.package.volume_m3,
            "priority": a.package.priority,
            "status": a.package.status,
            "loading_order": a.loading_order,
        }
        for a in active_assignments if a.package
    ]

    return {
        "type": "TRUCK",
        "found": True,
        "truck": {
            "truck_id": truck.truck_id,
            "truck_number": truck.truck_number,
            "truck_model": truck.truck_model,
            "status": truck.status,
            "starting_location": truck.starting_location,
            "total_assigned_packages": len(packages_manifest),
        },
        "route": {
            "source": route.source if route else truck.starting_location,
            "total_distance_km": route.total_distance_km if route else 0.0,
            "estimated_travel_time_hours": route.estimated_travel_time_hours if route else 0.0,
            "stops": stops,
        },
        "manifest": packages_manifest,
    }

@router.get("/lookup")
def track_shipment_or_truck(
    query: str = Query(..., min_length=1, description="Package ID (e.g. 1 or #1) or Truck Number (e.g. TRK-101)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Tracking lookup for Viewers and Customers.
    Allows searching by Package ID, Package Description, or Truck Registration Number.
    """
    clean_query = query.strip().lstrip("#")

    # 1. If numeric, check Package by ID first
    if clean_query.isdigit():
        package = db.query(Package).filter(Package.package_id == int(clean_query)).first()
        if package:
            return _build_package_tracking_response(package, db)

    # 2. Check Truck by exact or prefixed number (e.g. TRK-101, TRK-TRK1)
    truck = db.query(Truck).filter(
        (Truck.truck_number.ilike(clean_query)) | (Truck.truck_number.ilike(f"%{clean_query}"))
    ).first()
    if truck:
        return _build_truck_tracking_response(truck, db)

    # 3. Check Package by description substring
    package = db.query(Package).filter(Package.description.ilike(f"%{clean_query}%")).first()
    if package:
        return _build_package_tracking_response(package, db)

    # 4. Not found
    raise HTTPException(
        status_code=404,
        detail=f"No matching truck registration ('{query}') or package shipment ID found. Please check and try again."
    )
