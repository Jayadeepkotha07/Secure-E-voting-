"""
Tests for authentication, Argon2id hashing, and email verification.
"""

import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.user import User

client = TestClient(app)


def test_register_and_verify_email():
    """Verify voter registration and email token verification flow."""
    unique_id = uuid.uuid4().hex[:8]
    email = f"testvoter_{unique_id}@university.edu"
    reg_res = client.post("/api/v1/auth/register", json={
        "name": f"New Voter {unique_id}",
        "email": email,
        "password": "StrongPassword123!"
    })
    assert reg_res.status_code == 201
    user_data = reg_res.json()
    assert user_data["email"] == email
    assert user_data["email_verified"] is False

    # Retrieve verification token from DB
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    token = user.verification_token
    db.close()

    # Verify with wrong token fails
    bad_verify = client.post("/api/v1/auth/verify-email", json={
        "email": email,
        "token": "000000"
    })
    assert bad_verify.status_code == 400

    # Verify with correct token succeeds
    good_verify = client.post("/api/v1/auth/verify-email", json={
        "email": email,
        "token": token
    })
    assert good_verify.status_code == 200
    assert good_verify.json()["email_verified"] is True


def test_login_argon2_verification():
    """Verify login authentication using Argon2id password hash."""
    # Succeeded login
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@evoting.gov",
        "password": "AdminSecurePass123!"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"

    # Failed password login
    res_bad = client.post("/api/v1/auth/login", json={
        "email": "admin@evoting.gov",
        "password": "WrongPassword999!"
    })
    assert res_bad.status_code == 401
