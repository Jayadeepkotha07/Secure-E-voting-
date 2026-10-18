"""
Merkle Tree Implementation with Explicit Domain Separation.

Uses BLAKE2s with prefix-based domain separation:
  - Leaf hash: BLAKE2s(0x00 || record_hash)
  - Internal node: BLAKE2s(0x01 || left_child || right_child)
Provides root calculation, cryptographic inclusion proofs, and proof verification.
"""

from typing import List, Dict, Any, Optional, Tuple
from app.crypto.hashing import blake2s_digest


LEAF_PREFIX = b"\x00"
NODE_PREFIX = b"\x01"
EMPTY_TREE_ROOT = blake2s_digest(b"EMPTY_MERKLE_TREE_V1")


class MerkleTree:
    """
    Binary Merkle Tree constructed from an ordered list of record hashes.
    """

    def __init__(self, record_hashes: List[bytes]):
        """
        Builds Merkle Tree from a list of raw record hashes.
        
        Args:
            record_hashes: List of 32-byte BLAKE2s record hashes.
        """
        self.raw_hashes = record_hashes
        self.levels: List[List[bytes]] = []
        self._build_tree()

    def _hash_leaf(self, record_hash: bytes) -> bytes:
        """Domain-separated leaf hash: BLAKE2s(0x00 || record_hash)."""
        return blake2s_digest(LEAF_PREFIX + record_hash)

    def _hash_node(self, left: bytes, right: bytes) -> bytes:
        """Domain-separated internal node hash: BLAKE2s(0x01 || left || right)."""
        return blake2s_digest(NODE_PREFIX + left + right)

    def _build_tree(self) -> None:
        if not self.raw_hashes:
            self.levels = [[]]
            return

        # Level 0: Leaf nodes
        current_level = [self._hash_leaf(h) for h in self.raw_hashes]
        self.levels.append(current_level)

        # Build upwards until root
        while len(current_level) > 1:
            next_level: List[bytes] = []
            for i in range(0, len(current_level), 2):
                left = current_level[i]
                if i + 1 < len(current_level):
                    right = current_level[i + 1]
                else:
                    # Odd number of nodes: duplicate last node
                    right = left
                parent = self._hash_node(left, right)
                next_level.append(parent)
            self.levels.append(next_level)
            current_level = next_level

    @property
    def root(self) -> bytes:
        """Returns 32-byte Merkle root digest."""
        if not self.raw_hashes or not self.levels or not self.levels[-1]:
            return EMPTY_TREE_ROOT
        return self.levels[-1][0]

    @property
    def root_hex(self) -> str:
        """Returns hex-encoded Merkle root."""
        return self.root.hex()

    def get_leaf_hash(self, index: int) -> bytes:
        """Returns domain-separated leaf hash for record at index."""
        if index < 0 or index >= len(self.raw_hashes):
            raise IndexError("Record index out of bounds.")
        return self.levels[0][index]

    def get_inclusion_proof(self, index: int) -> List[Dict[str, str]]:
        """
        Generates Merkle audit path (inclusion proof) for record at index.
        
        Returns:
            List of proof steps: [{"sibling": hex_hash, "position": "left" | "right"}]
        """
        if index < 0 or index >= len(self.raw_hashes):
            raise IndexError("Record index out of bounds.")

        proof = []
        curr_idx = index

        # Walk up through levels except root
        for lvl in range(len(self.levels) - 1):
            level = self.levels[lvl]
            is_right_child = (curr_idx % 2 == 1)
            
            if is_right_child:
                sibling_idx = curr_idx - 1
                sibling_pos = "left"
            else:
                sibling_idx = curr_idx + 1
                sibling_pos = "right"
                if sibling_idx >= len(level):
                    # Duplicated odd node
                    sibling_idx = curr_idx

            sibling_hash = level[sibling_idx]
            proof.append({
                "sibling": sibling_hash.hex(),
                "position": sibling_pos
            })

            curr_idx = curr_idx // 2

        return proof

    def to_visualization_tree(self) -> Dict[str, Any]:
        """Exports tree structure for visualization in Admin UI."""
        return {
            "root_hex": self.root_hex,
            "leaf_count": len(self.raw_hashes),
            "depth": len(self.levels),
            "levels": [
                [h.hex() for h in lvl] for lvl in self.levels
            ]
        }


def verify_inclusion_proof(
    record_hash: bytes,
    proof: List[Dict[str, str]],
    expected_root: bytes
) -> bool:
    """
    Verifies that a record hash is contained within a Merkle tree with expected_root.
    
    Args:
        record_hash: 32-byte BLAKE2s hash of canonical record.
        proof: List of proof steps [{"sibling": hex, "position": "left" | "right"}].
        expected_root: 32-byte root against which to verify.
        
    Returns:
        True if valid inclusion proof, False otherwise.
    """
    # 1. Compute leaf hash with domain separation
    current_hash = blake2s_digest(LEAF_PREFIX + record_hash)

    # 2. Ascend tree using proof siblings
    for step in proof:
        sibling = bytes.fromhex(step["sibling"])
        pos = step["position"]
        if pos == "left":
            current_hash = blake2s_digest(NODE_PREFIX + sibling + current_hash)
        elif pos == "right":
            current_hash = blake2s_digest(NODE_PREFIX + current_hash + sibling)
        else:
            return False

    return current_hash == expected_root
