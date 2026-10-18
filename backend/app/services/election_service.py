"""
Election Management Service.
"""

from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.election import Election
from app.models.candidate import Candidate
from app.models.vote_record import VoteRecord
from app.models.audit_log import AuditLog
from app.schemas.election import ElectionCreateRequest, ElectionUpdateRequest, CandidateCreateRequest


VALID_TRANSITIONS = {
    "draft": ["open"],
    "open": ["closed"],
    "closed": ["published", "open"],  # Can reopen if needed by election authority
    "published": []
}


def list_elections(db: Session, status_filter: Optional[str] = None) -> List[Election]:
    """Retrieves elections with optional status filter."""
    query = db.query(Election)
    if status_filter:
        query = query.filter(Election.status == status_filter)
    elections = query.order_by(Election.created_at.desc()).all()
    for e in elections:
        e.candidate_count = len(e.candidates)
        e.vote_count = db.query(VoteRecord).filter(
            VoteRecord.election_id == e.id,
            VoteRecord.is_test_record == False  # Exclude isolated sandbox test votes
        ).count()
    return elections


def get_election_detail(db: Session, election_id: int) -> Election:
    """Retrieves full election details including candidates and vote counts."""
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Election not found.")
    election.candidate_count = len(election.candidates)
    election.vote_count = db.query(VoteRecord).filter(
        VoteRecord.election_id == election.id,
        VoteRecord.is_test_record == False
    ).count()
    return election


def create_election(db: Session, request: ElectionCreateRequest, admin_email: str) -> Election:
    """Creates a new election and optional initial candidates."""
    if request.start_at >= request.end_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Election end time must be after start time."
        )

    election = Election(
        title=request.title.strip(),
        description=request.description.strip(),
        start_at=request.start_at,
        end_at=request.end_at,
        status="draft"
    )
    db.add(election)
    db.commit()
    db.refresh(election)

    if request.candidates:
        for idx, c in enumerate(request.candidates):
            candidate = Candidate(
                election_id=election.id,
                display_name=c.display_name.strip(),
                party=c.party.strip() if c.party else None,
                description=c.description.strip(),
                image_reference=c.image_reference,
                display_order=c.display_order if c.display_order else idx + 1
            )
            db.add(candidate)
        db.commit()
        db.refresh(election)

    audit = AuditLog(
        actor=admin_email,
        action="ELECTION_CREATED",
        target_reference=f"election:{election.id}",
        status="SUCCESS",
        safe_metadata=f'{{"title": "{election.title}"}}'
    )
    db.add(audit)
    db.commit()

    return election


def update_election_status(db: Session, election_id: int, new_status: str, admin_email: str) -> Election:
    """Transitions election state with validation."""
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Election not found.")

    if new_status not in VALID_TRANSITIONS.get(election.status, []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition election from status '{election.status}' to '{new_status}'."
        )

    if new_status == "open":
        if len(election.candidates) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An election requires at least 2 candidates before it can be opened."
            )

    election.status = new_status
    if new_status == "published":
        election.results_published_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(election)

    audit = AuditLog(
        actor=admin_email,
        action="ELECTION_STATUS_CHANGED",
        target_reference=f"election:{election.id}",
        status="SUCCESS",
        safe_metadata=f'{{"new_status": "{new_status}"}}'
    )
    db.add(audit)
    db.commit()

    return election


def add_candidate(db: Session, election_id: int, request: CandidateCreateRequest, admin_email: str) -> Candidate:
    """Adds a candidate to an election."""
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Election not found.")
    if election.status in ["closed", "published"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add candidates to a closed or published election."
        )

    candidate = Candidate(
        election_id=election.id,
        display_name=request.display_name.strip(),
        party=request.party.strip() if request.party else None,
        description=request.description.strip(),
        image_reference=request.image_reference,
        display_order=request.display_order
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)

    audit = AuditLog(
        actor=admin_email,
        action="CANDIDATE_ADDED",
        target_reference=f"election:{election.id}:candidate:{candidate.id}",
        status="SUCCESS",
        safe_metadata=f'{{"candidate": "{candidate.display_name}"}}'
    )
    db.add(audit)
    db.commit()

    return candidate
