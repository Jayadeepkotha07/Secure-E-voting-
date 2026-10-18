"""
Export all Pydantic schemas.
"""

from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    EmailVerificationRequest,
    TokenResponse,
    UserResponse
)
from app.schemas.election import (
    ElectionCreateRequest,
    ElectionUpdateRequest,
    CandidateCreateRequest,
    CandidateResponse,
    ElectionResponse,
    ElectionDetailResponse
)
from app.schemas.vote import (
    CastVoteRequest,
    CastVoteResponse,
    VoterStatusResponse
)
from app.schemas.verification import (
    PublicVerifyVoteRequest,
    PublicVerifyVoteResponse,
    AdminVerifyVoteDetailResponse,
    SystemIntegrityReportResponse,
    InclusionProofStep
)
from app.schemas.admin import (
    AdminDashboardMetricsResponse,
    VoterAdminViewResponse,
    VoterStatusUpdateRequest,
    TamperMutationRequest,
    TamperMutationResponse
)
from app.schemas.audit import AuditLogResponse
from app.schemas.results import CandidateTally, ElectionResultsResponse

__all__ = [
    "UserRegisterRequest",
    "UserLoginRequest",
    "EmailVerificationRequest",
    "TokenResponse",
    "UserResponse",
    "ElectionCreateRequest",
    "ElectionUpdateRequest",
    "CandidateCreateRequest",
    "CandidateResponse",
    "ElectionResponse",
    "ElectionDetailResponse",
    "CastVoteRequest",
    "CastVoteResponse",
    "VoterStatusResponse",
    "PublicVerifyVoteRequest",
    "PublicVerifyVoteResponse",
    "AdminVerifyVoteDetailResponse",
    "SystemIntegrityReportResponse",
    "InclusionProofStep",
    "AdminDashboardMetricsResponse",
    "VoterAdminViewResponse",
    "VoterStatusUpdateRequest",
    "TamperMutationRequest",
    "TamperMutationResponse",
    "AuditLogResponse",
    "CandidateTally",
    "ElectionResultsResponse",
]
