"""
Tests for Merkle Tree construction, root calculation, inclusion proofs, and domain separation.
"""

from app.crypto.merkle_tree import MerkleTree, verify_inclusion_proof, EMPTY_TREE_ROOT
from app.crypto.hashing import blake2s_digest


def test_empty_merkle_tree():
    """Verify empty Merkle tree produces defined empty root."""
    tree = MerkleTree([])
    assert tree.root == EMPTY_TREE_ROOT
    assert len(tree.root_hex) == 64


def test_single_leaf_merkle_tree():
    """Verify single leaf Merkle tree calculates domain-separated root."""
    leaf_hash = blake2s_digest(b"Record 1")
    tree = MerkleTree([leaf_hash])
    assert tree.root == tree.get_leaf_hash(0)
    proof = tree.get_inclusion_proof(0)
    assert proof == []
    assert verify_inclusion_proof(leaf_hash, proof, tree.root) is True


def test_merkle_tree_inclusion_proofs_even():
    """Verify inclusion proofs for 4 leaves (balanced tree)."""
    hashes = [blake2s_digest(f"Record {i}".encode()) for i in range(4)]
    tree = MerkleTree(hashes)
    assert len(tree.levels) == 3  # Leaves (4), Layer 1 (2), Root (1)

    for idx, h in enumerate(hashes):
        proof = tree.get_inclusion_proof(idx)
        assert len(proof) == 2
        assert verify_inclusion_proof(h, proof, tree.root) is True


def test_merkle_tree_inclusion_proofs_odd():
    """Verify inclusion proofs for 5 leaves (odd number with node duplication)."""
    hashes = [blake2s_digest(f"Record {i}".encode()) for i in range(5)]
    tree = MerkleTree(hashes)

    for idx, h in enumerate(hashes):
        proof = tree.get_inclusion_proof(idx)
        assert verify_inclusion_proof(h, proof, tree.root) is True


def test_merkle_tampered_proof_rejected():
    """Verify tampered hash or sibling fails verification against root."""
    hashes = [blake2s_digest(f"Record {i}".encode()) for i in range(4)]
    tree = MerkleTree(hashes)
    proof = tree.get_inclusion_proof(0)

    # Fake record hash
    fake_hash = blake2s_digest(b"Fake Record")
    assert verify_inclusion_proof(fake_hash, proof, tree.root) is False

    # Corrupt sibling hash in proof
    tampered_proof = [dict(step) for step in proof]
    tampered_proof[0]["sibling"] = "00" * 32
    assert verify_inclusion_proof(hashes[0], tampered_proof, tree.root) is False
