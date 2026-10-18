"""
Verification schemas for Public and Admin interfaces.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel


class PublicVerifyVoteRequest(BaseModel):
    public_vote_id: str


class PublicVerifyVoteResponse(BaseModel):
    public_vote_id: str
    election_id: int
    election_title: str
    is_recorded: bool
    is_valid: bool
    merkle_inclusion_verified: bool
    signature_verified: bool
    hash_integrity_verified: bool
    recorded_at: datetime
    message: str


class InclusionProofStep(BaseModel):
    sibling: str
    position: str


class AdminVerifyVoteDetailResponse(BaseModel):
    internal_id: int
    public_vote_id: str
    election_id: int
    election_title: str
    version: str
    salt: str
    ciphertext: str
    authentication_tag: str
    record_hash: str
    signature: str
    is_test_record: bool
    created_at: datetime

    # Cryptographic check results
    hash_verified: bool
    signature_verified: bool
    mac_authenticated: bool
    merkle_root: Optional[str] = None
    merkle_index: Optional[int] = None
    merkle_proof: List[InclusionProofStep] = []
    merkle_inclusion_verified: bool
    overall_status: str  # "VALID" | "TAMPERED"
    failure_reasons: List[str] = []


class SystemIntegrityReportResponse(BaseModel):
    total_elections: int
    total_records_checked: int
    valid_records_count: int
    tampered_records_count: int
    authority_public_key_hex: str
    overall_system_healthy: bool
    timestamp: datetime
    elections_audit: List[Dict[str, Any]]
    anomalies: List[str] = []
