# End-to-End User and Administrator Guide

This guide provides step-by-step instructions for operating both the Public Voter Portal and the Admin Security Suite.

---

## 1. Demo Credentials Quick-Reference

The development database is pre-seeded with verified test accounts:

| Role | Email Address | Password | Description |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@evoting.gov` | `AdminSecurePass123!` | Full administrative and security audit access |
| **Voter 1** | `alice@evoting.gov` | `VoterPass123!` | Verified voter (has cast ballot in Election 1) |
| **Voter 2** | `bob@evoting.gov` | `VoterPass123!` | Verified voter (has cast ballot in Election 1) |
| **Voter 3** | `charlie@evoting.gov` | `VoterPass123!` | Verified voter (eligible to vote in open elections) |
| **Voter 4** | `dave@evoting.gov` | `VoterPass123!` | Unverified account for testing verification flow |

> **Convenience Feature:** On both `/login` and `/admin/login`, click the **"Quick Demo Login"** buttons to auto-populate credentials with one click.

---

## 2. Voter Experience Walkthrough

### Step 1: Registration & Email Verification
1. Navigate to `http://localhost:5173/register`.
2. Fill in Name, Email, and Password. Click **"Create Voter Account"**.
3. On the verification screen, enter the verification token (conveniently pre-filled or displayed in the development environment) and click **"Verify Email"**.

### Step 2: Login
1. Navigate to `http://localhost:5173/login`.
2. Enter email and password (or click "Login as Charlie"). Click **"Sign In as Voter"**.
3. You will be redirected to the **Voter Dashboard**.

### Step 3: Browse Elections & Select Candidate
1. Click **"Active Elections"** or **"Browse Elections"** in the navigation bar.
2. Select an active election (e.g. *2026 University Student Council Presidential Election*).
3. Review the candidate list, manifesto descriptions, and ballot terms.
4. Select your preferred candidate by clicking their card.

### Step 4: Confirm Submission
1. Review the final confirmation modal.
2. Note the alert: **"Once submitted, votes are cryptographically sealed and cannot be altered or re-cast."**
3. Check the consent box and click **"Confirm & Cast Ballot"**.

### Step 5: Receive Vote ID Receipt
1. Upon successful submission, the **Vote Confirmation** page displays your unique receipt:
   - **Public Vote ID:** Non-sequential alphanumeric identifier (e.g. `VOTE-C5D1-82A7-90E4`).
   - **Timestamp:** Canonical ISO-8601 UTC timestamp.
   - **Record Hash:** 64-character BLAKE2s digest.
2. Click **"Copy Vote ID"** or **"Verify My Vote Now"**.

### Step 6: Verify Recorded Ballot (Zero-Disclosure Audit)
1. Navigate to `http://localhost:5173/verify`.
2. Paste your Vote ID and click **"Verify Record"**.
3. The system contacts the backend audit service and displays:
   - **Verification Status:** `VALID_RECORDED` (Green banner).
   - **Cryptographic Checks:**
     - HMAC-SHA256 Encrypt-then-MAC tag verified.
     - BLAKE2s canonical record hash matches ledger.
     - Authority Ed25519 digital signature verified.
     - Merkle tree inclusion proof verified against current root.
   - **Privacy Notice:** Candidate choice is completely zeroized and never exposed in the response.

---

## 3. Administrator & Security Auditor Walkthrough

### Step 1: Admin Authentication
1. Navigate to `http://localhost:5173/admin/login` (Notice this is a dedicated, protected administrator portal).
2. Enter `admin@evoting.gov` / `AdminSecurePass123!` (or click "Quick Fill Admin").
3. Click **"Sign In to Security Suite"**.

### Step 2: System Overview Dashboard (`/admin`)
- Inspect real-time database metrics: Total Elections, Active Elections, Registered Voters, Total Votes Cast, Verified Records, Invalid Records, and Current Merkle Root.

### Step 3: Election Management (`/admin/elections`)
- Create new elections with start and end timestamps.
- Add and manage candidates per election.
- Transition election statuses (`DRAFT` → `OPEN` → `CLOSED`).

### Step 4: Voter Management (`/admin/voters`)
- Search and filter registered voters by name, email, or verification status.
- Toggle voter status (`ACTIVE` vs `DEACTIVATED`). Passwords and raw hashes are never displayed.

### Step 5: Cryptographic Inspection Suite (`/admin/security/*`)
- **XCS-256 Encryption (`/admin/security/xcs256`):** Run live testbed encryptions, inspect derived HKDF round keys, raw XChaCha20 keystreams, Serpent 128-bit block substitution, and Feistel diffusion telemetry.
- **BLAKE2s Hashes (`/admin/security/hashes`):** Inspect RFC 8785 canonical JSON serialization determinism and 256-bit digests.
- **Ed25519 Signatures (`/admin/security/signatures`):** Inspect the Authority public key (PEM/Hex), test signature creation, and verify digital signatures against modified messages.
- **Merkle Tree (`/admin/security/merkle`):** Inspect visual tree levels, leaf hashes, root recalculation, and verify inclusion audit paths.
- **Vote Verification (`/admin/security/verification`):** Search any ballot record to run end-to-end cryptographic checks.
- **System Integrity Check (`/admin/security/integrity`):** Click **"Run Full Integrity Audit"** to re-verify every stored ballot in the election simultaneously.

### Step 6: Tamper-Detection Demonstration (`/admin/tamper-demo`)
> [!IMPORTANT]
> This feature operates exclusively on an isolated test record (`is_demo=True`) to demonstrate real cryptographic failure detection without corrupting production election data.

1. Navigate to `/admin/tamper-demo`.
2. Notice the test record is initially in a **VALID** cryptographic state.
3. Choose a tampering mutation:
   - **Mutate Ciphertext:** Flips bits in the encrypted ballot payload.
   - **Mutate Salt:** Alters the per-record cryptographic salt.
   - **Mutate Authentication Tag:** Alters the HMAC-SHA256 integrity tag.
4. Click **"Execute Tamper Mutation"**.
5. The system immediately re-evaluates the record against all 4 cryptographic checks:
   - HMAC Tag Check: **FAILED** (Integrity broken)
   - BLAKE2s Digest Check: **FAILED** (Hash mismatch)
   - Ed25519 Signature Check: **FAILED** (Unauthentic signature)
   - Merkle Tree Inclusion: **FAILED** (Root mismatch)
6. Detailed error diagnostics explain why the verification failed.
7. Click **"Reset Test Record"** to restore clean cryptographic state.

### Step 7: Results Calculation and Publication (`/admin/results`)
1. Once an election is `CLOSED`, select it in Results Management.
2. Click **"Calculate & Verify Tallies"**. The system decrypts ballots with the authority key and aggregates candidate counts.
3. Click **"Publish Official Results"**.
4. The published tally is immediately accessible on the public portal at `/results`.
