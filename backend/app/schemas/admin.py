"""
Admin Dashboard and Management Schemas.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict


class AdminDashboardMetricsResponse(BaseModel):
    total_elections: int
    active_elections: int
    registered_voters: int
    votes_cast: int
    verified_records: int
    invalid_records: int
    current_merkle_root: Optional[str] = None
    last_integrity_check: Optional[datetime] = None
    authority_public_key_hex: str


class VoterAdminViewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: str
    email_verified: bool
    account_status: str
    created_at: datetime
    votes_cast_count: int


class VoterStatusUpdateRequest(BaseModel):
    account_status: Optional[str] = None  # "active", "deactivated"
    email_verified: Optional[bool] = None


class TamperMutationRequest(BaseModel):
    mutation_type: str  # "ciphertext_byte_flip", "salt_mutation", "tag_corruption", "hash_tampering"


class TamperMutationResponse(BaseModel):
    test_record_id: str
    mutation_applied: str
    original_state: Dict[str, Any]
    mutated_state: Dict[str, Any]
    verification_check_failed: str
    failure_details: str
    is_tampered_flag_set: bool
    restored: bool
