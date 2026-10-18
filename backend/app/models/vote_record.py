"""
VoteRecord database model.

Stores encrypted vote packages, BLAKE2s canonical record hashes, and Ed25519 digital signatures.
Enforces strictly one vote per voter per election via database unique constraint.
Candidate selection is encrypted and NEVER stored in plaintext.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base


class VoteRecord(Base):
    __tablename__ = "vote_records"

    internal_id = Column(Integer, primary_key=True, index=True)
    public_vote_id = Column(String(50), unique=True, index=True, nullable=False)
    election_id = Column(Integer, ForeignKey("elections.id", ondelete="CASCADE"), nullable=False, index=True)
    voter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Cryptographic fields
    version = Column(String(10), default="01", nullable=False)
    salt = Column(String(64), nullable=False)                     # 32 bytes hex
    encrypted_payload = Column(Text, nullable=False)             # XCS-256 ciphertext hex
    authentication_tag = Column(String(64), nullable=False)      # HMAC-SHA256 tag hex
    record_hash = Column(String(64), nullable=False, index=True) # BLAKE2s digest hex
    signature = Column(String(128), nullable=False)              # Ed25519 signature (64 bytes hex)
    
    # Audit & verification status
    verification_status = Column(String(20), default="valid", nullable=False)  # "valid", "tampered"
    merkle_index = Column(Integer, nullable=True)                # Position in Merkle tree
    is_test_record = Column(Boolean, default=False, nullable=False)  # Sandbox test record flag
    
    # Canonical string representation of timestamp to guarantee exact byte reproducibility across DB drivers
    created_at_iso = Column(String(32), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    election = relationship("Election", back_populates="votes")
    voter = relationship("User")

    __table_args__ = (
        UniqueConstraint("voter_id", "election_id", name="uq_voter_election"),
    )
