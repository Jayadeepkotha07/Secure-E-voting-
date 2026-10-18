"""
Core security utilities: Argon2id password hashing, JWT token handling,
Vote ID generation, and Election Authority key management.
"""

import os
import secrets
import string
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError
from jose import jwt, JWTError

from app.core.config import settings
from app.crypto.signatures import (
    generate_ed25519_keypair,
    private_key_to_pem,
    public_key_to_pem,
    public_key_to_raw_hex,
    load_private_key_from_pem
)


# Argon2id password hasher with recommended RFC 9106 parameters
_ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32,
    salt_len=16
)


def hash_password(password: str) -> str:
    """Hashes password using Argon2id."""
    return _ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies plain password against Argon2id hash."""
    try:
        return _ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError):
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Encodes JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates JWT access token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def generate_public_vote_id() -> str:
    """
    Generates an unpredictable, non-sequential cryptographic Vote ID.
    Format: VOTE-[4 CHARS]-[4 CHARS]-[4 CHARS] (e.g. VOTE-9A4F-C281-7B3D)
    """
    alphabet = string.ascii_uppercase + string.digits
    p1 = "".join(secrets.choice(alphabet) for _ in range(4))
    p2 = "".join(secrets.choice(alphabet) for _ in range(4))
    p3 = "".join(secrets.choice(alphabet) for _ in range(4))
    return f"VOTE-{p1}-{p2}-{p3}"


def generate_verification_token() -> str:
    """Generates random 6-digit or 32-char token for email verification."""
    return f"{secrets.randbelow(900000) + 100000}"


# Global in-memory authority key storage
class AuthorityCryptoState:
    _priv_key = None
    _pub_key = None
    _master_key = None

    @classmethod
    def get_master_key(cls) -> bytes:
        if cls._master_key is None:
            cls._master_key = bytes.fromhex(settings.ELECTION_AUTHORITY_MASTER_KEY_HEX)
        return cls._master_key

    @classmethod
    def get_signing_keys(cls):
        if cls._priv_key is None:
            if settings.AUTHORITY_ED25519_PRIVATE_KEY_PEM:
                cls._priv_key = load_private_key_from_pem(settings.AUTHORITY_ED25519_PRIVATE_KEY_PEM.encode())
                cls._pub_key = cls._priv_key.public_key()
            else:
                priv, pub = generate_ed25519_keypair()
                cls._priv_key = priv
                cls._pub_key = pub
        return cls._priv_key, cls._pub_key

    @classmethod
    def get_public_key_hex(cls) -> str:
        _, pub = cls.get_signing_keys()
        return public_key_to_raw_hex(pub)

    @classmethod
    def get_public_key_pem(cls) -> str:
        _, pub = cls.get_signing_keys()
        return public_key_to_pem(pub).decode("utf-8")
