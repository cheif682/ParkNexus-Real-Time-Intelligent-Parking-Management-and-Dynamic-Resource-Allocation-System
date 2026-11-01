def test_register_user(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "newuser@parknexus.com",
        "password": "Password@123",
        "full_name": "New User",
        "phone_number": "+91 99999 88888"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "newuser@parknexus.com"
    assert data["role"] == "CUSTOMER"

def test_register_duplicate_email(client):
    client.post("/api/v1/auth/register", json={
        "email": "dup@parknexus.com",
        "password": "Password@123",
        "full_name": "User One"
    })
    res = client.post("/api/v1/auth/register", json={
        "email": "dup@parknexus.com",
        "password": "Password@456",
        "full_name": "User Two"
    })
    assert res.status_code == 400

def test_login_success(client):
    client.post("/api/v1/auth/register", json={
        "email": "login@parknexus.com",
        "password": "SecretPassword@123",
        "full_name": "Login Tester"
    })
    res = client.post("/api/v1/auth/login", json={
        "email": "login@parknexus.com",
        "password": "SecretPassword@123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "login@parknexus.com"

def test_login_invalid_password(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "login@parknexus.com",
        "password": "WrongPassword"
    })
    assert res.status_code == 401
