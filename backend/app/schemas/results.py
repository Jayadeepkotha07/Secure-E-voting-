"""
Election results schemas.
"""

from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


class CandidateTally(BaseModel):
    candidate_id: int
    display_name: str
    party: Optional[str] = None
    count: int
    percentage: float


class ElectionResultsResponse(BaseModel):
    election_id: int
    election_title: str
    status: str
    total_valid_votes: int
    tallies: List[CandidateTally]
    merkle_root: Optional[str] = None
    results_published_at: Optional[datetime] = None
    is_published: bool
