"""
Public Vote Verification Route.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.verification import PublicVerifyVoteRequest, PublicVerifyVoteResponse
from app.services.verification_service import public_verify_vote_record

router = APIRouter(prefix="/verification", tags=["Verification"])


@router.post("/verify", response_model=PublicVerifyVoteResponse)
def verify_vote(request: PublicVerifyVoteRequest, db: Session = Depends(get_db)):
    """
    Publicly verifies that a given Vote ID was recorded, its hash is uncorrupted,
    its Ed25519 digital signature is genuine, and it is part of the election Merkle root.
    Candidate selection is never revealed.
    """
    return public_verify_vote_record(db=db, public_vote_id=request.public_vote_id)
