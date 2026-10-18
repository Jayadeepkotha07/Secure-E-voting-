"""
Elections API Routes.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.election import ElectionResponse, ElectionDetailResponse
from app.services.election_service import list_elections, get_election_detail

router = APIRouter(prefix="/elections", tags=["Elections"])


@router.get("", response_model=List[ElectionResponse])
def get_elections(
    status: Optional[str] = Query(None, description="Filter by status: open, closed, draft, published"),
    db: Session = Depends(get_db)
):
    """Lists elections available to voters."""
    return list_elections(db=db, status_filter=status)


@router.get("/{election_id}", response_model=ElectionDetailResponse)
def get_election(election_id: int, db: Session = Depends(get_db)):
    """Retrieves full election details and candidate list."""
    return get_election_detail(db=db, election_id=election_id)
