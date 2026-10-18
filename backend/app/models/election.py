"""
Election database model.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from app.db.session import Base


class Election(Base):
    __tablename__ = "elections"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    start_at = Column(DateTime, nullable=False)
    end_at = Column(DateTime, nullable=False)
    status = Column(String(20), default="draft", nullable=False)  # "draft", "open", "closed", "published"
    merkle_root = Column(String(64), nullable=True)  # Current BLAKE2s Merkle Root
    results_published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    candidates = relationship("Candidate", back_populates="election", cascade="all, delete-orphan")
    votes = relationship("VoteRecord", back_populates="election", cascade="all, delete-orphan")
    results = relationship("ElectionResult", back_populates="election", cascade="all, delete-orphan")
