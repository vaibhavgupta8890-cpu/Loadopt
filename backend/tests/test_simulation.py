from app.models.truck import Truck, TruckStatus
from app.models.package import Package, PackagePriority, PackageStatus
from app.models.optimization import Assignment, AssignmentStatus

def test_what_if_simulation_non_destructive(client, db_session, manager_headers):
    # Create 2 trucks and 3 packages in test DB
    t1 = Truck(truck_number="TRK-S1", truck_model="Model A", max_weight_kg=10000.0, max_volume_m3=40.0, status="AVAILABLE", starting_location="Delhi")
    t2 = Truck(truck_number="TRK-S2", truck_model="Model B", max_weight_kg=10000.0, max_volume_m3=40.0, status="AVAILABLE", starting_location="Delhi")
    db_session.add_all([t1, t2])

    p1 = Package(description="P1", weight_kg=2000.0, length_cm=100.0, width_cm=100.0, height_cm=100.0, volume_m3=1.0, destination="Delhi", priority="HIGH", status="PENDING")
    p2 = Package(description="P2", weight_kg=3000.0, length_cm=100.0, width_cm=100.0, height_cm=100.0, volume_m3=1.0, destination="Delhi", priority="HIGH", status="PENDING")
    db_session.add_all([p1, p2])
    db_session.commit()

    # Initial active assignment count must be 0
    init_assignments = db_session.query(Assignment).filter(Assignment.assignment_status == "ACTIVE").count()
    assert init_assignments == 0

    # Run What-If Simulation: Exclude TRK-S1
    response = client.post("/api/simulation/run", json={
        "scenario_type": "EXCLUDE_TRUCK",
        "excluded_truck_id": t1.truck_id
    }, headers=manager_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["scenario_type"] == "EXCLUDE_TRUCK"
    assert "simulated_result" in data

    # Verify that database was NOT modified (still 0 active assignments)
    post_assignments = db_session.query(Assignment).filter(Assignment.assignment_status == "ACTIVE").count()
    assert post_assignments == 0

def test_apply_simulation_plan(client, db_session, manager_headers):
    t = Truck(truck_number="TRK-APP1", truck_model="Model A", max_weight_kg=5000.0, max_volume_m3=20.0, status="AVAILABLE", starting_location="Delhi")
    p = Package(description="Cargo To Assign", weight_kg=1000.0, length_cm=100.0, width_cm=100.0, height_cm=100.0, volume_m3=1.0, destination="Delhi", priority="HIGH", status="PENDING")
    db_session.add_all([t, p])
    db_session.commit()

    # First run simulation
    sim_res = client.post("/api/simulation/run", json={
        "scenario_type": "URGENT_PACKAGE"
    }, headers=manager_headers).json()

    # Now apply plan
    apply_resp = client.post("/api/simulation/apply", json={
        "simulated_result": sim_res["simulated_result"],
        "persist_proposed_package": False
    }, headers=manager_headers)

    assert apply_resp.status_code == 200
    assert "applied successfully" in apply_resp.json()["message"]

    # Verify assignment exists in DB
    active_assign = db_session.query(Assignment).filter(Assignment.assignment_status == "ACTIVE").first()
    assert active_assign is not None
