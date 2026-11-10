def test_create_truck_success(client, manager_headers):
    response = client.post("/api/trucks", json={
        "truck_number": "TRK-201",
        "truck_model": "Volvo FMX",
        "max_weight_kg": 15000.0,
        "max_volume_m3": 55.0,
        "status": "AVAILABLE",
        "starting_location": "Central Depot, Delhi"
    }, headers=manager_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["truck_number"] == "TRK-201"
    assert data["max_weight_kg"] == 15000.0

def test_duplicate_truck_number_rejected(client, manager_headers):
    # First create truck
    client.post("/api/trucks", json={
        "truck_number": "TRK-DUPLICATE",
        "truck_model": "Model A",
        "max_weight_kg": 5000.0,
        "max_volume_m3": 20.0,
        "status": "AVAILABLE",
        "starting_location": "Delhi"
    }, headers=manager_headers)

    # Second creation with identical number must fail
    response = client.post("/api/trucks", json={
        "truck_number": "TRK-DUPLICATE",
        "truck_model": "Model B",
        "max_weight_kg": 6000.0,
        "max_volume_m3": 25.0,
        "status": "AVAILABLE",
        "starting_location": "Delhi"
    }, headers=manager_headers)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_invalid_truck_capacity_rejected(client, manager_headers):
    response = client.post("/api/trucks", json={
        "truck_number": "TRK-INVALID",
        "truck_model": "Model C",
        "max_weight_kg": -100.0,  # Negative weight
        "max_volume_m3": 20.0,
        "status": "AVAILABLE",
        "starting_location": "Delhi"
    }, headers=manager_headers)
    assert response.status_code == 422  # Pydantic validation error

def test_package_auto_volume_calculation(client, manager_headers):
    # Length 200 cm, Width 100 cm, Height 150 cm -> 200*100*150 / 1,000,000 = 3.0 m3
    response = client.post("/api/packages", json={
        "description": "Medical Equipment Pallet",
        "weight_kg": 500.0,
        "length_cm": 200.0,
        "width_cm": 100.0,
        "height_cm": 150.0,
        "destination": "Gurgaon Sector 18",
        "priority": "HIGH",
        "status": "PENDING"
    }, headers=manager_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["volume_m3"] == 3.0
    assert data["weight_kg"] == 500.0
