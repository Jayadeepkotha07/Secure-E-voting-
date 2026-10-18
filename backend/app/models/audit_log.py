"""
AuditLog database model.

Maintains immutable chronological log of critical administrative and cryptographic events.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.db.session import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    actor = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False, index=True)
    target_reference = Column(String(150), nullable=False)
    status = Column(String(20), nullable=False)  # "SUCCESS", "FAILED", "WARNING"
    safe_metadata = Column(Text, nullable=True)  # JSON formatted safe metadata (no secrets)
