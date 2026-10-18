"""
Voter Operations and Ballot Casting Routes.
"""

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.vote_record import VoteRecord
from app.schemas.vote import CastVoteRequest, CastVoteResponse, VoterStatusResponse
from app.api.dependencies import require_verified_voter, get_current_user
from app.services.voting_service import cast_vote, get_voter_election_status

router = APIRouter(prefix="/voting", tags=["Voting"])


@router.post("/cast", response_model=CastVoteResponse, status_code=status.HTTP_201_CREATED)
def submit_vote(
    request: CastVoteRequest,
    voter: User = Depends(require_verified_voter),
    db: Session = Depends(get_db)
):
    """
    Submits and cryptographically seals a voter's ballot.
    Requires verified voter status and enforces one vote per election.
    """
    return cast_vote(db=db, request=request, voter=voter)


@router.get("/status/{election_id}", response_model=VoterStatusResponse)
def get_voting_status(
    election_id: int,
    voter: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns voter's current participation status in an election."""
    return get_voter_election_status(db=db, election_id=election_id, voter=voter)


@router.get("/my-votes")
def get_my_votes(
    voter: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns list of Vote IDs and timestamps for elections the current voter has participated in.
    Note: candidate choices are NOT returned.
    """
    votes = db.query(VoteRecord).filter(
        VoteRecord.voter_id == voter.id,
        VoteRecord.is_test_record == False
    ).order_by(VoteRecord.created_at.desc()).all()

    return [
        {
            "election_id": v.election_id,
            "election_title": v.election.title,
            "public_vote_id": v.public_vote_id,
            "verification_status": v.verification_status,
            "voted_at": v.created_at
        }
        for v in votes
    ]
