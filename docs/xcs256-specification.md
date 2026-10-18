# XCS-256 Algorithm Specification (Experimental)

> [!CAUTION]
> **RESEARCH PROTOTYPE DISCLAIMER**
> XCS-256 is an experimental research construction developed exclusively for academic evaluation in a college capstone project. It is **not** an NIST-standardized or formally cryptanalyzed cipher. Do **not** deploy XCS-256 in real-world critical infrastructure or national elections without independent cryptanalytic review.

---

## 1. Mathematical Construction

XCS-256 is a 256-bit balanced Feistel network composed of four alternating rounds:
- Two rounds based on the **XChaCha20** stream cipher primitive ($F_1, F_3$).
- Two rounds based on the **Serpent** block cipher primitive ($F_2, F_4$).

### 1.1 Block Representation
Each 256-bit block $B$ is represented as two 128-bit halves:
$$B = L_0 \mathbin{\Vert} R_0 \quad (|L_0| = 16 \text{ bytes}, |R_0| = 16 \text{ bytes})$$

### 1.2 Forward Feistel Rounds (Encryption)
For each round $i \in \{1, 2, 3, 4\}$:
$$L_i = R_{i-1}$$
$$R_i = L_{i-1} \oplus F_i(R_{i-1}, K_i)$$

After round 4, the halves are joined with the standard final Feistel swap:
$$\text{Ciphertext Block } C = R_4 \mathbin{\Vert} L_4$$

### 1.3 Inverse Feistel Rounds (Decryption)
Given ciphertext block $C = R_4 \mathbin{\Vert} L_4$:
Let $R_4 = C[0:16]$ and $L_4 = C[16:32]$.

Decryption traverses in reverse order ($i = 4, 3, 2, 1$):
$$R_{i-1} = L_i$$
$$L_{i-1} = R_i \oplus F_i(L_i, K_i)$$

Recovered plaintext block:
$$P = L_0 \mathbin{\Vert} R_0$$

---

## 2. Round Function Definitions

```
            +----------------------------------------------------+
            |               Input Half R (128-bit)               |
            +----------------------------------------------------+
                                      |
         +----------------------------+----------------------------+
         |                                                         |
         v (Rounds 1 & 3)                                          v (Rounds 2 & 4)
+---------------------------------+                       +---------------------------------+
| F_XChaCha20(R, K, Nonce)        |                       | F_Serpent(R, K)                 |
| 1. Keystream = XChaCha20(K, N,  |                       | 1. Serpent block cipher         |
|                length=16)       |                       |    instance with 256-bit key K  |
| 2. Output = R XOR Keystream     |                       | 2. Output = Encrypt_Block(R)    |
| (16 bytes / 128 bits)           |                       | (16 bytes / 128 bits)           |
+---------------------------------+                       +---------------------------------+
```

### 2.1 XChaCha20 Round Functions ($F_1$ and $F_3$)
- **Key:** 256-bit derived subkey $K_{F1}$ or $K_{F3}$.
- **Nonce:** 192-bit (24-byte) derived nonce $N_{F1}$ or $N_{F3}$.
- **Mechanism:** The raw XChaCha20 stream cipher is initialized with key $K$ and nonce $N$. It generates a 16-byte keystream. The round output is:
$$F_{XChaCha20}(R, K, N) = R \oplus \text{XChaCha20\_Stream}(K, N, \text{length}=16)$$
- **Telemetry:** In the admin security interface, intermediate diffusion metrics and nonces are visible for educational auditing.

### 2.2 Serpent Round Functions ($F_2$ and $F_4$)
- **Primitive:** Verified 128-bit block Serpent cipher via `pyserpent.Serpent`.
- **Key:** 256-bit derived subkey $K_{F2}$ or $K_{F4}$.
- **Mechanism:** The 128-bit input $R$ is treated as a single block and transformed through Serpent's 32 rounds of S-box substitution and linear mixing:
$$F_{Serpent}(R, K) = \text{Serpent\_128}(K, R)$$

---

## 3. Modes of Operation & Multi-Block Handling

For arbitrary payload lengths (e.g. structured JSON ballots), XCS-256 operates in **Cipher Block Chaining (CBC)** mode with **PKCS#7 padding**:

1. **Padding:** Plaintext $P$ is padded to a multiple of 32 bytes (256 bits).
   If $|P| \bmod 32 = 0$, a full 32-byte padding block is appended.
2. **IV Derivation:** A 32-byte initialization vector $\text{IV}$ is derived deterministically from the master authority key and per-record salt via HKDF.
3. **CBC Encryption:**
   $$C_0 = \text{Feistel\_Encrypt}(P_0 \oplus \text{IV})$$
   $$C_j = \text{Feistel\_Encrypt}(P_j \oplus C_{j-1}) \quad \text{for } j \ge 1$$
4. **CBC Decryption:**
   $$P_0 = \text{Feistel\_Decrypt}(C_0) \oplus \text{IV}$$
   $$P_j = \text{Feistel\_Decrypt}(C_j) \oplus C_{j-1} \quad \text{for } j \ge 1$$
   PKCS#7 padding is verified in constant time and stripped.

---

## 4. Encrypt-then-MAC Authentication Wrapper

To protect against active chosen-ciphertext attacks, padding oracle vulnerabilities, and bit-flipping attacks, XCS-256 enforces **Encrypt-then-MAC**:

- **Authentication Key:** 256-bit key $K_{HMAC}$ derived via HKDF (`xcs256-hmac-authentication-key`).
- **Authenticated Data Package:**
$$M_{auth} = \text{Version (0x01)} \mathbin{\Vert} \text{Salt (16B)} \mathbin{\Vert} \text{IV (32B)} \mathbin{\Vert} \text{Associated\_Data} \mathbin{\Vert} \text{Ciphertext}$$
- **Tag Generation:**
$$\text{Tag} = \text{HMAC-SHA256}(K_{HMAC}, M_{auth})$$
- **Verification:** Before passing ciphertext to CBC decryption, the HMAC tag is re-computed and verified using `hmac.compare_digest`. Decryption fails immediately with `AuthenticationTagVerificationError` if the tag does not match.
