"""
Database Seeding Script for Secure E-Voting System.

Provisions default development accounts, elections, candidates, and initial cryptographic records.
WARNING: DEVELOPMENT / DEMONSTRATION USE ONLY.
"""

import sys
import os
from datetime import datetime, timedelta, timezone

# Ensure backend directory is in python path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_dir)

from app.db.session import SessionLocal, Base, engine
from app.models.user import User
from app.models.election import Election
from app.models.candidate import Candidate
from app.models.vote_record import VoteRecord
from app.models.audit_log import AuditLog
from app.core.security import hash_password, AuthorityCryptoState, generate_public_vote_id
from app.crypto import (
    xcs256_encrypt,
    serialize_vote_record_for_hash,
    hash_record,
    sign_message,
    MerkleTree
)


def seed():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "admin@evoting.gov").first():
            print("Database already contains seed data. Skipping creation.")
            return

        print("Creating Administrator Account...")
        admin = User(
            name="Chief Election Administrator",
            email="admin@evoting.gov",
            password_hash=hash_password("AdminSecurePass123!"),
            role="admin",
            email_verified=True,
            account_status="active"
        )
        db.add(admin)

        print("Creating Test Voters...")
        alice = User(
            name="Alice Walker",
            email="alice@university.edu",
            password_hash=hash_password("VoterAlice123!"),
            role="voter",
            email_verified=True,
            account_status="active"
        )
        bob = User(
            name="Bob Smith",
            email="bob@university.edu",
            password_hash=hash_password("VoterBob123!"),
            role="voter",
            email_verified=True,
            account_status="active"
        )
        charlie = User(
            name="Charlie Brown",
            email="charlie@university.edu",
            password_hash=hash_password("VoterCharlie123!"),
            role="voter",
            email_verified=True,
            account_status="active"
        )
        unverified = User(
            name="Dave Unverified",
            email="dave@university.edu",
            password_hash=hash_password("Unverified123!"),
            role="voter",
            email_verified=False,
            verification_token="123456",
            account_status="active"
        )
        db.add_all([alice, bob, charlie, unverified])
        db.commit()
        db.refresh(admin)
        db.refresh(alice)
        db.refresh(bob)
        db.refresh(charlie)

        print("Creating Sample Elections...")
        now = datetime.now(timezone.utc)
        elec1 = Election(
            title="2026 University Student Council Presidential Election",
            description=(
                "Annual election for the President of the Student Council. "
                "All registered students are eligible to cast one verifiable vote."
            ),
            start_at=now - timedelta(days=1),
            end_at=now + timedelta(days=5),
            status="open"
        )
        elec2 = Election(
            title="Department Faculty Representative Election",
            description="Election to select the faculty representative for Engineering and Sciences.",
            start_at=now - timedelta(hours=6),
            end_at=now + timedelta(days=2),
            status="open"
        )
        elec3 = Election(
            title="Campus Sustainability Initiative Referendum",
            description="Binding student referendum on expanding renewable solar power across campus.",
            start_at=now + timedelta(days=7),
            end_at=now + timedelta(days=14),
            status="draft"
        )
        db.add_all([elec1, elec2, elec3])
        db.commit()
        db.refresh(elec1)
        db.refresh(elec2)

        print("Adding Candidates...")
        c1 = Candidate(
            election_id=elec1.id,
            display_name="Dr. Elena Vance",
            party="Progress & Innovation Alliance",
            description="Advocating for expanded student research funding, campus connectivity, and open labs.",
            display_order=1
        )
        c2 = Candidate(
            election_id=elec1.id,
            display_name="Marcus Thorne",
            party="Academic Integrity Coalition",
            description="Focusing on student academic welfare, fair grading policies, and campus transparency.",
            display_order=2
        )
        c3 = Candidate(
            election_id=elec1.id,
            display_name="Sarah Lin",
            party="Student Well-Being & Equity",
            description="Championing mental health resources, accessible housing, and dining improvements.",
            display_order=3
        )

        c4 = Candidate(
            election_id=elec2.id,
            display_name="Prof. Alan Turing",
            party="Computer Science Division",
            description="Focus on computational research grants and lab infrastructure modernization.",
            display_order=1
        )
        c5 = Candidate(
            election_id=elec2.id,
            display_name="Prof. Ada Lovelace",
            party="Cybersecurity & Software Division",
            description="Focus on interdisciplinary programs and secure software engineering research.",
            display_order=2
        )
        db.add_all([c1, c2, c3, c4, c5])
        db.commit()
        db.refresh(c1)
        db.refresh(c2)

        print("Seeding Initial Cryptographic Votes for Alice and Bob...")
        master_key = AuthorityCryptoState.get_master_key()
        priv_key, _ = AuthorityCryptoState.get_signing_keys()

        # Seed vote for Alice
        v1_id = generate_public_vote_id()
        p1 = f'{{"election_id": {elec1.id}, "candidate_id": {c1.id}, "entropy": "seed_alice"}}'.encode()
        pkg1 = xcs256_encrypt(p1, master_key, associated_data=v1_id.encode())
        t1 = now - timedelta(hours=3)
        t1_iso = t1.strftime("%Y-%m-%dT%H:%M:%SZ")
        canon1 = serialize_vote_record_for_hash(
            election_id=elec1.id,
            public_vote_id=v1_id,
            version=pkg1.version.hex(),
            salt_hex=pkg1.salt.hex(),
            ciphertext_hex=pkg1.ciphertext.hex(),
            tag_hex=pkg1.tag.hex(),
            created_at_iso=t1_iso
        )
        h1 = hash_record(canon1)
        sig1 = sign_message(priv_key, h1)

        rec1 = VoteRecord(
            public_vote_id=v1_id,
            election_id=elec1.id,
            voter_id=alice.id,
            version=pkg1.version.hex(),
            salt=pkg1.salt.hex(),
            encrypted_payload=pkg1.ciphertext.hex(),
            authentication_tag=pkg1.tag.hex(),
            record_hash=h1.hex(),
            signature=sig1.hex(),
            verification_status="valid",
            is_test_record=False,
            created_at_iso=t1_iso,
            created_at=t1
        )
        db.add(rec1)

        # Seed vote for Bob
        v2_id = generate_public_vote_id()
        p2 = f'{{"election_id": {elec1.id}, "candidate_id": {c2.id}, "entropy": "seed_bob"}}'.encode()
        pkg2 = xcs256_encrypt(p2, master_key, associated_data=v2_id.encode())
        t2 = now - timedelta(hours=1)
        t2_iso = t2.strftime("%Y-%m-%dT%H:%M:%SZ")
        canon2 = serialize_vote_record_for_hash(
            election_id=elec1.id,
            public_vote_id=v2_id,
            version=pkg2.version.hex(),
            salt_hex=pkg2.salt.hex(),
            ciphertext_hex=pkg2.ciphertext.hex(),
            tag_hex=pkg2.tag.hex(),
            created_at_iso=t2_iso
        )
        h2 = hash_record(canon2)
        sig2 = sign_message(priv_key, h2)

        rec2 = VoteRecord(
            public_vote_id=v2_id,
            election_id=elec1.id,
            voter_id=bob.id,
            version=pkg2.version.hex(),
            salt=pkg2.salt.hex(),
            encrypted_payload=pkg2.ciphertext.hex(),
            authentication_tag=pkg2.tag.hex(),
            record_hash=h2.hex(),
            signature=sig2.hex(),
            verification_status="valid",
            is_test_record=False,
            created_at_iso=t2_iso,
            created_at=t2
        )
        db.add(rec2)
        db.commit()

        # Build Merkle tree for election 1
        tree = MerkleTree([h1, h2])
        elec1.merkle_root = tree.root_hex
        rec1.merkle_index = 0
        rec2.merkle_index = 1
        db.commit()

        # Seed initial audit log
        audit = AuditLog(
            actor="system:seed",
            action="SYSTEM_INITIALIZED",
            target_reference="system:evoting",
            status="SUCCESS",
            safe_metadata='{"version": "1.0.0", "seeded_elections": 3, "seeded_voters": 4}'
        )
        db.add(audit)
        db.commit()

        print("\n=======================================================")
        print("SEEDING COMPLETE!")
        print("-------------------------------------------------------")
        print("Default Administrative Account:")
        print("  Email:    admin@evoting.gov")
        print("  Password: AdminSecurePass123!")
        print("\nTest Voter Accounts:")
        print("  Email:    alice@university.edu   (Password: VoterAlice123!) [Voted]")
        print("  Email:    bob@university.edu     (Password: VoterBob123!)   [Voted]")
        print("  Email:    charlie@university.edu (Password: VoterCharlie123!) [Ready to Vote]")
        print("  Email:    dave@university.edu    (Password: Unverified123!)   [Code: 123456]")
        print("-------------------------------------------------------")
        print(f"Alice's Vote ID for Verification: {v1_id}")
        print(f"Bob's Vote ID for Verification:   {v2_id}")
        print(f"Current Election 1 Merkle Root:   {elec1.merkle_root}")
        print("=======================================================\n")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
