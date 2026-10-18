"""
Canonical Deterministic Serialization for Cryptographic Hashing and Auditing.

Guarantees identical byte representations across platforms, eliminating JSON key ordering
or formatting variance that would break digital signatures and hash chains.
"""

import json
from typing import Dict, Any


def canonical_json_bytes(data: Dict[str, Any]) -> bytes:
    """
    Serializes a dictionary into canonical UTF-8 JSON bytes:
      - Sorted keys
      - Separators: (',', ':') with no arbitrary whitespace
      - ASCII / strict UTF-8
    """
    return json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def serialize_vote_record_for_hash(
    election_id: int,
    public_vote_id: str,
    version: str,
    salt_hex: str,
    ciphertext_hex: str,
    tag_hex: str,
    created_at_iso: str
) -> bytes:
    """
    Constructs the canonical byte payload for BLAKE2s record hashing.
    """
    payload = {
        "election_id": election_id,
        "public_vote_id": public_vote_id,
        "version": version,
        "salt": salt_hex,
        "ciphertext": ciphertext_hex,
        "tag": tag_hex,
        "created_at": created_at_iso
    }
    return canonical_json_bytes(payload)
