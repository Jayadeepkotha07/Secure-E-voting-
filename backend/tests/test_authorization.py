"""
Tests for role-based access control (RBAC).
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_rbac_admin_routes_forbidden_for_voters():
    """Verify standard voter token is rejected on administrative routes."""
    # Login as voter
    voter_login = client.post("/api/v1/auth/login", json={
        "email": "alice@university.edu",
        "password": "VoterAlice123!"
    })
    token = voter_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to access admin metrics
    res = client.get("/api/v1/admin/metrics", headers=headers)
    assert res.status_code == 403


def test_rbac_admin_routes_allowed_for_admin():
    """Verify admin token has full access to administrative routes."""
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@evoting.gov",
        "password": "AdminSecurePass123!"
    })
    token = admin_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/admin/metrics", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_elections"] >= 1
    assert data["registered_voters"] >= 1
