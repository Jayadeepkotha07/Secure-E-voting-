"""
Tests for administrative tamper detection sandbox and failure diagnostics.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_tamper_detection_sandbox_workflow():
    """Verify test record provisioning, controlled mutation, tamper detection, and clean reset."""
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@evoting.gov",
        "password": "AdminSecurePass123!"
    })
    token = admin_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Provision test record
    seed_res = client.post("/api/v1/admin/tamper-demo/seed-test-record", headers=headers)
    assert seed_res.status_code == 200
    rec = seed_res.json()
    assert rec["status"] == "valid"

    # 2. Mutate ciphertext
    mutate_res = client.post("/api/v1/admin/tamper-demo/simulate", headers=headers, json={
        "mutation_type": "ciphertext_byte_flip"
    })
    assert mutate_res.status_code == 200
    sim_data = mutate_res.json()
    assert sim_data["is_tampered_flag_set"] is True
    assert "MAC" in sim_data["verification_check_failed"] or "Tag" in sim_data["verification_check_failed"]

    # 3. Mutate salt
    mutate_salt = client.post("/api/v1/admin/tamper-demo/simulate", headers=headers, json={
        "mutation_type": "salt_mutation"
    })
    assert mutate_salt.status_code == 200
    assert "Salt" in mutate_salt.json()["failure_details"] or "Tag" in mutate_salt.json()["verification_check_failed"]

    # 4. Clean reset
    reset_res = client.post("/api/v1/admin/tamper-demo/reset", headers=headers)
    assert reset_res.status_code == 200
    assert reset_res.json()["record"]["status"] == "valid"
