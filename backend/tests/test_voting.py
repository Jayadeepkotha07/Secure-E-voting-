"""
Tests for voting workflow, double-vote rejection, email verification check, and public verification.
"""

import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import hash_password

client = TestClient(app)


def test_voting_flow_and_double_voting_prevention():
    """Verify voting by eligible voter and subsequent rejection of duplicate ballots."""
    # Create a fresh verified voter
    unique_voter_email = f"voter_{uuid.uuid4().hex[:8]}@university.edu"
    db = SessionLocal()
    fresh_voter = User(
        name="Test Voter Charlie",
        email=unique_voter_email,
        password_hash=hash_password("VoterPassword123!"),
        role="voter",
        email_verified=True,
        account_status="active"
    )
    db.add(fresh_voter)
    db.commit()
    db.close()

    # Login as this fresh verified voter
    login_res = client.post("/api/v1/auth/login", json={
        "email": unique_voter_email,
        "password": "VoterPassword123!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Retrieve election 1 and candidates
    elec_res = client.get("/api/v1/elections/1")
    assert elec_res.status_code == 200
    candidates = elec_res.json()["candidates"]
    assert len(candidates) >= 1
    cand_id = candidates[0]["id"]

    # Cast vote
    vote_res = client.post(
        "/api/v1/voting/cast",
        headers=headers,
        json={"election_id": 1, "candidate_id": cand_id}
    )
    assert vote_res.status_code == 201
    vote_data = vote_res.json()
    public_vote_id = vote_data["public_vote_id"]
    assert public_vote_id.startswith("VOTE-")

    # Attempt to cast vote a SECOND time -> Must be rejected with 409
    dup_res = client.post(
        "/api/v1/voting/cast",
        headers=headers,
        json={"election_id": 1, "candidate_id": cand_id}
    )
    assert dup_res.status_code == 409

    # Public Verification of the newly cast vote
    verify_res = client.post("/api/v1/verification/verify", json={"public_vote_id": public_vote_id})
    assert verify_res.status_code == 200
    v_info = verify_res.json()
    assert v_info["is_recorded"] is True
    assert v_info["is_valid"] is True
    assert v_info["merkle_inclusion_verified"] is True
    assert v_info["signature_verified"] is True
    assert v_info["hash_integrity_verified"] is True
    # Crucial security check: candidate_id is NEVER in public verification response!
    assert "candidate_id" not in v_info
    assert "candidate" not in v_info


def test_unverified_voter_cannot_vote():
    """Verify that unverified voter is rejected when attempting to cast a ballot."""
    # Create fresh unverified voter
    unique_unverified_email = f"unverified_{uuid.uuid4().hex[:8]}@university.edu"
    db = SessionLocal()
    unverified_voter = User(
        name="Unverified Voter Dave",
        email=unique_unverified_email,
        password_hash=hash_password("UnverifiedPassword123!"),
        role="voter",
        email_verified=False,
        verification_token="654321",
        account_status="active"
    )
    db.add(unverified_voter)
    db.commit()
    db.close()

    login_res = client.post("/api/v1/auth/login", json={
        "email": unique_unverified_email,
        "password": "UnverifiedPassword123!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    vote_res = client.post(
        "/api/v1/voting/cast",
        headers=headers,
        json={"election_id": 1, "candidate_id": 1}
    )
    assert vote_res.status_code == 403
    assert "email is not verified" in vote_res.json()["detail"].lower()
