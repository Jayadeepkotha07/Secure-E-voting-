"""
XCS-256 Authentication Module (Encrypt-then-MAC).

Implements keyed HMAC-SHA256 authentication over version, salt, ciphertext,
and canonical metadata to guarantee integrity and ciphertext authenticity
prior to decryption.
"""

import hmac
import hashlib
import struct
from typing import Optional


VERSION_BYTE = b"\x01"


def compute_authentication_tag(
    auth_key: bytes,
    version: bytes,
    salt: bytes,
    ciphertext: bytes,
    associated_data: bytes = b""
) -> bytes:
    """
    Computes HMAC-SHA256 authentication tag over:
      AAD = version (1B) || len(salt) (2B) || salt || len(ciphertext) (4B) || ciphertext || associated_data
      
    Args:
        auth_key: 32-byte dedicated MAC key derived from HKDF.
        version: 1-byte version identifier (e.g. b"\x01").
        salt: 32-byte per-record public salt.
        ciphertext: multi-block encrypted payload.
        associated_data: optional canonical metadata bytes (election_id, vote_id, etc.)
        
    Returns:
        32-byte HMAC-SHA256 authentication tag.
    """
    if len(auth_key) != 32:
        raise ValueError(f"Authentication key must be 32 bytes (received {len(auth_key)}).")

    mac = hmac.new(auth_key, digestmod=hashlib.sha256)
    # Structured framing to prevent canonical collision attacks
    mac.update(version)
    mac.update(struct.pack(">H", len(salt)))
    mac.update(salt)
    mac.update(struct.pack(">I", len(ciphertext)))
    mac.update(ciphertext)
    if associated_data:
        mac.update(struct.pack(">I", len(associated_data)))
        mac.update(associated_data)

    return mac.digest()


def verify_authentication_tag(
    auth_key: bytes,
    expected_tag: bytes,
    version: bytes,
    salt: bytes,
    ciphertext: bytes,
    associated_data: bytes = b""
) -> bool:
    """
    Verifies authentication tag using constant-time comparison to prevent timing attacks.
    """
    computed_tag = compute_authentication_tag(
        auth_key=auth_key,
        version=version,
        salt=salt,
        ciphertext=ciphertext,
        associated_data=associated_data
    )
    return hmac.compare_digest(computed_tag, expected_tag)
