"""
Tests for canonical serialization and BLAKE2s record hashing.
"""

from app.crypto.hashing import blake2s_digest, blake2s_hex
from app.crypto.serialization import serialize_vote_record_for_hash, canonical_json_bytes


def test_blake2s_digest_length():
    """Verify BLAKE2s produces exact 32 bytes (256 bits)."""
    digest = blake2s_digest(b"Election Audit Record")
    assert len(digest) == 32
    assert isinstance(digest, bytes)
    assert len(blake2s_hex(b"Election Audit Record")) == 64


def test_canonical_serialization_determinism():
    """Verify dictionary key ordering does not affect canonical byte representation."""
    d1 = {"z": 10, "a": "hello", "m": [1, 2, 3]}
    d2 = {"a": "hello", "m": [1, 2, 3], "z": 10}
    assert canonical_json_bytes(d1) == canonical_json_bytes(d2)


def test_vote_record_hash_stability():
    """Verify vote record canonical hashing is stable and sensitive to any field change."""
    h1 = serialize_vote_record_for_hash(
        election_id=1,
        public_vote_id="VOTE-ABC-123",
        version="01",
        salt_hex="aa" * 32,
        ciphertext_hex="bb" * 32,
        tag_hex="cc" * 32,
        created_at_iso="2026-10-18T12:00:00Z"
    )
    h2 = serialize_vote_record_for_hash(
        election_id=1,
        public_vote_id="VOTE-ABC-123",
        version="01",
        salt_hex="aa" * 32,
        ciphertext_hex="bb" * 32,
        tag_hex="cc" * 32,
        created_at_iso="2026-10-18T12:00:00Z"
    )
    assert blake2s_digest(h1) == blake2s_digest(h2)

    # Change one character in ciphertext
    h3 = serialize_vote_record_for_hash(
        election_id=1,
        public_vote_id="VOTE-ABC-123",
        version="01",
        salt_hex="aa" * 32,
        ciphertext_hex="bb" * 31 + "ff",
        tag_hex="cc" * 32,
        created_at_iso="2026-10-18T12:00:00Z"
    )
    assert blake2s_digest(h1) != blake2s_digest(h3)
