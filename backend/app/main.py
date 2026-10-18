"""
FastAPI Application Entry Point for Secure E-Voting System.

Provides public and administrative cryptographic voting APIs,
database initialization, CORS configuration, and OpenAPI documentation.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import engine, Base
from app.core.security import AuthorityCryptoState
import app.models  # Ensure all models are registered with Base.metadata

# Import API routes
from app.api.routes.auth import router as auth_router
from app.api.routes.elections import router as elections_router
from app.api.routes.voting import router as voting_router
from app.api.routes.verification import router as verification_router
from app.api.routes.admin import router as admin_router
from app.api.routes.audit import router as audit_router
from app.api.routes.results import router as results_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    # Warm up authority keys in memory
    AuthorityCryptoState.get_signing_keys()
    AuthorityCryptoState.get_master_key()
    yield


app = FastAPI(
    title="Secure E-Voting System API",
    description=(
        "Full-Stack E-Voting System with Enhanced Vote Verification, "
        "Tamper-Evident Auditing, XCS-256 Feistel Encryption, BLAKE2s Record Hashing, "
        "Ed25519 Digital Signatures, and Merkle Tree Proofs."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(elections_router, prefix=settings.API_V1_STR)
app.include_router(voting_router, prefix=settings.API_V1_STR)
app.include_router(verification_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)
app.include_router(results_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "title": "A Secure E-Voting System with Enhanced Vote Verification and Tamper-Evident Auditing",
        "domain": "Cryptography and Network Security",
        "status": "online",
        "docs_url": "/docs",
        "authority_public_key_hex": AuthorityCryptoState.get_public_key_hex()
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "connected"}
