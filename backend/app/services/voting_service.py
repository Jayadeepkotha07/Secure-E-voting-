"""
Secure Voting Service.

Executes the complete cryptographic vote submission pipeline:
  VOTE -> JSON Ballot Payload -> HKDF Key Derivation -> XCS-256 Feistel Encryption (Encrypt-then-MAC)
       -> Canonical Serialization -> BLAKE2s Hashing -> Ed25519 Authority Signature
       -> SQLite Transactional Persistence -> Merkle Tree Root Update.
"""

import json
import os
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.models.user import User
from app.models.election import Election
from app.models.candidate import Candidate
from app.models.vote_record import VoteRecord
from app.models.audit_log import AuditLog
from app.schemas.vote import CastVoteRequest, CastVoteResponse, VoterStatusResponse
from app.core.security import generate_public_vote_id, AuthorityCryptoState
from app.crypto import (
    xcs256_encrypt,
    serialize_vote_record_for_hash,
    hash_record,
    sign_message,
    MerkleTree
)


def cast_vote(
    db: Session,
    request: CastVoteRequest,
    voter: User
) -> CastVoteResponse:
    """
    Submits a ballot for an open election.
    Enforces strict single-vote policy, email verification, and cryptographic record generation.
    """
    # 1. Eligibility verification
    if not voter.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your email is not verified. Please verify your email before casting a ballot."
        )

    # 2. Check election status
    election = db.query(Election).filter(Election.id == request.election_id).first()
    if not election:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Election not found.")
    if election.status != "open":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Election is currently '{election.status}'. Votes are only accepted when status is 'open'."
        )

    # 3. Check candidate belongs to election
    candidate = db.query(Candidate).filter(
        Candidate.id == request.candidate_id,
        Candidate.election_id == election.id
    ).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid candidate selected for this election."
        )

    # 4. Check for double voting
    existing_vote = db.query(VoteRecord).filter(
        VoteRecord.voter_id == voter.id,
        VoteRecord.election_id == election.id
    ).first()
    if existing_vote:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already cast a vote in this election. Ballots cannot be modified or recast."
        )

    # 5. Generate non-sequential, unpredictable Vote ID
    public_vote_id = generate_public_vote_id()

    # 6. Prepare secret ballot payload (encrypted and never stored plain)
    ballot_payload = json.dumps({
        "election_id": election.id,
        "candidate_id": candidate.id,
        "ballot_entropy": os.urandom(16).hex(),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }).encode("utf-8")

    # 7. XCS-256 Feistel Encryption with HMAC-SHA256 Encrypt-then-MAC
    master_key = AuthorityCryptoState.get_master_key()
    encrypted_pkg = xcs256_encrypt(
        plaintext=ballot_payload,
        master_key=master_key,
        associated_data=public_vote_id.encode("utf-8")
    )

    created_at = datetime.now(timezone.utc)
    created_at_iso = created_at.strftime("%Y-%m-%dT%H:%M:%SZ")

    # 8. Canonical byte serialization for BLAKE2s hashing
    canonical_bytes = serialize_vote_record_for_hash(
        election_id=election.id,
        public_vote_id=public_vote_id,
        version=encrypted_pkg.version.hex(),
        salt_hex=encrypted_pkg.salt.hex(),
        ciphertext_hex=encrypted_pkg.ciphertext.hex(),
        tag_hex=encrypted_pkg.tag.hex(),
        created_at_iso=created_at_iso
    )

    # 9. BLAKE2s record hash
    record_hash_bytes = hash_record(canonical_bytes)
    record_hash_hex = record_hash_bytes.hex()

    # 10. Ed25519 digital signature by Election Authority
    authority_priv_key, _ = AuthorityCryptoState.get_signing_keys()
    signature_bytes = sign_message(authority_priv_key, record_hash_bytes)
    signature_hex = signature_bytes.hex()

    # 11. Transactional record creation
    try:
        record = VoteRecord(
            public_vote_id=public_vote_id,
            election_id=election.id,
            voter_id=voter.id,
            version=encrypted_pkg.version.hex(),
            salt=encrypted_pkg.salt.hex(),
            encrypted_payload=encrypted_pkg.ciphertext.hex(),
            authentication_tag=encrypted_pkg.tag.hex(),
            record_hash=record_hash_hex,
            signature=signature_hex,
            verification_status="valid",
            is_test_record=False,
            created_at_iso=created_at_iso,
            created_at=created_at
        )
        db.add(record)
        db.flush()  # Flush to catch duplicate constraints

        # 12. Recompute election Merkle root
        all_election_records = db.query(VoteRecord).filter(
            VoteRecord.election_id == election.id,
            VoteRecord.verification_status == "valid",
            VoteRecord.is_test_record == False
        ).order_by(VoteRecord.internal_id.asc()).all()

        hashes = [bytes.fromhex(r.record_hash) for r in all_election_records]
        tree = MerkleTree(hashes)
        election.merkle_root = tree.root_hex
        record.merkle_index = len(hashes) - 1

        db.commit()
        db.refresh(record)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Conflict detected: a vote for this voter or Vote ID has already been recorded."
        )

    # Audit log
    audit = AuditLog(
        actor="voter:authenticated",  # Obfuscate identity in audit trail to avoid direct link
        action="VOTE_CAST",
        target_reference=f"election:{election.id}:vote:{public_vote_id}",
        status="SUCCESS",
        safe_metadata=f'{{"election_id": {election.id}, "public_vote_id": "{public_vote_id}", "merkle_root": "{election.merkle_root}"}}'
    )
    db.add(audit)
    db.commit()

    return CastVoteResponse(
        public_vote_id=public_vote_id,
        election_id=election.id,
        message="Your vote has been cryptographically secured, signed, and recorded in the election ledger.",
        verification_status="valid",
        merkle_index=record.merkle_index,
        created_at=record.created_at
    )


def get_voter_election_status(db: Session, election_id: int, voter: User) -> VoterStatusResponse:
    """Returns voter's voting status for an election."""
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Election not found.")

    vote = db.query(VoteRecord).filter(
        VoteRecord.voter_id == voter.id,
        VoteRecord.election_id == election.id
    ).first()

    return VoterStatusResponse(
        election_id=election.id,
        election_title=election.title,
        has_voted=vote is not None,
        public_vote_id=vote.public_vote_id if vote else None,
        voted_at=vote.created_at if vote else None
    )
