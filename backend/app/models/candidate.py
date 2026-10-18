"""
Candidate database model.
"""

from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    election_id = Column(Integer, ForeignKey("elections.id", ondelete="CASCADE"), nullable=False, index=True)
    display_name = Column(String(100), nullable=False)
    party = Column(String(100), nullable=True)
    description = Column(Text, nullable=False)
    image_reference = Column(String(255), nullable=True)
    display_order = Column(Integer, default=0, nullable=False)

    election = relationship("Election", back_populates="candidates")
