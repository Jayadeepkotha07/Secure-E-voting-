"""
Serpent-based Feistel Round Function for XCS-256.

Uses the established Serpent block-cipher implementation (AES finalist)
to process a single 128-bit (16-byte) input block under a 256-bit round key.
"""

from typing import Dict, Any, Tuple
from pyserpent import Serpent


def serpent_round_function(
    r_block: bytes,
    key: bytes,
    round_id: int
) -> Tuple[bytes, Dict[str, Any]]:
    """
    Executes the Serpent block-cipher round function F(R, K).
    
    Mathematical definition:
      Serpent operates natively on 128-bit (16-byte) blocks with 32 rounds of
      4x4 S-boxes and linear transformations.
      F(R, K) = Serpent_Encrypt(key=K_256, block=R_128).
      Output length is strictly 16 bytes (128 bits).
      
    Args:
        r_block: 16-byte right half block from previous Feistel stage.
        key: 32-byte (256-bit) round key derived from HKDF.
        round_id: 2 or 4 (identifies round stage).
        
    Returns:
        Tuple of (16-byte round output, telemetry dict for educational audit).
    """
    if len(r_block) != 16:
        raise ValueError(f"R block must be exactly 16 bytes (received {len(r_block)}).")
    if len(key) != 32:
        raise ValueError(f"Serpent round key must be exactly 32 bytes (received {len(key)}).")

    # Instantiate Serpent cipher with 256-bit round key
    cipher = Serpent(key=key)
    
    # Encrypt the 16-byte block
    round_output = cipher.encrypt(r_block)

    telemetry = {
        "round_id": round_id,
        "primitive": "Serpent (128-bit Block Cipher, 32 Internal Rounds)",
        "r_input_hex": r_block.hex(),
        "key_hex": key.hex(),
        "output_hex": round_output.hex(),
    }

    return round_output, telemetry
