"""
Tests for Ed25519 digital signatures on vote records.
"""

from app.crypto.signatures import (
    generate_ed25519_keypair,
    sign_message,
    verify_signature,
    public_key_to_pem,
    load_public_key_from_pem,
    public_key_to_raw_hex,
    load_public_key_from_raw_hex
)
from app.crypto.hashing import blake2s_digest


def test_ed25519_sign_and_verify():
    """Verify Ed25519 signature creation and verification on 32-byte record hash."""
    private_key, public_key = generate_ed25519_keypair()
    record_hash = blake2s_digest(b"Sample Canonical Vote Record")

    sig = sign_message(private_key, record_hash)
    assert len(sig) == 64  # Ed25519 signatures are 64 bytes
    assert verify_signature(public_key, sig, record_hash) is True


def test_ed25519_tampered_message_rejection():
    """Verify altered hash invalidates signature."""
    private_key, public_key = generate_ed25519_keypair()
    hash1 = blake2s_digest(b"Original Hash")
    hash2 = blake2s_digest(b"Altered Hash")

    sig = sign_message(private_key, hash1)
    assert verify_signature(public_key, sig, hash2) is False


def test_ed25519_wrong_key_rejection():
    """Verify signature fails when checked against another authority's public key."""
    priv1, pub1 = generate_ed25519_keypair()
    priv2, pub2 = generate_ed25519_keypair()
    msg = b"Vote Record Authorization"

    sig = sign_message(priv1, msg)
    assert verify_signature(pub1, sig, msg) is True
    assert verify_signature(pub2, sig, msg) is False


def test_public_key_serialization():
    """Verify export and reload of public key in PEM and raw 32-byte hex formats."""
    _, pub = generate_ed25519_keypair()
    pem = public_key_to_pem(pub)
    reloaded_from_pem = load_public_key_from_pem(pem)
    raw_hex = public_key_to_raw_hex(pub)
    reloaded_from_hex = load_public_key_from_raw_hex(raw_hex)

    msg = b"Check serialization stability"
    sig = sign_message(_, msg)
    assert verify_signature(reloaded_from_pem, sig, msg) is True
    assert verify_signature(reloaded_from_hex, sig, msg) is True
