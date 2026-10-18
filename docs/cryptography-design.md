# Cryptographic Pipeline Design

## 1. End-to-End Cryptographic Record Pipeline

The cryptographic record pipeline guarantees confidentiality of cast ballots in storage, unforgeable authenticity from the election authority, deterministic ledger hashing, and tamper-evident Merkle tree auditing.

```
+-----------------------------------------------------------------------------------------+
|                                    VOTER SUBMISSION                                     |
|  Plaintext Ballot: {"election_id": "...", "candidate_id": 2, "voter_id": "...", ...}     |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
| [1] KEY EXPANSION: HKDF-SHA256                                                          |
| Master Secret (32B) + Fresh Salt (16B)                                                  |
| ├── K_F1 (32B)  - XChaCha20 Round 1 Key         ├── K_HMAC (32B) - Authentication Tag   |
| ├── N_F1 (24B)  - XChaCha20 Round 1 Nonce       ├── K_IV   (32B) - CBC Mode IV          |
| ├── K_F2 (32B)  - Serpent Round 2 Key           ├── K_F3   (32B) - XChaCha20 Round 3    |
| └── K_F4 (32B)  - Serpent Round 4 Key           └── N_F3   (24B) - XChaCha20 Round 3    |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
| [2] CONFIDENTIAL ENCRYPTION: XCS-256 (Four-Round Hybrid Feistel)                        |
| Input padded via PKCS#7 to 32-byte blocks. Executed in Cipher Block Chaining (CBC) mode.|
| Round 1: Raw XChaCha20 stream function F1(R0, K_F1, N_F1)                               |
| Round 2: Standard 128-bit block Serpent cipher F2(R1, K_F2)                             |
| Round 3: Raw XChaCha20 stream function F3(R2, K_F3, N_F3)                               |
| Round 4: Standard 128-bit block Serpent cipher F4(R3, K_F4)                             |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
| [3] INTEGRITY & AUTHENTICITY: Encrypt-then-MAC (HMAC-SHA256)                            |
| Tag = HMAC-SHA256(K_HMAC, Version || Salt || IV || Associated_Data || Ciphertext)        |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
| [4] CANONICAL ENCRYPTED VOTE RECORD FORMATION                                           |
| Encapsulates: vote_id, election_id, encrypted_payload_hex, salt_hex, iv_hex,             |
| auth_tag_hex, created_at_iso                                                            |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
| [5] RECORD DIGEST: BLAKE2s-256                                                          |
| Canonical JSON bytes (RFC 8785) serialized deterministically.                           |
| Record Hash = BLAKE2s(canonical_bytes, digest_size=32)                                  |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
| [6] AUTHORITY DIGITAL SIGNATURE: Ed25519                                                |
| Authority Private Key signs Record Hash: Signature = Ed25519_Sign(SK, Record_Hash)       |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
| [7] AUDIT LEDGER: Domain-Separated Binary Merkle Tree                                   |
| Leaf Hashes = BLAKE2s(0x00 || Record_Hash)                                              |
| Internal Nodes = BLAKE2s(0x01 || Left_Child || Right_Child)                             |
| Merkle Root produced for public verification & O(log N) inclusion proofs                |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Component Specifications

### 2.1 Key Derivation Function: HKDF-SHA256 (RFC 5869)
To prevent cross-algorithm key re-use, all internal keys are derived from a 256-bit Election Authority Master Key ($K_{master}$) and a per-ballot 128-bit random cryptographic salt ($S_{record} \leftarrow \text{CSPRNG}(16)$):
$$\text{PRK} = \text{HKDF-Extract}(S_{record}, K_{master})$$
$$\text{Subkey}_i = \text{HKDF-Expand}(\text{PRK}, \text{info}=\text{ASCII\_LABEL}, L=\text{length})$$

**Domain Separation Labels:**
- `b"xcs256-f1-xchacha-roundkey"` (32 bytes)
- `b"xcs256-f1-xchacha-roundnonce"` (24 bytes)
- `b"xcs256-f2-serpent-roundkey"` (32 bytes)
- `b"xcs256-f3-xchacha-roundkey"` (32 bytes)
- `b"xcs256-f3-xchacha-roundnonce"` (24 bytes)
- `b"xcs256-f4-serpent-roundkey"` (32 bytes)
- `b"xcs256-cbc-initialization-vector"` (32 bytes)
- `b"xcs256-hmac-authentication-key"` (32 bytes)

### 2.2 Canonical Record Serialization (RFC 8785)
Cryptographic signatures and hashes fail if whitespace, key order, or numeric formatting fluctuate between platforms. The canonical serialization implementation strictly enforces:
1. Object keys sorted lexicographically according to UTF-16 code units.
2. No extraneous whitespace between tokens (separators `(",", ":")`).
3. Explicit UTC ISO-8601 timestamps ending in `Z` (`YYYY-MM-DDTHH:MM:SSZ`).
4. Strict UTF-8 byte encoding.

### 2.3 Record Hashing: BLAKE2s-256
BLAKE2s-256 (RFC 7693) is utilized for ballot record hashing. It is optimized for 8-to-32-bit platforms, highly resistant to length-extension attacks, and immune to known collision attacks affecting MD5 and SHA-1.
$$\text{Record\_Hash} = \text{BLAKE2s-256}(\text{Canonical\_Bytes})$$

### 2.4 Digital Signatures: Ed25519 (RFC 8032)
The Election Authority signs the canonical record hash using Ed25519 (Edwards-curve Digital Signature Algorithm over Curve25519):
- **Private Key:** 32-byte seed stored securely in backend server environment.
- **Public Key:** 32-byte point on Curve25519 published in `/api/v1/verification/public-key`.
- **Signature Length:** 64 bytes.
- **Properties:** Immune to side-channel timing attacks, deterministic (no reliance on flawed random number generators during signing).

### 2.5 Binary Merkle Tree with Domain Separation
The Merkle tree organizes all verified vote records within an election:
- **Leaf Hashing:** $\text{Leaf}_i = \text{BLAKE2s}(0\text{x}00 \mathbin{\Vert} \text{Record\_Hash}_i)$
- **Internal Node Hashing:** $\text{Node} = \text{BLAKE2s}(0\text{x}01 \mathbin{\Vert} \text{Left\_Child} \mathbin{\Vert} \text{Right\_Child})$
- **Odd Node Handling:** In levels with an odd number of nodes, the trailing node is duplicated: $\text{Node} = \text{BLAKE2s}(0\text{x}01 \mathbin{\Vert} \text{Trailing} \mathbin{\Vert} \text{Trailing})$.
- **Inclusion Proof:** An audit path consisting of sibling hashes along the path from leaf to root, enabling $O(\log_2 N)$ cryptographic proof of inclusion.

---

## 3. College Viva Quick Reference

- **Why HKDF instead of simple hashing?** HKDF guarantees cryptographic randomness extraction and proper key expansion with domain separation labels, preventing related-key attacks.
- **Why Encrypt-then-MAC instead of MAC-then-Encrypt?** Encrypt-then-MAC guarantees ciphertext integrity before decryption occurs, completely eliminating padding-oracle attacks.
- **Why domain separation in Merkle trees?** Prefixing leaves with `0x00` and internal nodes with `0x01` prevents second-preimage attacks where an attacker tricks a verifier into accepting an internal node as a leaf.
- **Why Ed25519 instead of RSA-2048?** Ed25519 provides stronger 128-bit security level with smaller 64-byte signatures, faster computation, and built-in protection against timing side channels.
