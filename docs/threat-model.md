# Threat Model and Security Analysis

## 1. System Assets

In the context of the Secure E-Voting System, the critical assets to protect are categorized below:

| Asset Category | Description | Primary Security Objective |
| :--- | :--- | :--- |
| **Voter Credentials** | Argon2id password hashes, JWT signing keys, session tokens. | Confidentiality & Authenticity |
| **Voter Eligibility** | Account status, verified email status, election authorization. | Integrity |
| **Ballot Secrecy** | Association between individual voter identity and their candidate selection. | Confidentiality |
| **Ballot Record Integrity** | Stored encrypted payload, salt, HMAC tag, BLAKE2s hash, Ed25519 signature. | Integrity & Authenticity |
| **Election Tally Integrity** | Final aggregated vote counts per candidate. | Integrity & Correctness |
| **Audit Ledger** | Historical event log, Merkle tree leaves, Merkle root. | Tamper-Evidence |
| **Authority Private Key** | Master 256-bit key and Ed25519 private signing key. | Confidentiality & Non-repudiation |

---

## 2. Threat Actors & Attacker Capabilities

```
                       +-----------------------------------+
                       |        Attacker Personas          |
                       +-----------------------------------+
                                         |
     +-------------------+---------------+-------------------+-------------------+
     |                   |                                   |                   |
[Voter / Eavesdropper] [Rogue DB Administrator]   [Partisan Adversary]   [Semi-Honest Admin]
- Double voting        - Direct SQL modifications - Traffic sniffing     - Early result leak
- Receipt forgery      - Silent ballot mutation   - Replay attacks       - Selective deletion
- Status scanning      - Salt/Tag manipulation    - Forced deactivation
```

1. **Malicious Voter / Impersonator:** Attempts to vote multiple times in the same election, forge a Vote ID receipt, cast votes on behalf of other users, or vote without verifying their email address.
2. **Passive Network Eavesdropper:** Listens to HTTP traffic between client and server, attempting to correlate network payloads or timestamps with specific candidates.
3. **Rogue Database Administrator (Compromised Storage):** Has direct read/write access to `evoting.db`. Attempts to quietly modify voter choices, alter voter IDs, or forge election tallies.
4. **Partisan Adversary:** Attempts denial-of-service, replay attacks, or submission of malformed cryptographic payloads to crash the verification pipeline.
5. **Semi-Honest Election Authority:** Follows protocol operations but attempts to peek at decrypted ballot contents prior to election closing.

---

## 3. Trust Boundaries

- **Boundary 1: Voter Client ⟷ Backend API Gateway.**
  - *Trust Level:* Untrusted. All inputs, headers, and tokens are rigorously validated using Pydantic models. Client-side state is never trusted.
- **Boundary 2: Public Verification Endpoint ⟷ Ballot Record Store.**
  - *Trust Level:* Strict Privacy Filter. The public verification endpoint responds with proof of valid inclusion (`VALID_RECORDED`, timestamp, Merkle leaf match) but strictly strips and zeroizes the candidate selection.
- **Boundary 3: Live Election Data ⟷ Tamper-Detection Sandbox.**
  - *Trust Level:* Strict Isolation. Tamper demonstration operations are restricted to dedicated mock records (`is_demo=True` or isolated test records) and never modify production election tallies.
- **Boundary 4: Backend Application ⟷ Database Storage.**
  - *Trust Level:* Tamper-Evident. The backend treats raw database records as potentially vulnerable to offline modification; every record's BLAKE2s digest and Ed25519 signature are cryptographically re-evaluated upon retrieval.

---

## 4. Threat Matrix, Mitigations, and Residual Risks

| Threat / Attack Vector | Severity | Implemented Mitigation | Residual Risk / Limitations |
| :--- | :--- | :--- | :--- |
| **Double Voting** | **CRITICAL** | Database unique constraint on `(voter_id, election_id)` + atomic backend transaction validation. | Minimal; guaranteed by ACID properties of the database engine. |
| **Unverified Account Voting** | **HIGH** | `require_verified_voter` FastAPI dependency checks `email_verified == True` before ballot submission. | Relies on token email delivery security in production environments. |
| **Direct Database Tampering** (Flipping encrypted ballot or tag) | **CRITICAL** | Encrypt-then-MAC (HMAC-SHA256) rejects modified ciphertexts; BLAKE2s digest detects byte shifts; Ed25519 signature fails verification; Merkle root recalculation exposes ledger corruption. | Does not prevent a malicious DB admin with write access from deleting the database file itself (requires external replication/backups). |
| **Ballot Choice Disclosure via Verification Endpoint** | **HIGH** | `/api/v1/verification/verify` specifically returns `VerificationResponse` omitting `candidate_id` or plaintext ballot. | If the backend authority master key is stolen, the attacker can decrypt the encrypted payloads in storage. |
| **Replay Attacks** | **MEDIUM** | Fresh 16-byte random salt generated per encryption; unique Vote ID generated cryptographically; nonce derivation bound to record. | Replay of raw HTTP vote submission is rejected because the voter ID is marked as already voted. |
| **Key Confusion / Re-use across Rounds** | **MEDIUM** | HKDF-SHA256 with strict ASCII domain separation strings (`xcs256-f1-xchacha-roundkey`, `xcs256-f2-serpent-roundkey`, etc.) derives independent keys. | None within the scope of the derived keys. |
| **Experimental Cipher Cryptanalysis** | **HIGH** | XCS-256 is explicitly isolated as an experimental prototype; Encrypt-then-MAC ensures that ciphertext tampering is rejected prior to Feistel decryption. | XCS-256 does not possess a formal peer-reviewed security proof. It is strictly for academic research and capstone evaluation. |

---

## 5. Summary of Trust Assumptions

1. **Backend Server Integrity:** The backend environment running the FastAPI application and holding memory-resident authority keys is assumed not to be root-compromised.
2. **Authority Key Confidentiality:** The 256-bit master authority key and Ed25519 private key are kept private on the server.
3. **Cryptographic Primitives:** The standard underlying primitives (HMAC-SHA256, BLAKE2s, Ed25519, HKDF-SHA256, XChaCha20, Serpent) are assumed to have no algorithmic breaks.
