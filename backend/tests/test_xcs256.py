"""
Unit and integration tests for the XCS-256 Feistel Cipher implementation.
"""

import pytest
import os
from app.crypto.key_derivation import derive_xcs256_keys
from app.crypto.feistel import xcs256_encrypt_block, xcs256_decrypt_block
from app.crypto.xcs256 import (
    xcs256_encrypt,
    xcs256_decrypt,
    AuthenticationFailedError,
    InvalidPaddingError,
    pkcs7_pad,
    pkcs7_unpad,
    BLOCK_SIZE
)


def test_feistel_single_block_roundtrip():
    """Verify single 256-bit block encrypt and decrypt returns identical plaintext."""
    master_key = os.urandom(32)
    salt = os.urandom(32)
    keys = derive_xcs256_keys(master_key, salt)
    
    plaintext_block = b"Candidate-Alice-Voting-Token-001"
    assert len(plaintext_block) == 32

    ciphertext_block, enc_traces = xcs256_encrypt_block(plaintext_block, keys)
    assert len(ciphertext_block) == 32
    assert ciphertext_block != plaintext_block
    assert len(enc_traces) == 4
    assert enc_traces[0]["round"] == 1
    assert "XChaCha20" in enc_traces[0]["function"]
    assert "Serpent" in enc_traces[1]["function"]
    assert "XChaCha20" in enc_traces[2]["function"]
    assert "Serpent" in enc_traces[3]["function"]

    decrypted_block, dec_traces = xcs256_decrypt_block(ciphertext_block, keys)
    assert decrypted_block == plaintext_block
    assert len(dec_traces) == 4
    assert dec_traces[0]["reverse_round"] == 4


@pytest.mark.parametrize("payload", [
    b"",
    b"A",
    b"Vote for Candidate 1",
    b"Exactly thirty-two bytes string!!",
    b"Longer payload simulating structured ballot JSON record with candidate selections, digital seals, and metadata." * 3
])
def test_xcs256_multi_block_roundtrip(payload):
    """Verify end-to-end CBC mode and padding roundtrip for diverse payload sizes."""
    master_key = os.urandom(32)
    pkg = xcs256_encrypt(payload, master_key, associated_data=b"ELECTION-2026")
    assert pkg.version == b"\x01"
    assert len(pkg.salt) == 32
    assert len(pkg.tag) == 32
    assert len(pkg.ciphertext) % 32 == 0
    assert len(pkg.ciphertext) >= 32

    recovered = xcs256_decrypt(pkg, master_key, associated_data=b"ELECTION-2026")
    assert recovered == payload


def test_tampered_ciphertext_rejection():
    """Verify that tampering with ciphertext fails authentication immediately."""
    master_key = os.urandom(32)
    payload = b"Legitimate Vote for Candidate Bob"
    pkg = xcs256_encrypt(payload, master_key, associated_data=b"ELECTION-1")

    # Flip one byte in the ciphertext
    tampered_ct = bytearray(pkg.ciphertext)
    tampered_ct[5] ^= 0xFF
    pkg.ciphertext = bytes(tampered_ct)

    with pytest.raises(AuthenticationFailedError):
        xcs256_decrypt(pkg, master_key, associated_data=b"ELECTION-1")


def test_tampered_salt_rejection():
    """Verify that altering public salt causes immediate authentication failure."""
    master_key = os.urandom(32)
    payload = b"Legitimate Vote for Candidate Charlie"
    pkg = xcs256_encrypt(payload, master_key, associated_data=b"ELECTION-1")

    # Tamper salt
    tampered_salt = bytearray(pkg.salt)
    tampered_salt[0] ^= 0x01
    pkg.salt = bytes(tampered_salt)

    with pytest.raises(AuthenticationFailedError):
        xcs256_decrypt(pkg, master_key, associated_data=b"ELECTION-1")


def test_tampered_tag_rejection():
    """Verify that modifying the authentication tag causes rejection."""
    master_key = os.urandom(32)
    payload = b"Legitimate Vote"
    pkg = xcs256_encrypt(payload, master_key)

    tampered_tag = bytearray(pkg.tag)
    tampered_tag[-1] ^= 0xAA
    pkg.tag = bytes(tampered_tag)

    with pytest.raises(AuthenticationFailedError):
        xcs256_decrypt(pkg, master_key)


def test_wrong_master_key_rejection():
    """Verify decryption with a different master key is safely rejected."""
    master_key = os.urandom(32)
    wrong_key = os.urandom(32)
    payload = b"Secret Vote Record"
    pkg = xcs256_encrypt(payload, master_key)

    with pytest.raises(AuthenticationFailedError):
        xcs256_decrypt(pkg, wrong_key)


def test_associated_data_mismatch_rejection():
    """Verify altering metadata associated with authentication tag is rejected."""
    master_key = os.urandom(32)
    payload = b"Secret Vote Record"
    pkg = xcs256_encrypt(payload, master_key, associated_data=b"VOTE-ID-123")

    with pytest.raises(AuthenticationFailedError):
        # Attempt to decrypt with spoofed vote ID
        xcs256_decrypt(pkg, master_key, associated_data=b"VOTE-ID-999")


def test_pkcs7_padding_validation():
    """Verify PKCS#7 pad and unpad mechanics and corruption detection."""
    data = b"Hello, Feistel"
    padded = pkcs7_pad(data, BLOCK_SIZE)
    assert len(padded) == BLOCK_SIZE
    assert pkcs7_unpad(padded, BLOCK_SIZE) == data

    # Corrupt pad byte
    bad_padded = padded[:-1] + b"\x00"
    with pytest.raises(InvalidPaddingError):
        pkcs7_unpad(bad_padded, BLOCK_SIZE)
