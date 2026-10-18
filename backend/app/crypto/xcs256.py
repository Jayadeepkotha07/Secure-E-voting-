"""
XCS-256 Experimental Cipher Engine.

Status: RESEARCH PROTOTYPE / EXPERIMENTAL.
A four-round hybrid Feistel construction combining XChaCha20 and Serpent round functions
with HKDF-SHA256 key derivation and HMAC-SHA256 Encrypt-then-MAC authentication.

NOT FOR PRODUCTION ELECTION USE. Developed for educational cryptography demonstration.
"""

import os
from dataclasses import dataclass
from typing import Optional, Dict, Any, List

from app.crypto.key_derivation import derive_xcs256_keys
from app.crypto.feistel import xcs256_encrypt_block, xcs256_decrypt_block, xor_bytes
from app.crypto.authentication import (
    VERSION_BYTE,
    compute_authentication_tag,
    verify_authentication_tag
)


BLOCK_SIZE = 32  # 256 bits


class XCS256Error(Exception):
    """Base exception for XCS-256 cryptographic operations."""
    pass


class AuthenticationFailedError(XCS256Error):
    """Raised when the Encrypt-then-MAC authentication tag verification fails."""
    pass


class InvalidPaddingError(XCS256Error):
    """Raised when PKCS#7 padding is corrupted or invalid."""
    pass


def pkcs7_pad(data: bytes, block_size: int = BLOCK_SIZE) -> bytes:
    """Applies standard PKCS#7 padding up to multiples of block_size."""
    pad_len = block_size - (len(data) % block_size)
    if pad_len == 0:
        pad_len = block_size
    return data + bytes([pad_len] * pad_len)


def pkcs7_unpad(data: bytes, block_size: int = BLOCK_SIZE) -> bytes:
    """Validates and strips PKCS#7 padding."""
    if not data or len(data) % block_size != 0:
        raise InvalidPaddingError("Data length is not a multiple of the block size.")
    pad_len = data[-1]
    if pad_len < 1 or pad_len > block_size:
        raise InvalidPaddingError(f"Invalid PKCS#7 pad byte value: {pad_len}")
    if data[-pad_len:] != bytes([pad_len] * pad_len):
        raise InvalidPaddingError("PKCS#7 padding bytes are inconsistent or corrupted.")
    return data[:-pad_len]


@dataclass
class XCS256CiphertextPackage:
    """Complete authenticated ciphertext bundle."""
    version: bytes              # 1 byte (b"\x01")
    salt: bytes                 # 32 bytes public per-record salt
    ciphertext: bytes           # Multi-block ciphertext (multiples of 32 bytes)
    tag: bytes                  # 32 bytes HMAC-SHA256 authentication tag
    block_count: int            # Number of 256-bit blocks
    traces: Optional[List[Dict[str, Any]]] = None  # Telemetry traces for audit

    def to_dict(self) -> Dict[str, Any]:
        return {
            "version": self.version.hex(),
            "salt": self.salt.hex(),
            "ciphertext": self.ciphertext.hex(),
            "tag": self.tag.hex(),
            "block_count": self.block_count,
        }


def xcs256_encrypt(
    plaintext: bytes,
    master_key: bytes,
    associated_data: bytes = b"",
    salt: Optional[bytes] = None,
    capture_traces: bool = False
) -> XCS256CiphertextPackage:
    """
    Encrypts arbitrary-length plaintext using XCS-256 in CBC mode with PKCS#7 padding,
    followed by HMAC-SHA256 Encrypt-then-MAC authentication.
    
    Args:
        plaintext: Raw data to encrypt.
        master_key: 32-byte secret authority key.
        associated_data: Public metadata bound to authentication tag (e.g. vote_id).
        salt: Optional 32-byte salt (auto-generated securely if None).
        capture_traces: If True, captures educational Feistel round traces.
        
    Returns:
        XCS256CiphertextPackage containing version, salt, ciphertext, tag.
    """
    if salt is None:
        salt = os.urandom(32)
    elif len(salt) < 16:
        raise ValueError("Salt must be at least 16 bytes.")

    # 1. Derive keys via HKDF-SHA256
    keys = derive_xcs256_keys(master_key=master_key, salt=salt)

    # 2. Apply PKCS#7 padding (32-byte blocks)
    padded = pkcs7_pad(plaintext, BLOCK_SIZE)
    num_blocks = len(padded) // BLOCK_SIZE

    # 3. Encrypt blocks in CBC mode using derived IV
    ciphertext_blocks = []
    prev_cipher_block = keys.iv
    all_traces = []

    for i in range(num_blocks):
        block = padded[i * BLOCK_SIZE : (i + 1) * BLOCK_SIZE]
        # CBC XOR
        cbc_in = xor_bytes(block, prev_cipher_block)
        ct_block, traces = xcs256_encrypt_block(cbc_in, keys)
        ciphertext_blocks.append(ct_block)
        prev_cipher_block = ct_block
        if capture_traces:
            all_traces.extend(traces)

    ciphertext = b"".join(ciphertext_blocks)

    # 4. Compute Encrypt-then-MAC authentication tag
    tag = compute_authentication_tag(
        auth_key=keys.k_mac,
        version=VERSION_BYTE,
        salt=salt,
        ciphertext=ciphertext,
        associated_data=associated_data
    )

    return XCS256CiphertextPackage(
        version=VERSION_BYTE,
        salt=salt,
        ciphertext=ciphertext,
        tag=tag,
        block_count=num_blocks,
        traces=all_traces if capture_traces else None
    )


def xcs256_decrypt(
    package: XCS256CiphertextPackage,
    master_key: bytes,
    associated_data: bytes = b"",
    capture_traces: bool = False
) -> bytes:
    """
    Authenticates and decrypts an XCS256CiphertextPackage.
    
    CRITICAL: Validates the HMAC-SHA256 authentication tag FIRST (Encrypt-then-MAC).
    Rejects malformed versions, tampered ciphertexts, wrong keys, or altered salts
    prior to any block cipher decryption.
    
    Args:
        package: XCS256CiphertextPackage to decrypt.
        master_key: 32-byte secret authority key.
        associated_data: Metadata bound to the record.
        capture_traces: If True, captures educational Feistel reverse traces.
        
    Returns:
        Decrypted original plaintext bytes.
        
    Raises:
        AuthenticationFailedError: If tag does not match (tampering / wrong key).
        InvalidPaddingError: If padding is invalid.
        XCS256Error: For structural or length violations.
    """
    if package.version != VERSION_BYTE:
        raise XCS256Error(f"Unsupported algorithm version: {package.version.hex()}")
    if len(package.ciphertext) % BLOCK_SIZE != 0 or len(package.ciphertext) == 0:
        raise XCS256Error(f"Ciphertext length ({len(package.ciphertext)}) is not a non-zero multiple of 32 bytes.")

    # 1. Derive keys via HKDF-SHA256
    keys = derive_xcs256_keys(master_key=master_key, salt=package.salt)

    # 2. CRITICAL: Authenticate BEFORE decrypting
    is_valid = verify_authentication_tag(
        auth_key=keys.k_mac,
        expected_tag=package.tag,
        version=package.version,
        salt=package.salt,
        ciphertext=package.ciphertext,
        associated_data=associated_data
    )
    if not is_valid:
        raise AuthenticationFailedError(
            "Cryptographic authentication failed. Ciphertext, salt, or associated metadata was tampered with, "
            "or the master key is incorrect."
        )

    # 3. Decrypt blocks in CBC mode
    num_blocks = len(package.ciphertext) // BLOCK_SIZE
    plaintext_blocks = []
    prev_cipher_block = keys.iv

    for i in range(num_blocks):
        ct_block = package.ciphertext[i * BLOCK_SIZE : (i + 1) * BLOCK_SIZE]
        raw_decrypted, traces = xcs256_decrypt_block(ct_block, keys)
        # CBC un-XOR
        pt_block = xor_bytes(raw_decrypted, prev_cipher_block)
        plaintext_blocks.append(pt_block)
        prev_cipher_block = ct_block

    padded_plaintext = b"".join(plaintext_blocks)

    # 4. Remove PKCS#7 padding
    return pkcs7_unpad(padded_plaintext, BLOCK_SIZE)
