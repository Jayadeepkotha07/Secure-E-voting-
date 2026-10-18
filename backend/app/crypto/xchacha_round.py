"""
XChaCha20-based Feistel Round Function for XCS-256.

Note: RESEARCH PROTOTYPE / EXPERIMENTAL.
This round function utilizes the raw XChaCha20 stream cipher primitive (using a 256-bit key
and a 192-bit nonce derived uniquely per record via HKDF-SHA256) to produce a 128-bit
pseudo-random non-linear diffusion block.
"""

from typing import Dict, Any, Tuple
from Crypto.Cipher import ChaCha20


def xchacha20_round_function(
    r_block: bytes,
    key: bytes,
    nonce: bytes,
    round_id: int
) -> Tuple[bytes, Dict[str, Any]]:
    """
    Executes the XChaCha20-based round function F(R, K, N).
    
    Mathematical definition:
      1. Initialize raw XChaCha20 stream cipher with 256-bit round key and 192-bit nonce.
      2. Generate 16 bytes of pseudo-random keystream: S = XChaCha20(K, N, counter=0).
      3. Compute 128-bit round output: F = S XOR R.
      4. Output length is strictly 16 bytes (128 bits).
      
    Args:
        r_block: 16-byte right half from previous Feistel stage.
        key: 32-byte round-specific key derived from HKDF.
        nonce: 24-byte round-specific nonce derived from HKDF.
        round_id: 1 or 3 (identifies round stage).
        
    Returns:
        Tuple of (16-byte round output, telemetry dict for educational audit).
    """
    if len(r_block) != 16:
        raise ValueError(f"R block must be exactly 16 bytes (received {len(r_block)}).")
    if len(key) != 32:
        raise ValueError(f"Round key must be exactly 32 bytes (received {len(key)}).")
    if len(nonce) != 24:
        raise ValueError(f"XChaCha20 nonce must be exactly 24 bytes (received {len(nonce)}).")

    # Raw XChaCha20 cipher instance with 24-byte nonce
    cipher = ChaCha20.new(key=key, nonce=nonce)
    
    # Generate 16 bytes of keystream by encrypting a zero block
    keystream = cipher.encrypt(bytes(16))
    
    # Compute non-linear XOR diffusion with R
    round_output = bytes(a ^ b for a, b in zip(keystream, r_block))

    telemetry = {
        "round_id": round_id,
        "primitive": "XChaCha20 (Raw Stream)",
        "r_input_hex": r_block.hex(),
        "key_hex": key.hex(),
        "nonce_hex": nonce.hex(),
        "keystream_hex": keystream.hex(),
        "output_hex": round_output.hex(),
    }

    return round_output, telemetry
