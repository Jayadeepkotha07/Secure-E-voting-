"""
User database model.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="voter", nullable=False)  # "voter" or "admin"
    email_verified = Column(Boolean, default=False, nullable=False)
    verification_token = Column(String(64), nullable=True)
    account_status = Column(String(20), default="active", nullable=False)  # "active", "deactivated"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
