"""
Tests for underlying cryptographic primitives (XChaCha20, Serpent, HKDF-SHA256).
"""

import pytest
from Crypto.Cipher import ChaCha20
from pyserpent import Serpent
from app.crypto.key_derivation import derive_xcs256_keys
from app.crypto.xchacha_round import xchacha20_round_function
from app.crypto.serpent_round import serpent_round_function


def test_serpent_roundtrip():
    """Verify Serpent 128-bit block encrypt/decrypt round trip."""
    key = b"A" * 32
    plaintext = b"0123456789abcdef"
    cipher = Serpent(key=key)
    ciphertext = cipher.encrypt(plaintext)
    assert len(ciphertext) == 16
    assert ciphertext != plaintext
    decrypted = cipher.decrypt(ciphertext)
    assert decrypted == plaintext


def test_xchacha20_primitive_round():
    """Verify raw XChaCha20 round function produces deterministic 16 bytes."""
    r_in = b"B" * 16
    key = b"K" * 32
    nonce = b"N" * 24
    out1, meta1 = xchacha20_round_function(r_in, key, nonce, round_id=1)
    out2, meta2 = xchacha20_round_function(r_in, key, nonce, round_id=1)
    assert len(out1) == 16
    assert out1 == out2
    assert meta1["primitive"].startswith("XChaCha20")


def test_serpent_primitive_round():
    """Verify Serpent round function produces deterministic 16 bytes."""
    r_in = b"C" * 16
    key = b"S" * 32
    out1, meta1 = serpent_round_function(r_in, key, round_id=2)
    out2, meta2 = serpent_round_function(r_in, key, round_id=2)
    assert len(out1) == 16
    assert out1 == out2
    assert meta1["primitive"].startswith("Serpent")


def test_hkdf_domain_separation():
    """Verify HKDF produces unique keys across different rounds."""
    master = b"M" * 32
    salt = b"S" * 32
    schedule = derive_xcs256_keys(master, salt)
    all_keys = [schedule.k1, schedule.k2, schedule.k3, schedule.k4, schedule.k_mac, schedule.iv]
    # Ensure all derived keys are distinct
    assert len(set(all_keys)) == len(all_keys)
    # Check lengths
    assert len(schedule.k1) == 32
    assert len(schedule.n1) == 24
    assert len(schedule.k2) == 32
    assert len(schedule.k_mac) == 32
