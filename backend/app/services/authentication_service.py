"""
Authentication and Voter Account Service.
"""

from typing import Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.auth import UserRegisterRequest, UserLoginRequest
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    generate_verification_token
)


def register_user(db: Session, request: UserRegisterRequest, role: str = "voter") -> User:
    """Registers a new voter with Argon2id password hash and verification token."""
    existing = db.query(User).filter(User.email == request.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # Hash with Argon2id
    pwd_hash = hash_password(request.password)
    verification_token = generate_verification_token()

    user = User(
        name=request.name.strip(),
        email=request.email.lower().strip(),
        password_hash=pwd_hash,
        role=role,
        email_verified=False if role == "voter" else True,  # Admins auto-verified in dev/seed
        verification_token=verification_token,
        account_status="active"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Audit log
    audit = AuditLog(
        actor=user.email,
        action="USER_REGISTERED",
        target_reference=f"user:{user.id}",
        status="SUCCESS",
        safe_metadata=f'{{"role": "{role}", "verification_token": "{verification_token}"}}'
    )
    db.add(audit)
    db.commit()

    return user


def verify_user_email(db: Session, email: str, token: str) -> User:
    """Verifies a voter's email using the verification code."""
    user = db.query(User).filter(User.email == email.lower()).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    
    if user.email_verified:
        return user

    if user.verification_token != token.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please check and try again."
        )

    user.email_verified = True
    user.verification_token = None
    db.commit()
    db.refresh(user)

    audit = AuditLog(
        actor=user.email,
        action="EMAIL_VERIFIED",
        target_reference=f"user:{user.id}",
        status="SUCCESS"
    )
    db.add(audit)
    db.commit()

    return user


def authenticate_user(db: Session, request: UserLoginRequest, required_role: Optional[str] = None) -> Tuple[User, str]:
    """Authenticates user credentials, enforces role separation and active account status."""
    user = db.query(User).filter(User.email == request.email.lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if user.account_status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact the Election Commission."
        )

    if required_role and user.role != required_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access restricted. Account role '{user.role}' is not authorized for this portal."
        )

    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    return user, token
