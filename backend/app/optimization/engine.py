from typing import List, Dict, Optional, Tuple
from datetime import datetime
from app.models.truck import Truck, TruckStatus
from app.models.package import Package, PackagePriority, PackageStatus
from app.schemas.optimization import (
    TruckLoadResult,
    AssignedPackageDetail,
    UnassignedPackageDetail,
    OptimizationRunResponse,
)
from app.optimization.delivery_sequencer import sequence_deliveries_nearest_neighbor
from app.optimization.loading_order import compute_loading_order

class OptimizationEngine:
    """
    Constraint-aware heuristic optimization engine for multi-capacity vehicle loading.
    Enforces dual constraints: Weight Capacity (kg) and Volume Capacity (m3).
    Implements multi-objective scoring considering delivery priority, destination clustering,
    and capacity utilization.
    """

    def __init__(
        self,
        priority_weight: float = 1.5,
        destination_affinity_weight: float = 1.0,
        utilization_balance_weight: float = 1.0
    ):
        self.priority_weight = priority_weight
        self.destination_affinity_weight = destination_affinity_weight
        self.utilization_balance_weight = utilization_balance_weight

    def run_optimization(
        self,
        trucks: List[Truck],
        packages: List[Package],
        run_id: int = 1
    ) -> OptimizationRunResponse:
        warnings: List[str] = []

        # 1. Filter eligible trucks (must have status AVAILABLE and positive capacities)
        available_trucks = [t for t in trucks if t.status == TruckStatus.AVAILABLE.value and t.max_weight_kg > 0 and t.max_volume_m3 > 0]
        if not available_trucks:
            warnings.append("No trucks with AVAILABLE status in fleet. No packages could be assigned.")

        # 2. Filter eligible packages (PENDING or UNASSIGNED)
        eligible_packages = [p for p in packages if p.status in (PackageStatus.PENDING.value, "PENDING") and p.weight_kg > 0 and p.volume_m3 > 0]
        if not eligible_packages:
            warnings.append("No pending packages available for assignment.")

        # Priority score mapping
        priority_scores = {
            PackagePriority.HIGH.value: 30.0,
            "HIGH": 30.0,
            PackagePriority.MEDIUM.value: 20.0,
            "MEDIUM": 20.0,
            PackagePriority.LOW.value: 10.0,
            "LOW": 10.0,
        }

        # Calculate fleet average capacities for normalization
        avg_fleet_weight = sum(t.max_weight_kg for t in available_trucks) / len(available_trucks) if available_trucks else 10000.0
        avg_fleet_volume = sum(t.max_volume_m3 for t in available_trucks) / len(available_trucks) if available_trucks else 40.0

        # Sort packages: High priority first, then larger capacity footprint first (First-Fit Decreasing heuristic)
        def package_sort_key(p: Package):
            prio = priority_scores.get(p.priority, 15.0)
            footprint = (p.weight_kg / avg_fleet_weight) + (p.volume_m3 / avg_fleet_volume)
            # Earliest deadline if available
            deadline_val = p.requested_delivery_deadline.timestamp() if p.requested_delivery_deadline else 9999999999.0
            return (-prio, -footprint, deadline_val)

        sorted_packages = sorted(eligible_packages, key=package_sort_key)

        # Track truck state during allocation
        truck_state: Dict[int, Dict] = {}
        for t in available_trucks:
            truck_state[t.truck_id] = {
                "truck": t,
                "remaining_weight_kg": float(t.max_weight_kg),
                "remaining_volume_m3": float(t.max_volume_m3),
                "assigned_packages": [],
                "destinations": set(),
            }

        unassigned_list: List[UnassignedPackageDetail] = []
        assigned_count = 0

        # Max single-truck capacities in available fleet
        max_single_weight = max((t.max_weight_kg for t in available_trucks), default=0.0)
        max_single_volume = max((t.max_volume_m3 for t in available_trucks), default=0.0)

        # Process each package through constraint evaluation and scoring
        for pkg in sorted_packages:
            # Check absolute oversize constraint
            if pkg.weight_kg > max_single_weight and pkg.volume_m3 > max_single_volume:
                unassigned_list.append(
                    UnassignedPackageDetail(
                        package_id=pkg.package_id,
                        description=pkg.description,
                        weight_kg=pkg.weight_kg,
                        volume_m3=pkg.volume_m3,
                        destination=pkg.destination,
                        priority=pkg.priority,
                        reason=f"Exceeds fleet maximum limits: Weight ({pkg.weight_kg}kg > {max_single_weight}kg) AND Volume ({pkg.volume_m3}m³ > {max_single_volume}m³)."
                    )
                )
                continue

            if pkg.weight_kg > max_single_weight:
                unassigned_list.append(
                    UnassignedPackageDetail(
                        package_id=pkg.package_id,
                        description=pkg.description,
                        weight_kg=pkg.weight_kg,
                        volume_m3=pkg.volume_m3,
                        destination=pkg.destination,
                        priority=pkg.priority,
                        reason=f"Weight ({pkg.weight_kg} kg) exceeds maximum weight capacity of any available truck ({max_single_weight} kg)."
                    )
                )
                continue

            if pkg.volume_m3 > max_single_volume:
                unassigned_list.append(
                    UnassignedPackageDetail(
                        package_id=pkg.package_id,
                        description=pkg.description,
                        weight_kg=pkg.weight_kg,
                        volume_m3=pkg.volume_m3,
                        destination=pkg.destination,
                        priority=pkg.priority,
                        reason=f"Volume ({pkg.volume_m3} m³) exceeds maximum volume capacity of any available truck ({max_single_volume} m³)."
                    )
                )
                continue

            # Evaluate feasible trucks
            feasible_candidates = []
            for t_id, state in truck_state.items():
                if pkg.weight_kg <= state["remaining_weight_kg"] and pkg.volume_m3 <= state["remaining_volume_m3"]:
                    feasible_candidates.append(state)

            if not feasible_candidates:
                # Diagnose failure: find why no truck can take it
                max_rem_weight = max((s["remaining_weight_kg"] for s in truck_state.values()), default=0.0)
                max_rem_volume = max((s["remaining_volume_m3"] for s in truck_state.values()), default=0.0)
                
                if pkg.weight_kg > max_rem_weight:
                    reason = f"Exceeds remaining weight capacity of all active trucks (Max remaining: {max_rem_weight:.1f} kg)."
                elif pkg.volume_m3 > max_rem_volume:
                    reason = f"Exceeds remaining volume capacity of all active trucks (Max remaining: {max_rem_volume:.2f} m³)."
                else:
                    reason = "No single active truck has sufficient combined remaining weight and volume."

                unassigned_list.append(
                    UnassignedPackageDetail(
                        package_id=pkg.package_id,
                        description=pkg.description,
                        weight_kg=pkg.weight_kg,
                        volume_m3=pkg.volume_m3,
                        destination=pkg.destination,
                        priority=pkg.priority,
                        reason=reason
                    )
                )
                continue

            # Score feasible trucks using multi-criteria formula
            best_state = None
            best_score = -float("inf")
            assignment_notes = ""

            for state in feasible_candidates:
                t = state["truck"]
                # 1. Destination Affinity: Bonus if truck already visits this destination
                dest_affinity = 0.0
                if pkg.destination.strip().lower() in [d.lower() for d in state["destinations"]]:
                    dest_affinity = 25.0 * self.destination_affinity_weight

                # 2. Capacity Best-Fit: Prefer placing into truck to maximize dense utilization
                rem_w_ratio = (state["remaining_weight_kg"] - pkg.weight_kg) / t.max_weight_kg
                rem_v_ratio = (state["remaining_volume_m3"] - pkg.volume_m3) / t.max_volume_m3
                # Lower remaining ratio after assignment = tighter fit = higher score
                tightness_score = (2.0 - (rem_w_ratio + rem_v_ratio)) * 10.0 * self.utilization_balance_weight

                total_score = dest_affinity + tightness_score

                if total_score > best_score:
                    best_score = total_score
                    best_state = state
                    note_affinity = "Destination match" if dest_affinity > 0 else "Optimal capacity fit"
                    assignment_notes = f"Assigned to {t.truck_number} ({note_affinity}, Score: {total_score:.1f})"

            # Assign to best truck
            best_state["remaining_weight_kg"] -= pkg.weight_kg
            best_state["remaining_volume_m3"] -= pkg.volume_m3
            best_state["destinations"].add(pkg.destination)

            assigned_pkg_detail = AssignedPackageDetail(
                package_id=pkg.package_id,
                description=pkg.description,
                weight_kg=pkg.weight_kg,
                volume_m3=pkg.volume_m3,
                destination=pkg.destination,
                destination_latitude=pkg.destination_latitude,
                destination_longitude=pkg.destination_longitude,
                priority=pkg.priority,
                loading_order=0,  # Computed in next phase
                assignment_reason=assignment_notes
            )
            best_state["assigned_packages"].append(assigned_pkg_detail)
            assigned_count += 1

        # Build truck results, compute delivery sequences and loading orders
        truck_results: List[TruckLoadResult] = []
        total_assigned_fleet_weight = 0.0
        total_assigned_fleet_volume = 0.0
        total_fleet_capacity_weight = sum(t.max_weight_kg for t in available_trucks) if available_trucks else 1.0
        total_fleet_capacity_volume = sum(t.max_volume_m3 for t in available_trucks) if available_trucks else 1.0

        for t in available_trucks:
            state = truck_state[t.truck_id]
            assigned_pkgs = state["assigned_packages"]

            assigned_weight = round(sum(p.weight_kg for p in assigned_pkgs), 2)
            assigned_volume = round(sum(p.volume_m3 for p in assigned_pkgs), 4)
            weight_util = round((assigned_weight / t.max_weight_kg) * 100.0, 2)
            volume_util = round((assigned_volume / t.max_volume_m3) * 100.0, 2)

            total_assigned_fleet_weight += assigned_weight
            total_assigned_fleet_volume += assigned_volume

            # Compute delivery sequence using Nearest-Neighbor heuristic
            pkg_dicts = [
                {
                    "destination": p.destination,
                    "destination_latitude": p.destination_latitude,
                    "destination_longitude": p.destination_longitude,
                    "priority": p.priority,
                    "weight_kg": p.weight_kg
                }
                for p in assigned_pkgs
            ]
            stops, route_dist, travel_time = sequence_deliveries_nearest_neighbor(
                origin_location=t.starting_location,
                assigned_packages=pkg_dicts
            )

            # Compute physical loading order (LIFO reverse delivery stop + heavy bottom)
            ordered_pkgs = compute_loading_order(assigned_pkgs, stops)
            loading_seq = [p.package_id for p in ordered_pkgs]

            truck_results.append(
                TruckLoadResult(
                    truck_id=t.truck_id,
                    truck_number=t.truck_number,
                    truck_model=t.truck_model,
                    max_weight_kg=t.max_weight_kg,
                    max_volume_m3=t.max_volume_m3,
                    total_assigned_weight_kg=assigned_weight,
                    total_assigned_volume_m3=assigned_volume,
                    weight_utilization_pct=weight_util,
                    volume_utilization_pct=volume_util,
                    assigned_packages=ordered_pkgs,
                    loading_sequence=loading_seq,
                    delivery_stops=stops,
                    total_route_distance_km=route_dist
                )
            )

        overall_weight_util = round((total_assigned_fleet_weight / total_fleet_capacity_weight) * 100.0, 2)
        overall_volume_util = round((total_assigned_fleet_volume / total_fleet_capacity_volume) * 100.0, 2)

        return OptimizationRunResponse(
            run_id=run_id,
            algorithm_version="Heuristic-MultiKnapsack-v1.0",
            status="COMPLETED",
            total_packages=len(eligible_packages),
            assigned_packages_count=assigned_count,
            unassigned_packages_count=len(unassigned_list),
            overall_weight_utilization_pct=overall_weight_util,
            overall_volume_utilization_pct=overall_volume_util,
            trucks=truck_results,
            unassigned=unassigned_list,
            warnings=warnings,
            created_at=datetime.utcnow()
        )
