"""
XCS-256 Key Derivation Module.
Implements HKDF-SHA256 with explicit domain-separated info labels to derive
independent round keys, nonces, and authentication keys from a master secret and per-record salt.
"""

from dataclasses import dataclass
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes


@dataclass(frozen=True)
class XCS256KeySchedule:
    """Independent keys and nonces derived via HKDF-SHA256."""
    k1: bytes        # 32 bytes - Round 1 XChaCha20 key
    n1: bytes        # 24 bytes - Round 1 XChaCha20 nonce
    k2: bytes        # 32 bytes - Round 2 Serpent key (256-bit)
    k3: bytes        # 32 bytes - Round 3 XChaCha20 key
    n3: bytes        # 24 bytes - Round 3 XChaCha20 nonce
    k4: bytes        # 32 bytes - Round 4 Serpent key (256-bit)
    k_mac: bytes     # 32 bytes - HMAC-SHA256 authentication key
    iv: bytes        # 32 bytes - CBC mode initialization vector


def derive_xcs256_keys(master_key: bytes, salt: bytes) -> XCS256KeySchedule:
    """
    Derives cryptographically separated round keys, nonces, and MAC key
    using HKDF with SHA-256 according to RFC 5869.
    
    Args:
        master_key: 32-byte secret key material.
        salt: 32-byte public per-record salt.
        
    Returns:
        XCS256KeySchedule containing all independent derived material.
    """
    if len(master_key) < 32:
        raise ValueError(f"Master key must be at least 32 bytes (received {len(master_key)} bytes).")
    if len(salt) < 16:
        raise ValueError(f"Salt must be at least 16 bytes (received {len(salt)} bytes).")

    def _hkdf_expand(info: bytes, length: int) -> bytes:
        hkdf = HKDF(
            algorithm=hashes.SHA256(),
            length=length,
            salt=salt,
            info=info,
        )
        return hkdf.derive(master_key)

    # Derive Round 1 (XChaCha20: 32-byte key + 24-byte nonce = 56 bytes)
    r1_material = _hkdf_expand(b"XCS256-v1-Round1-XChaCha20-KeyNonce", 56)
    k1 = r1_material[:32]
    n1 = r1_material[32:56]

    # Derive Round 2 (Serpent 256-bit key: 32 bytes)
    k2 = _hkdf_expand(b"XCS256-v1-Round2-Serpent-Key", 32)

    # Derive Round 3 (XChaCha20: 32-byte key + 24-byte nonce = 56 bytes)
    r3_material = _hkdf_expand(b"XCS256-v1-Round3-XChaCha20-KeyNonce", 56)
    k3 = r3_material[:32]
    n3 = r3_material[32:56]

    # Derive Round 4 (Serpent 256-bit key: 32 bytes)
    k4 = _hkdf_expand(b"XCS256-v1-Round4-Serpent-Key", 32)

    # Derive separate Encrypt-then-MAC Authentication Key (32 bytes)
    k_mac = _hkdf_expand(b"XCS256-v1-HMAC-SHA256-AuthKey", 32)

    # Derive CBC Initialization Vector (32 bytes = 256 bits)
    iv = _hkdf_expand(b"XCS256-v1-CBC-IV", 32)

    return XCS256KeySchedule(
        k1=k1,
        n1=n1,
        k2=k2,
        k3=k3,
        n3=n3,
        k4=k4,
        k_mac=k_mac,
        iv=iv,
    )
