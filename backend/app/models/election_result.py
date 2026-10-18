"""
ElectionResult database model.

Stores certified candidate tallies published after election closure and cryptographic verification.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base


class ElectionResult(Base):
    __tablename__ = "election_results"

    id = Column(Integer, primary_key=True, index=True)
    election_id = Column(Integer, ForeignKey("elections.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    count = Column(Integer, default=0, nullable=False)
    percentage = Column(Float, default=0.0, nullable=False)
    publication_status = Column(String(20), default="draft", nullable=False)  # "draft", "published"
    calculated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    election = relationship("Election", back_populates="results")
    candidate = relationship("Candidate")
