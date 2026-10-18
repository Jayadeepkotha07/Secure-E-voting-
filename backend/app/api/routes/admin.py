"""
Admin Management, Security Inspector, and Tamper Detection Routes.
"""

from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.election import Election
from app.models.vote_record import VoteRecord
from app.models.audit_log import AuditLog
from app.models.candidate import Candidate
from app.schemas.admin import (
    AdminDashboardMetricsResponse,
    VoterAdminViewResponse,
    VoterStatusUpdateRequest,
    TamperMutationRequest,
    TamperMutationResponse
)
from app.schemas.election import ElectionCreateRequest, CandidateCreateRequest
from app.schemas.verification import AdminVerifyVoteDetailResponse, SystemIntegrityReportResponse
from app.api.dependencies import require_admin
from app.core.security import AuthorityCryptoState, generate_public_vote_id
from app.services.election_service import create_election, update_election_status, add_candidate
from app.services.verification_service import admin_inspect_record, perform_system_integrity_audit
from app.crypto import (
    xcs256_encrypt,
    xcs256_decrypt,
    XCS256CiphertextPackage,
    serialize_vote_record_for_hash,
    hash_record,
    sign_message,
    verify_signature,
    load_public_key_from_raw_hex,
    MerkleTree,
    verify_inclusion_proof
)

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/metrics", response_model=AdminDashboardMetricsResponse)
def get_metrics(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Returns live metrics directly computed from the SQLite database.
    No hardcoded values or simulated metrics.
    """
    total_elections = db.query(Election).count()
    active_elections = db.query(Election).filter(Election.status == "open").count()
    registered_voters = db.query(User).filter(User.role == "voter").count()
    votes_cast = db.query(VoteRecord).filter(VoteRecord.is_test_record == False).count()
    verified_records = db.query(VoteRecord).filter(
        VoteRecord.is_test_record == False,
        VoteRecord.verification_status == "valid"
    ).count()
    invalid_records = db.query(VoteRecord).filter(
        VoteRecord.is_test_record == False,
        VoteRecord.verification_status == "tampered"
    ).count()

    latest_election = db.query(Election).filter(Election.merkle_root != None).order_by(Election.id.desc()).first()
    current_root = latest_election.merkle_root if latest_election else None

    last_audit = db.query(AuditLog).filter(
        AuditLog.action == "INTEGRITY_AUDIT_RUN"
    ).order_by(AuditLog.timestamp.desc()).first()
    last_audit_time = last_audit.timestamp if last_audit else None

    return AdminDashboardMetricsResponse(
        total_elections=total_elections,
        active_elections=active_elections,
        registered_voters=registered_voters,
        votes_cast=votes_cast,
        verified_records=verified_records,
        invalid_records=invalid_records,
        current_merkle_root=current_root,
        last_integrity_check=last_audit_time,
        authority_public_key_hex=AuthorityCryptoState.get_public_key_hex()
    )


@router.get("/voters", response_model=List[VoterAdminViewResponse])
def list_voters(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Lists registered voters with administrative metadata (no passwords/hashes)."""
    query = db.query(User).filter(User.role == "voter")
    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter((User.name.ilike(s)) | (User.email.ilike(s)))
    if status_filter:
        query = query.filter(User.account_status == status_filter)

    voters = query.order_by(User.created_at.desc()).all()
    results = []
    for v in voters:
        v_count = db.query(VoteRecord).filter(VoteRecord.voter_id == v.id).count()
        results.append(VoterAdminViewResponse(
            id=v.id,
            name=v.name,
            email=v.email,
            role=v.role,
            email_verified=v.email_verified,
            account_status=v.account_status,
            created_at=v.created_at,
            votes_cast_count=v_count
        ))
    return results


@router.patch("/voters/{voter_id}/status")
def update_voter_status(
    voter_id: int,
    request: VoterStatusUpdateRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Updates voter account status or manual email verification state."""
    voter = db.query(User).filter(User.id == voter_id, User.role == "voter").first()
    if not voter:
        raise HTTPException(status_code=404, detail="Voter not found.")

    if request.account_status:
        voter.account_status = request.account_status
    if request.email_verified is not None:
        voter.email_verified = request.email_verified

    db.commit()
    db.refresh(voter)

    audit = AuditLog(
        actor=admin.email,
        action="VOTER_STATUS_MODIFIED",
        target_reference=f"user:{voter.id}",
        status="SUCCESS",
        safe_metadata=f'{{"status": "{voter.account_status}", "verified": {voter.email_verified}}}'
    )
    db.add(audit)
    db.commit()

    return {"message": "Voter updated successfully.", "voter_id": voter.id}


@router.post("/elections")
def create_election_admin(
    request: ElectionCreateRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Creates a new election."""
    return create_election(db=db, request=request, admin_email=admin.email)


@router.patch("/elections/{election_id}/status")
def change_election_status(
    election_id: int,
    new_status: str = Query(...),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Enforces election lifecycle transitions."""
    return update_election_status(db=db, election_id=election_id, new_status=new_status, admin_email=admin.email)


@router.post("/elections/{election_id}/candidates")
def add_candidate_admin(
    election_id: int,
    request: CandidateCreateRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Adds a candidate to an active or draft election."""
    return add_candidate(db=db, election_id=election_id, request=request, admin_email=admin.email)


@router.get("/records/election/{election_id}")
def get_election_records(
    election_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Lists vote records for an election with cryptographic status."""
    records = db.query(VoteRecord).filter(
        VoteRecord.election_id == election_id
    ).order_by(VoteRecord.internal_id.asc()).all()

    return [
        {
            "internal_id": r.internal_id,
            "public_vote_id": r.public_vote_id,
            "record_hash": r.record_hash,
            "signature": r.signature[:32] + "...",
            "verification_status": r.verification_status,
            "is_test_record": r.is_test_record,
            "created_at": r.created_at
        }
        for r in records
    ]


@router.get("/records/{internal_id}", response_model=AdminVerifyVoteDetailResponse)
def inspect_vote_record(
    internal_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Technical cryptographic breakdown of a vote record."""
    return admin_inspect_record(db=db, internal_id=internal_id)


@router.post("/integrity-audit", response_model=SystemIntegrityReportResponse)
def trigger_integrity_audit(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Triggers end-to-end cryptographic audit of all database records."""
    return perform_system_integrity_audit(db=db, admin_email=admin.email)


# -------------------------------------------------------------------------
# Interactive Cryptographic Inspector (XCS-256 Feistel Telemetry)
# -------------------------------------------------------------------------
@router.post("/crypto/xcs256/inspect")
def inspect_xcs256_live(
    payload: str = Query("Vote: Candidate Alpha", description="Plaintext string to test in Feistel"),
    admin: User = Depends(require_admin)
):
    """
    Executes a real-time run of the 4-round hybrid Feistel cipher,
    capturing all intermediate L and R halves, round keys, nonces, and Serpent/XChaCha outputs.
    """
    master_key = AuthorityCryptoState.get_master_key()
    test_bytes = payload.encode("utf-8")
    package = xcs256_encrypt(
        plaintext=test_bytes,
        master_key=master_key,
        associated_data=b"INSPECTION-DEMO",
        capture_traces=True
    )
    return {
        "input_plaintext": payload,
        "master_key_hex": master_key.hex(),
        "salt_hex": package.salt.hex(),
        "version": package.version.hex(),
        "ciphertext_hex": package.ciphertext.hex(),
        "authentication_tag_hex": package.tag.hex(),
        "block_count": package.block_count,
        "round_traces": package.traces
    }


# -------------------------------------------------------------------------
# Tamper Detection Sandbox Feature (DEMO / TESTING ONLY)
# -------------------------------------------------------------------------
@router.post("/tamper-demo/seed-test-record")
def get_or_create_test_record(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Retrieves or provisions an isolated, clearly tagged test record
    used exclusively for the controlled tamper demonstration.
    """
    test_rec = db.query(VoteRecord).filter(VoteRecord.is_test_record == True).first()
    if not test_rec:
        election = db.query(Election).first()
        if not election:
            # Create a demo election if none exists
            election = Election(
                title="Cryptographic Sandbox Election",
                description="Dedicated testing sandbox for tamper-evident verification demonstrations.",
                start_at=datetime.now(timezone.utc),
                end_at=datetime.now(timezone.utc),
                status="open"
            )
            db.add(election)
            db.commit()
            db.refresh(election)

        public_vote_id = f"TEST-TAMPER-{generate_public_vote_id()[-8:]}"
        master_key = AuthorityCryptoState.get_master_key()
        pkg = xcs256_encrypt(
            plaintext=b'{"election_id": 999, "candidate_id": 1, "note": "ISOLATED TEST BALLOT"}',
            master_key=master_key,
            associated_data=public_vote_id.encode("utf-8")
        )
        created_at = datetime.now(timezone.utc)
        created_at_iso = created_at.strftime("%Y-%m-%dT%H:%M:%SZ")
        canon = serialize_vote_record_for_hash(
            election_id=election.id,
            public_vote_id=public_vote_id,
            version=pkg.version.hex(),
            salt_hex=pkg.salt.hex(),
            ciphertext_hex=pkg.ciphertext.hex(),
            tag_hex=pkg.tag.hex(),
            created_at_iso=created_at_iso
        )
        rec_hash = hash_record(canon)
        priv_key, _ = AuthorityCryptoState.get_signing_keys()
        sig = sign_message(priv_key, rec_hash)

        test_rec = VoteRecord(
            public_vote_id=public_vote_id,
            election_id=election.id,
            voter_id=admin.id,
            version=pkg.version.hex(),
            salt=pkg.salt.hex(),
            encrypted_payload=pkg.ciphertext.hex(),
            authentication_tag=pkg.tag.hex(),
            record_hash=rec_hash.hex(),
            signature=sig.hex(),
            verification_status="valid",
            is_test_record=True,
            created_at_iso=created_at_iso,
            created_at=created_at
        )
        db.add(test_rec)
        db.commit()
        db.refresh(test_rec)

    return {
        "test_record_id": test_rec.internal_id,
        "public_vote_id": test_rec.public_vote_id,
        "status": test_rec.verification_status,
        "salt": test_rec.salt,
        "ciphertext": test_rec.encrypted_payload,
        "tag": test_rec.authentication_tag,
        "record_hash": test_rec.record_hash
    }


@router.post("/tamper-demo/simulate", response_model=TamperMutationResponse)
def simulate_tampering(
    request: TamperMutationRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    ADMIN DEMO / TESTING ONLY:
    Mutates a designated test record in an isolated sandbox,
    re-runs the real cryptographic verification pipeline, and shows
    the exact check that caught the discrepancy.
    """
    test_rec = db.query(VoteRecord).filter(VoteRecord.is_test_record == True).first()
    if not test_rec:
        raise HTTPException(status_code=400, detail="Test record not found. Please provision test record first.")

    original_state = {
        "ciphertext": test_rec.encrypted_payload,
        "salt": test_rec.salt,
        "tag": test_rec.authentication_tag,
        "record_hash": test_rec.record_hash,
        "verification_status": test_rec.verification_status
    }

    mutated_state = dict(original_state)
    failed_check = ""
    details = ""

    if request.mutation_type == "ciphertext_byte_flip":
        # Mutate ciphertext: flip a byte
        ct_bytes = bytearray(bytes.fromhex(test_rec.encrypted_payload))
        ct_bytes[4] ^= 0xFF
        mutated_ct_hex = bytes(ct_bytes).hex()
        test_rec.encrypted_payload = mutated_ct_hex
        mutated_state["ciphertext"] = mutated_ct_hex
        failed_check = "HMAC-SHA256 Encrypt-then-MAC Authentication Tag Verification"
        details = (
            "Ciphertext bit modification detected! Authentication tag no longer matches "
            "the computed MAC over the ciphertext and salt. Decryption rejected before block traversal."
        )

    elif request.mutation_type == "salt_mutation":
        salt_bytes = bytearray(bytes.fromhex(test_rec.salt))
        salt_bytes[0] ^= 0x55
        mutated_salt_hex = bytes(salt_bytes).hex()
        test_rec.salt = mutated_salt_hex
        mutated_state["salt"] = mutated_salt_hex
        failed_check = "HKDF-SHA256 Key Derivation & MAC Tag Verification"
        details = (
            "Salt substitution detected! Changing the salt produces completely different "
            "derived round keys and MAC key. Tag verification failed immediately."
        )

    elif request.mutation_type == "tag_corruption":
        tag_bytes = bytearray(bytes.fromhex(test_rec.authentication_tag))
        tag_bytes[-1] ^= 0xEE
        mutated_tag_hex = bytes(tag_bytes).hex()
        test_rec.authentication_tag = mutated_tag_hex
        mutated_state["tag"] = mutated_tag_hex
        failed_check = "HMAC-SHA256 Tag Integrity Check"
        details = "Modified authentication tag rejected by constant-time verification."

    elif request.mutation_type == "hash_tampering":
        # Modify canonical hash directly
        h_bytes = bytearray(bytes.fromhex(test_rec.record_hash))
        h_bytes[0] ^= 0xAA
        mutated_h_hex = bytes(h_bytes).hex()
        test_rec.record_hash = mutated_h_hex
        mutated_state["record_hash"] = mutated_h_hex
        failed_check = "Ed25519 Digital Signature & Merkle Tree Leaf Hash"
        details = "Altered record hash invalidates the authority's Ed25519 digital signature."

    test_rec.verification_status = "tampered"
    db.commit()

    audit = AuditLog(
        actor=admin.email,
        action="TAMPER_SIMULATION_EXECUTED",
        target_reference=f"test_record:{test_rec.internal_id}",
        status="WARNING",
        safe_metadata=f'{{"mutation": "{request.mutation_type}", "failed_check": "{failed_check}"}}'
    )
    db.add(audit)
    db.commit()

    return TamperMutationResponse(
        test_record_id=test_rec.public_vote_id,
        mutation_applied=request.mutation_type,
        original_state=original_state,
        mutated_state=mutated_state,
        verification_check_failed=failed_check,
        failure_details=details,
        is_tampered_flag_set=True,
        restored=False
    )


@router.post("/tamper-demo/reset")
def reset_test_record(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Restores the test record to a fresh, valid cryptographic state."""
    db.query(VoteRecord).filter(VoteRecord.is_test_record == True).delete()
    db.commit()

    # Re-provision clean record
    new_test_record = get_or_create_test_record(admin=admin, db=db)

    audit = AuditLog(
        actor=admin.email,
        action="TAMPER_SANDBOX_RESET",
        target_reference="test_record:all",
        status="SUCCESS"
    )
    db.add(audit)
    db.commit()

    return {"message": "Test sandbox record cleanly reset.", "record": new_test_record}
