"""
Election Results and Decryption Tally Service.

Tallying operates under the control of the Election Authority:
  1. Election must be in 'closed' or 'published' status.
  2. Each valid vote record is decrypted in memory using the Authority Master Key.
  3. HMAC-SHA256 Encrypt-then-MAC authentication is strictly verified for each ballot.
  4. Decrypted candidate selections are aggregated into verifiable candidate counts and percentages.
"""

import json
from datetime import datetime, timezone
from typing import Dict
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.election import Election
from app.models.candidate import Candidate
from app.models.vote_record import VoteRecord
from app.models.election_result import ElectionResult
from app.models.audit_log import AuditLog
from app.schemas.results import ElectionResultsResponse, CandidateTally
from app.core.security import AuthorityCryptoState
from app.crypto import xcs256_decrypt, XCS256CiphertextPackage


def calculate_and_store_results(db: Session, election_id: int, admin_email: str) -> ElectionResultsResponse:
    """
    Decrypts accepted ballots, aggregates candidate counts, and stores official tallies.
    """
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Election not found.")

    if election.status not in ["closed", "published"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Election must be closed before calculating results (current status: '{election.status}')."
        )

    # Fetch all valid non-test records
    valid_records = db.query(VoteRecord).filter(
        VoteRecord.election_id == election.id,
        VoteRecord.verification_status == "valid",
        VoteRecord.is_test_record == False
    ).all()

    candidates = db.query(Candidate).filter(Candidate.election_id == election.id).all()
    candidate_map = {c.id: c for c in candidates}
    tally_counts: Dict[int, int] = {c.id: 0 for c in candidates}

    master_key = AuthorityCryptoState.get_master_key()
    decrypted_count = 0

    for r in valid_records:
        pkg = XCS256CiphertextPackage(
            version=bytes.fromhex(r.version),
            salt=bytes.fromhex(r.salt),
            ciphertext=bytes.fromhex(r.encrypted_payload),
            tag=bytes.fromhex(r.authentication_tag),
            block_count=len(bytes.fromhex(r.encrypted_payload)) // 32
        )
        try:
            pt = xcs256_decrypt(
                package=pkg,
                master_key=master_key,
                associated_data=r.public_vote_id.encode("utf-8")
            )
            ballot_data = json.loads(pt.decode("utf-8"))
            cid = ballot_data.get("candidate_id")
            if cid in tally_counts:
                tally_counts[cid] += 1
                decrypted_count += 1
        except Exception as e:
            # Ballots failing MAC or decryption are excluded from official tally
            continue

    # Clean existing cached results
    db.query(ElectionResult).filter(ElectionResult.election_id == election.id).delete()

    tallies = []
    total = sum(tally_counts.values())

    for cid, count in tally_counts.items():
        cand = candidate_map[cid]
        pct = (count / total * 100.0) if total > 0 else 0.0
        res = ElectionResult(
            election_id=election.id,
            candidate_id=cid,
            count=count,
            percentage=round(pct, 2),
            publication_status=election.status,
            calculated_at=datetime.now(timezone.utc)
        )
        db.add(res)
        tallies.append(CandidateTally(
            candidate_id=cid,
            display_name=cand.display_name,
            party=cand.party,
            count=count,
            percentage=round(pct, 2)
        ))

    db.commit()

    audit = AuditLog(
        actor=admin_email,
        action="RESULTS_CALCULATED",
        target_reference=f"election:{election.id}",
        status="SUCCESS",
        safe_metadata=f'{{"total_tallied": {decrypted_count}}}'
    )
    db.add(audit)
    db.commit()

    return ElectionResultsResponse(
        election_id=election.id,
        election_title=election.title,
        status=election.status,
        total_valid_votes=total,
        tallies=tallies,
        merkle_root=election.merkle_root,
        results_published_at=election.results_published_at,
        is_published=election.status == "published"
    )


def publish_election_results(db: Session, election_id: int, admin_email: str) -> ElectionResultsResponse:
    """Publishes official election results to the public portal."""
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Election not found.")
    if election.status != "closed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Election must be closed before publishing official results."
        )

    # First ensure results are calculated
    calculate_and_store_results(db, election_id, admin_email)

    election.status = "published"
    election.results_published_at = datetime.now(timezone.utc)
    db.query(ElectionResult).filter(ElectionResult.election_id == election.id).update(
        {"publication_status": "published"}
    )
    db.commit()

    audit = AuditLog(
        actor=admin_email,
        action="RESULTS_PUBLISHED",
        target_reference=f"election:{election.id}",
        status="SUCCESS"
    )
    db.add(audit)
    db.commit()

    return get_public_results(db, election_id)


def get_public_results(db: Session, election_id: int) -> ElectionResultsResponse:
    """Returns certified election results for public inspection."""
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Election not found.")

    if election.status != "published":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Official results for this election have not been published yet."
        )

    results = db.query(ElectionResult).filter(ElectionResult.election_id == election.id).all()
    tallies = []
    total = sum(r.count for r in results)

    for r in results:
        cand = r.candidate
        tallies.append(CandidateTally(
            candidate_id=r.candidate_id,
            display_name=cand.display_name if cand else "Unknown",
            party=cand.party if cand else None,
            count=r.count,
            percentage=r.percentage
        ))

    return ElectionResultsResponse(
        election_id=election.id,
        election_title=election.title,
        status=election.status,
        total_valid_votes=total,
        tallies=tallies,
        merkle_root=election.merkle_root,
        results_published_at=election.results_published_at,
        is_published=True
    )
