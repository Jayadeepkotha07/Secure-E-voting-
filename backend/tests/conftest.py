"""
Pytest global fixtures.
"""

import pytest
from app.db.session import Base, engine, SessionLocal
from app.models.user import User


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Ensures database tables exist and seeds test accounts if missing."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    admin = db.query(User).filter(User.email == "admin@evoting.gov").first()
    db.close()
    if not admin:
        import sys
        import os
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "scripts")))
        import seed_demo
        seed_demo.seed()
