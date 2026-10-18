"""
Application configuration settings using Pydantic Settings.
"""

import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "evoting.db").replace("\\", "/")


class Settings(BaseSettings):
    model_config = ConfigDict(case_sensitive=True, env_file=".env", extra="allow")

    PROJECT_NAME: str = "Secure E-Voting System"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "development-insecure-jwt-secret-key-change-in-production-12345"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    ALGORITHM: str = "HS256"

    # SQLite Database URI
    DATABASE_URL: str = f"sqlite:///{DEFAULT_DB_PATH}"

    # Master Authority Encryption Key (32 bytes = 64 hex chars)
    ELECTION_AUTHORITY_MASTER_KEY_HEX: str = (
        "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    )

    # Authority Ed25519 Signing Key
    AUTHORITY_ED25519_PRIVATE_KEY_PEM: str = ""

    # CORS origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000"
    ]


settings = Settings()
