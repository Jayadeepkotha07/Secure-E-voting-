"""
Election and Candidate Pydantic Schemas.
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class CandidateCreateRequest(BaseModel):
    display_name: str = Field(..., min_length=2, max_length=100)
    party: Optional[str] = Field(None, max_length=100)
    description: str = Field(..., min_length=5)
    image_reference: Optional[str] = None
    display_order: int = 0


class CandidateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    election_id: int
    display_name: str
    party: Optional[str] = None
    description: str
    image_reference: Optional[str] = None
    display_order: int


class ElectionCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    start_at: datetime
    end_at: datetime
    candidates: Optional[List[CandidateCreateRequest]] = None


class ElectionUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    status: Optional[str] = None  # "draft", "open", "closed", "published"


class ElectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    start_at: datetime
    end_at: datetime
    status: str
    merkle_root: Optional[str] = None
    results_published_at: Optional[datetime] = None
    created_at: datetime
    candidate_count: Optional[int] = 0
    vote_count: Optional[int] = 0


class ElectionDetailResponse(ElectionResponse):
    candidates: List[CandidateResponse] = []
