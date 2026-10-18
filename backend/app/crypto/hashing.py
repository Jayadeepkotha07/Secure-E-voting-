"""
BLAKE2s Cryptographic Hashing Module.

Implements BLAKE2s-256 for fast, secure record fingerprinting and Merkle tree hashing.
RFC 7693 compliant.
"""

import hashlib
from typing import Union


def blake2s_digest(data: Union[bytes, str]) -> bytes:
    """
    Computes 32-byte (256-bit) BLAKE2s digest.
    """
    if isinstance(data, str):
        data = data.encode("utf-8")
    h = hashlib.blake2s(digest_size=32)
    h.update(data)
    return h.digest()


def blake2s_hex(data: Union[bytes, str]) -> str:
    """Computes hexadecimal representation of 32-byte BLAKE2s digest."""
    return blake2s_digest(data).hex()


def hash_record(canonical_bytes: bytes) -> bytes:
    """Hashes canonical serialized vote record."""
    return blake2s_digest(canonical_bytes)
