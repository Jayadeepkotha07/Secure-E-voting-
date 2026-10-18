# Cryptographic and Architectural Limitations

In accordance with responsible engineering practices and academic integrity, this document explicitly articulates the cryptographic assumptions, design trade-offs, and technical limitations of the Secure E-Voting System demonstration.

---

## 1. Experimental Cipher Limitations (XCS-256)

1. **Absence of Formal Security Proof:**
   The hybrid Feistel cipher **XCS-256** is an experimental academic prototype. While it alternates established primitives (XChaCha20 stream generation and 128-bit block Serpent substitution) and incorporates domain-separated HKDF key derivation, it has **not** undergone public cryptanalysis, differential cryptanalysis, linear cryptanalysis, or algebraic attack verification.
2. **Comparison with Standard AEAD Ciphers:**
   Standard authenticated encryption ciphers such as AES-256-GCM, ChaCha20-Poly1305, and ASCON-128 have undergone decades of rigorous peer review and NIST standardization. XCS-256 makes no claim of superior security over these ciphers.
3. **Round Count:**
   Four Feistel rounds are sufficient to provide full diffusion of input halves, but do not provide the safety margin of 16-to-32 round ciphers against advanced slide or boomerang attacks.
4. **Mandatory Safe-Usage Rule:**
   XCS-256 must **never** be deployed in national elections, production financial infrastructure, or healthcare environments.

---

## 2. Ballot Secrecy & Privacy Limitations

1. **Storage Confidentiality vs. True Anonymity:**
   The demonstration achieves **storage confidentiality** (ballots are encrypted at rest with HMAC authentication) and **public audit privacy** (the `/verification/verify` endpoint returns verification proofs without revealing the candidate choice).
2. **Centralized Authority Decryption:**
   In this demonstration, the Election Authority holds the master key required to decrypt ballots during tally calculation. Consequently, a rogue administrator with access to both the backend memory and the database could theoretically decrypt ballots.
3. **Contrast with Production E2E-V Systems:**
   Real-world production End-to-End Verifiable (E2E-V) voting protocols (e.g. Helios Voting, Microsoft ElectionGuard, or Belenios) implement:
   - **Threshold Cryptography:** The private decryption key is split among multiple independent trustees (e.g. via Shamir's Secret Sharing or threshold ElGamal) so that no single party can decrypt ballots alone.
   - **Homomorphic Encryption:** Votes are added together while still encrypted, allowing the final tally to be decrypted without ever decrypting individual ballots.
   - **Cryptographic Mix-Nets & Zero-Knowledge Proofs:** Ballots are shuffled and re-encrypted across multiple independent mixing servers with ZK-SNARKs proving correctness without disclosing voter identity.

---

## 3. Coercion Resistance & Receipt-Freeness

1. **Receipt Privacy:**
   The system provides a non-sequential Vote ID (`VOTE-XXXX-XXXX-XXXX`) that allows a voter to verify that their ballot was included in the Merkle tree. Because the verification response omits candidate details, a voter cannot easily use the public verification portal to prove to a coercer which candidate they voted for.
2. **Residual Coercion Risk:**
   If an adversary forces a voter to log in to their voter portal or stand behind them while they cast their vote, the system cannot prevent coercion. Advanced systems implement decoy credentials or fake ballots (e.g. Juels-Catalano-Jakobsson protocol) to achieve formal receipt-freeness.

---

## 4. Operational & Infrastructure Limitations

1. **Database Scalability:**
   The SQLite implementation with synchronous SQLAlchemy sessions is optimized for demonstration, testing, and capstone evaluation (up to tens of thousands of ballots). For municipal or national scale, an enterprise database cluster (PostgreSQL with read replicas) and asynchronous connection pooling would be required.
2. **Incremental Merkle Trees:**
   In the demonstration, the Merkle tree is recomputed from the set of active records during system integrity checks. In high-throughput streaming environments, an append-only Sparse Merkle Tree (SMT) or incremental accumulator would be employed.
3. **Simulated Email Delivery:**
   To facilitate seamless local evaluation without requiring external SMTP credentials, email verification tokens are surfaced directly in the development UI and API response payloads.
