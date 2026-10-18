"""
Election Results Routes.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.results import ElectionResultsResponse
from app.api.dependencies import require_admin
from app.services.result_service import (
    calculate_and_store_results,
    publish_election_results,
    get_public_results
)

router = APIRouter(prefix="/results", tags=["Results"])


@router.get("/public/{election_id}", response_model=ElectionResultsResponse)
def get_election_results_public(election_id: int, db: Session = Depends(get_db)):
    """Returns published election results for public inspection."""
    return get_public_results(db=db, election_id=election_id)


@router.post("/admin/{election_id}/calculate", response_model=ElectionResultsResponse)
def calculate_results_admin(
    election_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Calculates official vote counts by decrypting verified ballots."""
    return calculate_and_store_results(db=db, election_id=election_id, admin_email=admin.email)


@router.post("/admin/{election_id}/publish", response_model=ElectionResultsResponse)
def publish_results_admin(
    election_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Publishes calculated election results."""
    return publish_election_results(db=db, election_id=election_id, admin_email=admin.email)
