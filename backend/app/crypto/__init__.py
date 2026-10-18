"""
Cryptographic Primitives and Pipelines for Secure E-Voting System.
"""

from app.crypto.key_derivation import derive_xcs256_keys, XCS256KeySchedule
from app.crypto.xchacha_round import xchacha20_round_function
from app.crypto.serpent_round import serpent_round_function
from app.crypto.feistel import xcs256_encrypt_block, xcs256_decrypt_block
from app.crypto.xcs256 import (
    xcs256_encrypt,
    xcs256_decrypt,
    XCS256CiphertextPackage,
    XCS256Error,
    AuthenticationFailedError,
    InvalidPaddingError,
    pkcs7_pad,
    pkcs7_unpad
)
from app.crypto.authentication import (
    compute_authentication_tag,
    verify_authentication_tag,
    VERSION_BYTE
)
from app.crypto.hashing import blake2s_digest, blake2s_hex, hash_record
from app.crypto.signatures import (
    generate_ed25519_keypair,
    sign_message,
    verify_signature,
    public_key_to_pem,
    load_public_key_from_pem,
    public_key_to_raw_hex,
    load_public_key_from_raw_hex
)
from app.crypto.merkle_tree import MerkleTree, verify_inclusion_proof
from app.crypto.serialization import serialize_vote_record_for_hash, canonical_json_bytes

__all__ = [
    "derive_xcs256_keys",
    "XCS256KeySchedule",
    "xchacha20_round_function",
    "serpent_round_function",
    "xcs256_encrypt_block",
    "xcs256_decrypt_block",
    "xcs256_encrypt",
    "xcs256_decrypt",
    "XCS256CiphertextPackage",
    "XCS256Error",
    "AuthenticationFailedError",
    "InvalidPaddingError",
    "pkcs7_pad",
    "pkcs7_unpad",
    "compute_authentication_tag",
    "verify_authentication_tag",
    "VERSION_BYTE",
    "blake2s_digest",
    "blake2s_hex",
    "hash_record",
    "generate_ed25519_keypair",
    "sign_message",
    "verify_signature",
    "public_key_to_pem",
    "load_public_key_from_pem",
    "public_key_to_raw_hex",
    "load_public_key_from_raw_hex",
    "MerkleTree",
    "verify_inclusion_proof",
    "serialize_vote_record_for_hash",
    "canonical_json_bytes"
]
