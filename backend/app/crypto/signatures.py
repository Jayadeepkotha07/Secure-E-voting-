"""
Ed25519 Digital Signatures Module.

Provides tamper-evident cryptographic signing using Edwards-curve Digital Signature Algorithm
(Ed25519 - RFC 8032) via the trusted cryptography library.
Used by the Election Authority to sign canonical record hashes.
"""

from typing import Tuple
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
from cryptography.exceptions import InvalidSignature


def generate_ed25519_keypair() -> Tuple[ed25519.Ed25519PrivateKey, ed25519.Ed25519PublicKey]:
    """Generates a fresh Ed25519 signing keypair."""
    private_key = ed25519.Ed25519PrivateKey.generate()
    public_key = private_key.public_key()
    return private_key, public_key


def private_key_to_pem(private_key: ed25519.Ed25519PrivateKey) -> bytes:
    """Exports private key to PKCS8 PEM bytes."""
    return private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )


def public_key_to_pem(public_key: ed25519.Ed25519PublicKey) -> bytes:
    """Exports public key to SubjectPublicKeyInfo PEM bytes."""
    return public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )


def public_key_to_raw_hex(public_key: ed25519.Ed25519PublicKey) -> str:
    """Exports public key to 32-byte raw hex representation."""
    return public_key.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw
    ).hex()


def load_private_key_from_pem(pem_bytes: bytes) -> ed25519.Ed25519PrivateKey:
    """Loads private key from PEM bytes."""
    return serialization.load_pem_private_key(pem_bytes, password=None)  # type: ignore


def load_public_key_from_pem(pem_bytes: bytes) -> ed25519.Ed25519PublicKey:
    """Loads public key from PEM bytes."""
    return serialization.load_pem_public_key(pem_bytes)  # type: ignore


def load_public_key_from_raw_hex(hex_str: str) -> ed25519.Ed25519PublicKey:
    """Loads public key from 32-byte raw hex string."""
    raw_bytes = bytes.fromhex(hex_str)
    return ed25519.Ed25519PublicKey.from_public_bytes(raw_bytes)


def sign_message(private_key: ed25519.Ed25519PrivateKey, message: bytes) -> bytes:
    """Signs a message using the authority private key (produces 64-byte signature)."""
    return private_key.sign(message)


def verify_signature(public_key: ed25519.Ed25519PublicKey, signature: bytes, message: bytes) -> bool:
    """
    Verifies an Ed25519 signature against the expected message.
    Returns True if valid, False otherwise.
    """
    try:
        public_key.verify(signature, message)
        return True
    except (InvalidSignature, ValueError):
        return False
