from app.models.truck import Truck
from app.models.package import Package
from app.models.optimization import Assignment, Route, AssignmentStatus

def test_tracking_package_by_id(client, db_session, viewer_headers):
    t = Truck(truck_number="TRK-TRK1", truck_model="Hauler", max_weight_kg=10000.0, max_volume_m3=40.0, status="AVAILABLE", starting_location="Delhi")
    p = Package(description="Vital Plasma Units", weight_kg=150.0, length_cm=50.0, width_cm=40.0, height_cm=30.0, volume_m3=0.06, destination="Gurgaon", priority="HIGH", status="ASSIGNED")
    db_session.add_all([t, p])
    db_session.flush()

    a = Assignment(optimization_run_id=1, truck_id=t.truck_id, package_id=p.package_id, loading_order=1, assignment_status="ACTIVE")
    db_session.add(a)
    db_session.commit()

    # Viewer queries package by ID
    response = client.get(f"/api/tracking/lookup?query={p.package_id}", headers=viewer_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "PACKAGE"
    assert data["package"]["package_id"] == p.package_id
    assert data["package"]["description"] == "Vital Plasma Units"
    assert data["truck"]["truck_number"] == "TRK-TRK1"

def test_tracking_truck_by_number(client, db_session, viewer_headers):
    t = Truck(truck_number="TRK-TRK2", truck_model="City Express", max_weight_kg=5000.0, max_volume_m3=20.0, status="AVAILABLE", starting_location="Delhi Hub")
    db_session.add(t)
    db_session.commit()

    response = client.get("/api/tracking/lookup?query=TRK-TRK2", headers=viewer_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "TRUCK"
    assert data["truck"]["truck_number"] == "TRK-TRK2"
    assert data["truck"]["truck_model"] == "City Express"

def test_tracking_not_found_returns_404(client, viewer_headers):
    response = client.get("/api/tracking/lookup?query=NON_EXISTENT_9999", headers=viewer_headers)
    assert response.status_code == 404
    assert "No matching truck registration" in response.json()["detail"]
