"""
Vote submission and status schemas.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class CastVoteRequest(BaseModel):
    election_id: int
    candidate_id: int


class CastVoteResponse(BaseModel):
    public_vote_id: str
    election_id: int
    message: str = "Vote cast and cryptographically recorded successfully."
    verification_status: str
    merkle_index: Optional[int] = None
    created_at: datetime


class VoterStatusResponse(BaseModel):
    election_id: int
    election_title: str
    has_voted: bool
    public_vote_id: Optional[str] = None
    voted_at: Optional[datetime] = None
