# API Reference

All endpoints are rooted under `/api/v1`. Interactive OpenAPI/Swagger documentation is available at `http://127.0.0.1:8000/docs` when the backend is running.

---

## 1. Authentication Endpoints (`/api/v1/auth`)

### `POST /auth/register`
Register a new voter account.
- **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "usr-uuid...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "voter",
    "email_verified": false,
    "verification_token": "dev-verify-token-...",
    "message": "Registration successful. Please verify your email."
  }
  ```

### `POST /auth/verify-email`
Confirm email address using verification token.
- **Request Body:** `{"token": "dev-verify-token-..."}`
- **Response (200 OK):** `{"message": "Email verified successfully. You may now log in and vote."}`

### `POST /auth/login`
Authenticate voter or administrator using Argon2id password verification.
- **Request Body:** `{"email": "jane@example.com", "password": "Password123!"}`
- **Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": "usr-uuid...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "voter",
      "email_verified": true,
      "account_status": "ACTIVE"
    }
  }
  ```

### `GET /auth/me`
Retrieve profile of currently authenticated user.
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):** User profile object.

---

## 2. Elections Endpoints (`/api/v1/elections`)

### `GET /elections/active`
Retrieve list of currently OPEN elections accessible for ballot casting.
- **Response (200 OK):** Array of election objects with candidates.

### `GET /elections/{election_id}`
Retrieve election details and candidate list.

### `POST /elections` *(Admin Only)*
Create a new election.
- **Request Body:**
  ```json
  {
    "title": "2026 Student Council Presidential Election",
    "description": "Annual student election.",
    "start_at": "2026-10-18T00:00:00Z",
    "end_at": "2026-10-25T23:59:59Z"
  }
  ```

### `PATCH /elections/{election_id}/status` *(Admin Only)*
Transition election status (`DRAFT`, `OPEN`, `CLOSED`, `CANCELLED`).
- **Request Body:** `{"status": "OPEN"}`

### `POST /elections/{election_id}/candidates` *(Admin Only)*
Add candidate to election.
- **Request Body:**
  ```json
  {
    "display_name": "Eleanor Vance",
    "description": "Advancing transparent campus policies.",
    "display_order": 1
  }
  ```

---

## 3. Voting Endpoints (`/api/v1/voting`)

### `POST /voting/submit`
Cast an encrypted, authenticated, and signed ballot.
- **Headers:** `Authorization: Bearer <voter_token>`
- **Request Body:**
  ```json
  {
    "election_id": "elec-uuid...",
    "candidate_id": 1,
    "consent_confirmed": true
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "status": "RECORDED",
    "public_vote_id": "VOTE-ABCD-1234-EFGH",
    "election_id": "elec-uuid...",
    "record_hash": "a1b2c3d4...",
    "created_at_iso": "2026-10-18T20:00:00Z",
    "message": "Vote cryptographically sealed and permanently recorded."
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Election is not open, voter has already voted, or account is unverified.
  - `404 Not Found`: Candidate does not belong to election.

### `GET /voting/status/{election_id}`
Check whether current voter has voted in the specified election.

### `GET /voting/my-votes`
Retrieve receipts (Vote ID, election title, timestamp, record hash) for current voter.

---

## 4. Verification Endpoints (`/api/v1/verification`)

### `GET /verification/verify?vote_id={public_vote_id}` *(Public)*
Verifies ballot integrity without disclosing the candidate choice.
- **Response (200 OK):**
  ```json
  {
    "public_vote_id": "VOTE-ABCD-1234-EFGH",
    "election_id": "elec-uuid...",
    "status": "VALID_RECORDED",
    "created_at_iso": "2026-10-18T20:00:00Z",
    "record_hash": "a1b2c3d4...",
    "signature_valid": true,
    "hmac_auth_tag_valid": true,
    "merkle_included": true,
    "merkle_root": "e5f6g7h8..."
  }
  ```

### `GET /verification/public-key` *(Public)*
Retrieve the Election Authority's Ed25519 public key in PEM and hex formats.

### `GET /verification/merkle-root/{election_id}` *(Public)*
Retrieve the current Merkle root for the election ledger.

### `GET /verification/proof/{public_vote_id}` *(Public)*
Retrieve the Merkle tree inclusion proof for independent verification.

---

## 5. Admin & Security Endpoints (`/api/v1/admin`)

### `GET /admin/dashboard-metrics`
Returns real-time database metrics:
- `total_elections`, `active_elections`, `registered_voters`, `votes_cast`
- `verified_records`, `invalid_records`
- `current_merkle_root`, `last_integrity_check`

### `GET /admin/voters`
List and filter registered voters by email status and activity.

### `PATCH /admin/voters/{user_id}/status`
Deactivate or reactivate a voter account.

### `POST /admin/system-integrity-check/{election_id}`
Executes a complete re-verification of all stored ballot records for the election:
1. Re-computes canonical JSON bytes.
2. Validates HMAC-SHA256 Encrypt-then-MAC authentication tag.
3. Checks BLAKE2s digest.
4. Verifies Ed25519 digital signature with Authority public key.
5. Re-computes Merkle tree root and compares against recorded root.

### `POST /admin/tamper-demo/mutate`
Mutates an isolated test ballot record in the database (flipping ciphertext bits or altering metadata) to demonstrate real cryptographic failure detection.

### `POST /admin/tamper-demo/reset`
Restores the test ballot record to its valid cryptographic state.

---

## 6. Audit & Results Endpoints

### `GET /audit/logs` *(Admin Only)*
Returns paginated audit trail events (`actor`, `action`, `target_reference`, `status`, `timestamp`).

### `POST /results/calculate/{election_id}` *(Admin Only)*
Tally verified votes for a closed election.

### `POST /results/publish/{election_id}` *(Admin Only)*
Publish tallied results for public inspection.

### `GET /results/published/{election_id}` *(Public)*
View official published election results.
