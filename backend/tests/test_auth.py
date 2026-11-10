def test_login_success(client):
    response = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "Admin@123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "ADMIN"
    assert data["token_type"] == "bearer"

def test_login_invalid_password(client):
    response = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "WrongPassword"})
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]

def test_get_current_user_profile(client, manager_headers):
    response = client.get("/api/auth/me", headers=manager_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "manager@test.com"
    assert response.json()["role"] == "LOGISTICS_MANAGER"

def test_role_authorization_viewer_forbidden(client, viewer_headers):
    # Viewer should be blocked from creating trucks
    response = client.post("/api/trucks", json={
        "truck_number": "TRK-999",
        "truck_model": "Test Truck",
        "max_weight_kg": 10000.0,
        "max_volume_m3": 40.0,
        "status": "AVAILABLE",
        "starting_location": "Delhi"
    }, headers=viewer_headers)
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]
