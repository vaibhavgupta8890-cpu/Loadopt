from app.models.truck import Truck, TruckStatus
from app.models.package import Package, PackagePriority, PackageStatus
from app.optimization.engine import OptimizationEngine
from app.optimization.delivery_sequencer import sequence_deliveries_nearest_neighbor, haversine_distance_km
from app.optimization.loading_order import compute_loading_order
from app.schemas.optimization import AssignedPackageDetail, DeliveryStopDetail

def test_optimization_weight_and_volume_constraints():
    # Truck: 1000 kg capacity, 5.0 m3 volume
    truck = Truck(
        truck_id=1,
        truck_number="TRK-TEST",
        truck_model="Small Hauler",
        max_weight_kg=1000.0,
        max_volume_m3=5.0,
        status=TruckStatus.AVAILABLE.value,
        starting_location="Delhi"
    )

    # Package 1: 600 kg, 2.0 m3 (Feasible)
    pkg1 = Package(
        package_id=101,
        description="Cargo A",
        weight_kg=600.0,
        length_cm=100.0,
        width_cm=100.0,
        height_cm=200.0,
        volume_m3=2.0,
        destination="Gurgaon",
        priority="HIGH",
        status="PENDING"
    )

    # Package 2: 500 kg, 2.0 m3 (Fits individually, but exceeds remaining weight 400kg)
    pkg2 = Package(
        package_id=102,
        description="Cargo B",
        weight_kg=500.0,
        length_cm=100.0,
        width_cm=100.0,
        height_cm=200.0,
        volume_m3=2.0,
        destination="Noida",
        priority="MEDIUM",
        status="PENDING"
    )

    # Package 3: 200 kg, 4.0 m3 (Weight fits, but exceeds remaining volume)
    pkg3 = Package(
        package_id=103,
        description="Cargo C",
        weight_kg=200.0,
        length_cm=200.0,
        width_cm=200.0,
        height_cm=100.0,
        volume_m3=4.0,
        destination="Faridabad",
        priority="LOW",
        status="PENDING"
    )

    engine = OptimizationEngine()
    result = engine.run_optimization([truck], [pkg1, pkg2, pkg3], run_id=1)

    # Package 1 should be assigned because of HIGH priority
    assert result.assigned_packages_count == 1
    assert result.trucks[0].assigned_packages[0].package_id == 101
    assert result.trucks[0].total_assigned_weight_kg == 600.0
    assert result.trucks[0].weight_utilization_pct == 60.0

    # Package 2 and 3 should be unassigned with diagnostic reasons
    assert result.unassigned_packages_count == 2
    unassigned_ids = [u.package_id for u in result.unassigned]
    assert 102 in unassigned_ids
    assert 103 in unassigned_ids

    pkg2_reason = next(u.reason for u in result.unassigned if u.package_id == 102)
    assert "weight" in pkg2_reason.lower()

def test_haversine_distance():
    # Distance between Delhi (28.6139, 77.2090) and Jaipur (26.9124, 75.7873) is approx 238 km
    dist = haversine_distance_km(28.6139, 77.2090, 26.9124, 75.7873)
    assert 230.0 <= dist <= 250.0

def test_loading_order_lifo_heuristic():
    stops = [
        DeliveryStopDetail(stop_number=1, destination="Gurgaon", estimated_leg_distance_km=30.0, package_count=1),
        DeliveryStopDetail(stop_number=2, destination="Jaipur", estimated_leg_distance_km=230.0, package_count=2),
    ]

    p_stop1 = AssignedPackageDetail(
        package_id=1, description="Delivery for Stop 1", weight_kg=100.0, volume_m3=0.5,
        destination="Gurgaon", priority="HIGH", loading_order=0, assignment_reason=""
    )
    p_stop2_heavy = AssignedPackageDetail(
        package_id=2, description="Heavy for Stop 2", weight_kg=800.0, volume_m3=1.0,
        destination="Jaipur", priority="MEDIUM", loading_order=0, assignment_reason=""
    )
    p_stop2_light = AssignedPackageDetail(
        package_id=3, description="Light for Stop 2", weight_kg=200.0, volume_m3=0.8,
        destination="Jaipur", priority="LOW", loading_order=0, assignment_reason=""
    )

    ordered = compute_loading_order([p_stop1, p_stop2_light, p_stop2_heavy], stops)

    # In LIFO loading order: Stop 2 packages loaded first (Load Order 1 & 2), Stop 1 loaded last (Load Order 3)
    # Between Stop 2 items, heavier item loaded first (Load Order 1)
    assert ordered[0].package_id == 2  # Heavy Stop 2
    assert ordered[0].loading_order == 1
    assert ordered[1].package_id == 3  # Light Stop 2
    assert ordered[1].loading_order == 2
    assert ordered[2].package_id == 1  # Stop 1
    assert ordered[2].loading_order == 3
