"""
XCS-256 Four-Round Hybrid Feistel Network Core.

Combines XChaCha20 and Serpent round functions in alternating 4-round structure:
  - Round 1: XChaCha20-based F1
  - Round 2: Serpent-based F2
  - Round 3: XChaCha20-based F3
  - Round 4: Serpent-based F4
Operates on 256-bit (32-byte) blocks: L0 (128 bits) || R0 (128 bits).
"""

from typing import Tuple, List, Dict, Any
from app.crypto.key_derivation import XCS256KeySchedule
from app.crypto.xchacha_round import xchacha20_round_function
from app.crypto.serpent_round import serpent_round_function


def xor_bytes(a: bytes, b: bytes) -> bytes:
    """Byte-wise XOR of two equal-length byte sequences."""
    return bytes(x ^ y for x, y in zip(a, b))


def xcs256_encrypt_block(
    block: bytes,
    keys: XCS256KeySchedule
) -> Tuple[bytes, List[Dict[str, Any]]]:
    """
    Encrypts a single 256-bit (32-byte) block using the 4-round hybrid Feistel cipher.
    
    Equations:
      L_i = R_{i-1}
      R_i = L_{i-1} XOR F_i(R_{i-1}, K_i)
      
    Args:
        block: Exactly 32 bytes (256 bits).
        keys: Derived XCS256KeySchedule.
        
    Returns:
        Tuple of (32-byte ciphertext block, list of 4 round execution traces).
    """
    if len(block) != 32:
        raise ValueError(f"Input block must be exactly 32 bytes (received {len(block)}).")

    l_curr = block[:16]
    r_curr = block[16:]
    traces: List[Dict[str, Any]] = []

    # Round 1: XChaCha20 F1
    f1_out, f1_meta = xchacha20_round_function(r_curr, keys.k1, keys.n1, round_id=1)
    l_next = r_curr
    r_next = xor_bytes(l_curr, f1_out)
    traces.append({
        "round": 1,
        "function": "F1 (XChaCha20)",
        "l_in": l_curr.hex(),
        "r_in": r_curr.hex(),
        "f_out": f1_out.hex(),
        "l_out": l_next.hex(),
        "r_out": r_next.hex(),
        "meta": f1_meta,
    })
    l_curr, r_curr = l_next, r_next

    # Round 2: Serpent F2
    f2_out, f2_meta = serpent_round_function(r_curr, keys.k2, round_id=2)
    l_next = r_curr
    r_next = xor_bytes(l_curr, f2_out)
    traces.append({
        "round": 2,
        "function": "F2 (Serpent)",
        "l_in": l_curr.hex(),
        "r_in": r_curr.hex(),
        "f_out": f2_out.hex(),
        "l_out": l_next.hex(),
        "r_out": r_next.hex(),
        "meta": f2_meta,
    })
    l_curr, r_curr = l_next, r_next

    # Round 3: XChaCha20 F3
    f3_out, f3_meta = xchacha20_round_function(r_curr, keys.k3, keys.n3, round_id=3)
    l_next = r_curr
    r_next = xor_bytes(l_curr, f3_out)
    traces.append({
        "round": 3,
        "function": "F3 (XChaCha20)",
        "l_in": l_curr.hex(),
        "r_in": r_curr.hex(),
        "f_out": f3_out.hex(),
        "l_out": l_next.hex(),
        "r_out": r_next.hex(),
        "meta": f3_meta,
    })
    l_curr, r_curr = l_next, r_next

    # Round 4: Serpent F4
    f4_out, f4_meta = serpent_round_function(r_curr, keys.k4, round_id=4)
    l_next = r_curr
    r_next = xor_bytes(l_curr, f4_out)
    traces.append({
        "round": 4,
        "function": "F4 (Serpent)",
        "l_in": l_curr.hex(),
        "r_in": r_curr.hex(),
        "f_out": f4_out.hex(),
        "l_out": l_next.hex(),
        "r_out": r_next.hex(),
        "meta": f4_meta,
    })
    l_curr, r_curr = l_next, r_next

    # Output convention: L4 || R4 (32 bytes)
    ciphertext_block = l_curr + r_curr
    return ciphertext_block, traces


def xcs256_decrypt_block(
    block: bytes,
    keys: XCS256KeySchedule
) -> Tuple[bytes, List[Dict[str, Any]]]:
    """
    Decrypts a single 256-bit (32-byte) block using the inverse 4-round Feistel traversal.
    
    Equations:
      R_{i-1} = L_i
      L_{i-1} = R_i XOR F_i(R_{i-1}, K_i) = R_i XOR F_i(L_i, K_i)
      
    Traversed in reverse order: Round 4 -> Round 3 -> Round 2 -> Round 1.
    """
    if len(block) != 32:
        raise ValueError(f"Ciphertext block must be exactly 32 bytes (received {len(block)}).")

    l4 = block[:16]
    r4 = block[16:]
    traces: List[Dict[str, Any]] = []

    # Reverse Round 4: Serpent F4
    # Since L4 = R3, R3 = L4
    r3 = l4
    f4_out, f4_meta = serpent_round_function(r3, keys.k4, round_id=4)
    # L3 = R4 XOR F4(R3)
    l3 = xor_bytes(r4, f4_out)
    traces.append({
        "reverse_round": 4,
        "function": "Inverse F4 (Serpent)",
        "l_in": l4.hex(),
        "r_in": r4.hex(),
        "recovered_l": l3.hex(),
        "recovered_r": r3.hex(),
        "meta": f4_meta,
    })

    # Reverse Round 3: XChaCha20 F3
    r2 = l3
    f3_out, f3_meta = xchacha20_round_function(r2, keys.k3, keys.n3, round_id=3)
    l2 = xor_bytes(r3, f3_out)
    traces.append({
        "reverse_round": 3,
        "function": "Inverse F3 (XChaCha20)",
        "l_in": l3.hex(),
        "r_in": r3.hex(),
        "recovered_l": l2.hex(),
        "recovered_r": r2.hex(),
        "meta": f3_meta,
    })

    # Reverse Round 2: Serpent F2
    r1 = l2
    f2_out, f2_meta = serpent_round_function(r1, keys.k2, round_id=2)
    l1 = xor_bytes(r2, f2_out)
    traces.append({
        "reverse_round": 2,
        "function": "Inverse F2 (Serpent)",
        "l_in": l2.hex(),
        "r_in": r2.hex(),
        "recovered_l": l1.hex(),
        "recovered_r": r1.hex(),
        "meta": f2_meta,
    })

    # Reverse Round 1: XChaCha20 F1
    r0 = l1
    f1_out, f1_meta = xchacha20_round_function(r0, keys.k1, keys.n1, round_id=1)
    l0 = xor_bytes(r1, f1_out)
    traces.append({
        "reverse_round": 1,
        "function": "Inverse F1 (XChaCha20)",
        "l_in": l1.hex(),
        "r_in": r1.hex(),
        "recovered_l": l0.hex(),
        "recovered_r": r0.hex(),
        "meta": f1_meta,
    })

    # Plaintext: L0 || R0 (32 bytes)
    plaintext_block = l0 + r0
    return plaintext_block, traces
