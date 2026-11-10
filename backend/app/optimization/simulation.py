import copy
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.truck import Truck, TruckStatus
from app.models.package import Package, PackageStatus
from app.models.optimization import OptimizationRun, Assignment, Delivery, Route, AssignmentStatus, RunStatus
from app.models.audit import AuditLog
from app.schemas.simulation import (
    SimulationRequest,
    SimulationComparisonResponse,
    ApplySimulationPlanRequest,
    ProposedPackage,
)
from app.optimization.engine import OptimizationEngine

def run_what_if_simulation(db: Session, request: SimulationRequest) -> SimulationComparisonResponse:
    """
    Executes an in-memory, non-destructive What-If scenario.
    Does NOT modify the production database.
    """
    # 1. Load actual trucks and packages from database
    db_trucks = db.query(Truck).all()
    # For simulation, we include all pending packages, plus packages currently assigned to test re-optimization
    db_packages = db.query(Package).filter(Package.status.in_([PackageStatus.PENDING.value, PackageStatus.ASSIGNED.value])).all()

    # Create isolated in-memory copies
    sim_trucks = [
        Truck(
            truck_id=t.truck_id,
            truck_number=t.truck_number,
            truck_model=t.truck_model,
            max_weight_kg=t.max_weight_kg,
            max_volume_m3=t.max_volume_m3,
            status=t.status,
            starting_location=t.starting_location,
        )
        for t in db_trucks
    ]

    sim_packages = [
        Package(
            package_id=p.package_id,
            description=p.description,
            weight_kg=p.weight_kg,
            length_cm=p.length_cm,
            width_cm=p.width_cm,
            height_cm=p.height_cm,
            volume_m3=p.volume_m3,
            destination=p.destination,
            destination_latitude=p.destination_latitude,
            destination_longitude=p.destination_longitude,
            priority=p.priority,
            status=PackageStatus.PENDING.value,  # Mark pending in simulation to allow free re-allocation
            requested_delivery_deadline=p.requested_delivery_deadline
        )
        for p in db_packages
    ]

    # Establish baseline calculation with default engine
    engine = OptimizationEngine()
    baseline_result = engine.run_optimization(sim_trucks, sim_packages, run_id=0)

    # Apply Scenario Transformations
    scenario_desc = ""
    if request.scenario_type == "EXCLUDE_TRUCK":
        excluded_id = request.excluded_truck_id
        target_truck = next((t for t in sim_trucks if t.truck_id == excluded_id), None)
        if target_truck:
            target_truck.status = TruckStatus.OUT_OF_SERVICE.value
            scenario_desc = f"Truck {target_truck.truck_number} removed from service."
        else:
            scenario_desc = "Selected truck not found; proceeding with current fleet."

    elif request.scenario_type == "URGENT_PACKAGE":
        if request.proposed_package:
            pkg_data = request.proposed_package
            vol = round((pkg_data.length_cm * pkg_data.width_cm * pkg_data.height_cm) / 1_000_000.0, 4)
            urgent_pkg = Package(
                package_id=999999,  # Virtual temporary ID
                description=f"[SIMULATED URGENT] {pkg_data.description}",
                weight_kg=pkg_data.weight_kg,
                length_cm=pkg_data.length_cm,
                width_cm=pkg_data.width_cm,
                height_cm=pkg_data.height_cm,
                volume_m3=vol,
                destination=pkg_data.destination,
                priority="HIGH",
                status=PackageStatus.PENDING.value,
                created_at=datetime.utcnow()
            )
            sim_packages.insert(0, urgent_pkg)
            scenario_desc = f"Added urgent high-priority package: '{pkg_data.description}' ({pkg_data.weight_kg}kg, {vol}m³ to {pkg_data.destination})."

    elif request.scenario_type == "REDUCE_CAPACITY":
        red_id = request.reduced_capacity_truck_id
        pct = request.capacity_reduction_pct or 50.0
        target_truck = next((t for t in sim_trucks if t.truck_id == red_id), None)
        if target_truck:
            scale = max(0.1, (100.0 - pct) / 100.0)
            target_truck.max_weight_kg = round(target_truck.max_weight_kg * scale, 2)
            target_truck.max_volume_m3 = round(target_truck.max_volume_m3 * scale, 2)
            scenario_desc = f"Reduced capacity of {target_truck.truck_number} by {pct:.0f}% (Weight: {target_truck.max_weight_kg}kg, Vol: {target_truck.max_volume_m3}m³)."

    # Run revised optimization with transformed state
    sim_result = engine.run_optimization(sim_trucks, sim_packages, run_id=0)

    # Compute deltas
    baseline_unassigned_ids = {u.package_id for u in baseline_result.unassigned}
    sim_unassigned_ids = {u.package_id for u in sim_result.unassigned}
    newly_unassigned = [
        u.description for u in sim_result.unassigned if u.package_id not in baseline_unassigned_ids
    ]

    delta = {
        "assigned_change": sim_result.assigned_packages_count - baseline_result.assigned_packages_count,
        "unassigned_change": sim_result.unassigned_packages_count - baseline_result.unassigned_packages_count,
        "weight_util_change_pct": round(sim_result.overall_weight_utilization_pct - baseline_result.overall_weight_utilization_pct, 2),
        "volume_util_change_pct": round(sim_result.overall_volume_utilization_pct - baseline_result.overall_volume_utilization_pct, 2),
    }

    # Formulation of human-readable impact summary
    assigned_diff = delta["assigned_change"]
    if request.scenario_type == "EXCLUDE_TRUCK":
        if newly_unassigned:
            impact_text = f"Excluding truck displaced {len(newly_unassigned)} packages that cannot fit in remaining active trucks: {', '.join(newly_unassigned[:3])}."
        else:
            impact_text = "All packages were successfully absorbed and redistributed among the remaining active fleet!"
    elif request.scenario_type == "URGENT_PACKAGE":
        urgent_assigned = any(p.package_id == 999999 for t in sim_result.trucks for p in t.assigned_packages)
        if urgent_assigned:
            assigned_truck = next(t.truck_number for t in sim_result.trucks if any(p.package_id == 999999 for p in t.assigned_packages))
            impact_text = f"Urgent package was successfully allocated to truck {assigned_truck}."
        else:
            impact_text = "Urgent package could NOT fit into available capacity without displacing existing loads."
    else:
        impact_text = f"Capacity reduction resulted in {sim_result.overall_weight_utilization_pct}% fleet weight utilization."

    return SimulationComparisonResponse(
        scenario_type=request.scenario_type,
        original_run_id=None,
        original_summary={
            "total_packages": baseline_result.total_packages,
            "assigned_packages": baseline_result.assigned_packages_count,
            "unassigned_packages": baseline_result.unassigned_packages_count,
            "overall_weight_utilization_pct": baseline_result.overall_weight_utilization_pct,
            "overall_volume_utilization_pct": baseline_result.overall_volume_utilization_pct,
        },
        simulated_summary={
            "total_packages": sim_result.total_packages,
            "assigned_packages": sim_result.assigned_packages_count,
            "unassigned_packages": sim_result.unassigned_packages_count,
            "overall_weight_utilization_pct": sim_result.overall_weight_utilization_pct,
            "overall_volume_utilization_pct": sim_result.overall_volume_utilization_pct,
        },
        delta=delta,
        simulated_result=sim_result,
        impact_summary=f"{scenario_desc} {impact_text}",
        reassigned_packages_count=abs(assigned_diff),
        newly_unassigned_packages=newly_unassigned,
    )

def apply_simulation_plan(db: Session, request: ApplySimulationPlanRequest, user_id: Optional[int] = None) -> OptimizationRun:
    """
    Applies the simulated plan to the production database within an atomic ACID transaction.
    Archives previous active assignments and inserts the revised state.
    """
    try:
        # 1. If proposed package is requested to be persisted, create it in DB
        created_pkg_id_map = {}
        if request.persist_proposed_package and request.proposed_package:
            p = request.proposed_package
            vol = round((p.length_cm * p.width_cm * p.height_cm) / 1_000_000.0, 4)
            db_new_pkg = Package(
                description=p.description,
                weight_kg=p.weight_kg,
                length_cm=p.length_cm,
                width_cm=p.width_cm,
                height_cm=p.height_cm,
                volume_m3=vol,
                destination=p.destination,
                priority=p.priority,
                status=PackageStatus.PENDING.value
            )
            db.add(db_new_pkg)
            db.flush()
            created_pkg_id_map[999999] = db_new_pkg.package_id

        # 2. Archive all currently ACTIVE assignments
        active_assignments = db.query(Assignment).filter(Assignment.assignment_status == AssignmentStatus.ACTIVE.value).all()
        for a in active_assignments:
            a.assignment_status = AssignmentStatus.HISTORICAL.value

        # Reset packages previously assigned to PENDING so state remains sound
        db.query(Package).filter(Package.status == PackageStatus.ASSIGNED.value).update({"status": PackageStatus.PENDING.value})

        # 3. Create new OptimizationRun record
        sim_res = request.simulated_result
        new_run = OptimizationRun(
            created_by_id=user_id,
            algorithm_version="Heuristic-WhatIfSimulation-v1.0",
            status=RunStatus.COMPLETED.value,
            total_packages=sim_res.total_packages,
            assigned_packages=sim_res.assigned_packages_count,
            unassigned_packages=sim_res.unassigned_packages_count,
            notes="Applied from What-If simulation plan."
        )
        db.add(new_run)
        db.flush()

        # 4. Insert new assignments, routes, and deliveries
        for t_res in sim_res.trucks:
            for pkg_detail in t_res.assigned_packages:
                actual_pkg_id = created_pkg_id_map.get(pkg_detail.package_id, pkg_detail.package_id)
                # Ensure package exists in DB
                db_pkg = db.query(Package).filter(Package.package_id == actual_pkg_id).first()
                if not db_pkg:
                    continue

                assignment = Assignment(
                    optimization_run_id=new_run.optimization_run_id,
                    truck_id=t_res.truck_id,
                    package_id=actual_pkg_id,
                    loading_order=pkg_detail.loading_order,
                    assignment_status=AssignmentStatus.ACTIVE.value
                )
                db.add(assignment)
                db_pkg.status = PackageStatus.ASSIGNED.value

            # Save route
            if t_res.delivery_stops:
                import json
                stops_json = json.dumps([s.model_dump() for s in t_res.delivery_stops])
                route = Route(
                    truck_id=t_res.truck_id,
                    optimization_run_id=new_run.optimization_run_id,
                    source="Central Logistics Depot, Delhi",
                    destination_sequence=stops_json,
                    total_distance_km=t_res.total_route_distance_km,
                    estimated_travel_time_hours=round(t_res.total_route_distance_km / 50.0 + len(t_res.delivery_stops) * 0.5, 2)
                )
                db.add(route)

        # 5. Audit Log entry
        audit = AuditLog(
            user_id=user_id,
            action="APPLY_SIMULATION_PLAN",
            entity_type="OPTIMIZATION_RUN",
            entity_id=str(new_run.optimization_run_id),
            details=f"Successfully applied revised plan with {sim_res.assigned_packages_count} assignments."
        )
        db.add(audit)

        db.commit()
        db.refresh(new_run)
        return new_run

    except Exception as e:
        db.rollback()
        raise e
