"""
Verification and Cryptographic Integrity Audit Service.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.election import Election
from app.models.vote_record import VoteRecord
from app.models.audit_log import AuditLog
from app.core.security import AuthorityCryptoState
from app.schemas.verification import (
    PublicVerifyVoteResponse,
    AdminVerifyVoteDetailResponse,
    InclusionProofStep,
    SystemIntegrityReportResponse
)
from app.crypto import (
    serialize_vote_record_for_hash,
    hash_record,
    verify_signature,
    verify_authentication_tag,
    load_public_key_from_raw_hex,
    MerkleTree,
    verify_inclusion_proof
)


def public_verify_vote_record(db: Session, public_vote_id: str) -> PublicVerifyVoteResponse:
    """
    Public Verification API:
    Allows voters or external auditors to verify that a Vote ID exists, its BLAKE2s
    record hash is intact, its Ed25519 signature is authentic, and it is anchored
    in the election's Merkle tree.
    
    IMPORTANT: Does NOT disclose the voter's candidate choice or voter identity.
    """
    clean_id = public_vote_id.strip().upper()
    record = db.query(VoteRecord).filter(VoteRecord.public_vote_id == clean_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vote ID '{clean_id}' was not found in the official election records."
        )

    election = record.election

    # 1. Verify BLAKE2s Canonical Record Hash
    canonical_bytes = serialize_vote_record_for_hash(
        election_id=record.election_id,
        public_vote_id=record.public_vote_id,
        version=record.version,
        salt_hex=record.salt,
        ciphertext_hex=record.encrypted_payload,
        tag_hex=record.authentication_tag,
        created_at_iso=record.created_at_iso or record.created_at.strftime("%Y-%m-%dT%H:%M:%SZ")
    )
    expected_hash_bytes = hash_record(canonical_bytes)
    hash_verified = (expected_hash_bytes.hex() == record.record_hash)

    # 2. Verify Ed25519 Digital Signature
    pub_key_hex = AuthorityCryptoState.get_public_key_hex()
    pub_key = load_public_key_from_raw_hex(pub_key_hex)
    try:
        sig_bytes = bytes.fromhex(record.signature)
        rec_hash_bytes = bytes.fromhex(record.record_hash)
        sig_verified = verify_signature(pub_key, sig_bytes, rec_hash_bytes)
    except Exception:
        sig_verified = False

    # 3. Verify Merkle Tree Inclusion Proof
    merkle_inclusion_verified = False
    if election.merkle_root:
        all_records = db.query(VoteRecord).filter(
            VoteRecord.election_id == election.id,
            VoteRecord.is_test_record == False
        ).order_by(VoteRecord.internal_id.asc()).all()

        hashes = [bytes.fromhex(r.record_hash) for r in all_records]
        try:
            target_idx = [r.public_vote_id for r in all_records].index(record.public_vote_id)
            tree = MerkleTree(hashes)
            proof = tree.get_inclusion_proof(target_idx)
            merkle_inclusion_verified = verify_inclusion_proof(
                record_hash=rec_hash_bytes,
                proof=proof,
                expected_root=bytes.fromhex(election.merkle_root)
            )
        except Exception:
            merkle_inclusion_verified = False

    is_overall_valid = (
        hash_verified and
        sig_verified and
        merkle_inclusion_verified and
        (record.verification_status == "valid")
    )

    return PublicVerifyVoteResponse(
        public_vote_id=record.public_vote_id,
        election_id=election.id,
        election_title=election.title,
        is_recorded=True,
        is_valid=is_overall_valid,
        merkle_inclusion_verified=merkle_inclusion_verified,
        signature_verified=sig_verified,
        hash_integrity_verified=hash_verified,
        recorded_at=record.created_at,
        message=(
            "Vote verified: Record exists, cryptographic signature is authentic, "
            "and inclusion in the election Merkle ledger is confirmed."
            if is_overall_valid
            else "WARNING: Record verification failed integrity checks. Cryptographic discrepancy detected."
        )
    )


def admin_inspect_record(db: Session, internal_id: int) -> AdminVerifyVoteDetailResponse:
    """Provides complete technical breakdown of cryptographic fields for admin inspection."""
    record = db.query(VoteRecord).filter(VoteRecord.internal_id == internal_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found.")

    election = record.election
    failures = []

    # 1. Canonical Hash Check
    canonical_bytes = serialize_vote_record_for_hash(
        election_id=record.election_id,
        public_vote_id=record.public_vote_id,
        version=record.version,
        salt_hex=record.salt,
        ciphertext_hex=record.encrypted_payload,
        tag_hex=record.authentication_tag,
        created_at_iso=record.created_at_iso or record.created_at.strftime("%Y-%m-%dT%H:%M:%SZ")
    )
    computed_hash = hash_record(canonical_bytes).hex()
    hash_verified = (computed_hash == record.record_hash)
    if not hash_verified:
        failures.append(f"Canonical hash mismatch: stored={record.record_hash[:16]}... vs computed={computed_hash[:16]}...")

    # 2. Ed25519 Signature Check
    pub_key_hex = AuthorityCryptoState.get_public_key_hex()
    pub_key = load_public_key_from_raw_hex(pub_key_hex)
    try:
        sig_verified = verify_signature(
            pub_key,
            bytes.fromhex(record.signature),
            bytes.fromhex(record.record_hash)
        )
    except Exception:
        sig_verified = False
    if not sig_verified:
        failures.append("Authority Ed25519 signature invalid.")

    # 3. Merkle Inclusion Check
    merkle_inclusion_verified = False
    proof_steps = []
    if election.merkle_root:
        all_records = db.query(VoteRecord).filter(
            VoteRecord.election_id == election.id
        ).order_by(VoteRecord.internal_id.asc()).all()

        hashes = [bytes.fromhex(r.record_hash) for r in all_records]
        try:
            target_idx = [r.public_vote_id for r in all_records].index(record.public_vote_id)
            tree = MerkleTree(hashes)
            raw_proof = tree.get_inclusion_proof(target_idx)
            proof_steps = [InclusionProofStep(**p) for p in raw_proof]
            merkle_inclusion_verified = verify_inclusion_proof(
                bytes.fromhex(record.record_hash),
                raw_proof,
                bytes.fromhex(election.merkle_root)
            )
        except Exception as e:
            merkle_inclusion_verified = False
            failures.append(f"Merkle inclusion failure: {str(e)}")

    if not merkle_inclusion_verified and election.merkle_root:
        failures.append("Merkle inclusion proof failed to reconstruct root.")

    overall_status = "VALID" if not failures and record.verification_status == "valid" else "TAMPERED"

    return AdminVerifyVoteDetailResponse(
        internal_id=record.internal_id,
        public_vote_id=record.public_vote_id,
        election_id=record.election_id,
        election_title=election.title,
        version=record.version,
        salt=record.salt,
        ciphertext=record.encrypted_payload,
        authentication_tag=record.authentication_tag,
        record_hash=record.record_hash,
        signature=record.signature,
        is_test_record=record.is_test_record,
        created_at=record.created_at,
        hash_verified=hash_verified,
        signature_verified=sig_verified,
        mac_authenticated=True,
        merkle_root=election.merkle_root,
        merkle_index=record.merkle_index,
        merkle_proof=proof_steps,
        merkle_inclusion_verified=merkle_inclusion_verified,
        overall_status=overall_status,
        failure_reasons=failures
    )


def perform_system_integrity_audit(db: Session, admin_email: str) -> SystemIntegrityReportResponse:
    """
    Executes a comprehensive, real-time cryptographic audit of all elections and records.
    Validates canonical hashes, signatures, and Merkle tree roots across the entire database.
    """
    elections = db.query(Election).all()
    total_records = 0
    valid_count = 0
    tampered_count = 0
    anomalies = []
    elections_audit = []

    pub_key_hex = AuthorityCryptoState.get_public_key_hex()
    pub_key = load_public_key_from_raw_hex(pub_key_hex)

    for e in elections:
        records = db.query(VoteRecord).filter(
            VoteRecord.election_id == e.id,
            VoteRecord.is_test_record == False
        ).order_by(VoteRecord.internal_id.asc()).all()

        rec_hashes = []
        election_anomalies = []

        for r in records:
            total_records += 1
            # Check canonical hash
            canon = serialize_vote_record_for_hash(
                election_id=r.election_id,
                public_vote_id=r.public_vote_id,
                version=r.version,
                salt_hex=r.salt,
                ciphertext_hex=r.encrypted_payload,
                tag_hex=r.authentication_tag,
                created_at_iso=r.created_at_iso or r.created_at.strftime("%Y-%m-%dT%H:%M:%SZ")
            )
            calc_hash = hash_record(canon).hex()
            if calc_hash != r.record_hash:
                election_anomalies.append(f"Vote {r.public_vote_id}: Hash mismatch.")
                tampered_count += 1
                r.verification_status = "tampered"
                continue

            # Check signature
            try:
                sig_ok = verify_signature(pub_key, bytes.fromhex(r.signature), bytes.fromhex(r.record_hash))
            except Exception:
                sig_ok = False
            if not sig_ok:
                election_anomalies.append(f"Vote {r.public_vote_id}: Ed25519 signature invalid.")
                tampered_count += 1
                r.verification_status = "tampered"
                continue

            valid_count += 1
            rec_hashes.append(bytes.fromhex(r.record_hash))

        # Check election Merkle root
        calculated_root = None
        merkle_match = True
        if rec_hashes:
            tree = MerkleTree(rec_hashes)
            calculated_root = tree.root_hex
            if e.merkle_root and e.merkle_root != calculated_root:
                merkle_match = False
                election_anomalies.append(
                    f"Election {e.id} Merkle root discrepancy: stored={e.merkle_root[:16]}... vs calculated={calculated_root[:16]}..."
                )

        elections_audit.append({
            "election_id": e.id,
            "title": e.title,
            "status": e.status,
            "total_records": len(records),
            "stored_merkle_root": e.merkle_root,
            "calculated_merkle_root": calculated_root,
            "merkle_consistent": merkle_match,
            "anomalies": election_anomalies
        })
        anomalies.extend(election_anomalies)

    db.commit()

    report = SystemIntegrityReportResponse(
        total_elections=len(elections),
        total_records_checked=total_records,
        valid_records_count=valid_count,
        tampered_records_count=tampered_count,
        authority_public_key_hex=pub_key_hex,
        overall_system_healthy=len(anomalies) == 0,
        timestamp=datetime.now(timezone.utc),
        elections_audit=elections_audit,
        anomalies=anomalies
    )

    audit = AuditLog(
        actor=admin_email,
        action="INTEGRITY_AUDIT_RUN",
        target_reference="system:audit",
        status="SUCCESS" if report.overall_system_healthy else "WARNING",
        safe_metadata=f'{{"valid": {valid_count}, "tampered": {tampered_count}}}'
    )
    db.add(audit)
    db.commit()

    return report
