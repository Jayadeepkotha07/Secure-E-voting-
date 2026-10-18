"""
Authentication Routes.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    EmailVerificationRequest,
    TokenResponse,
    UserResponse
)
from app.services.authentication_service import (
    register_user,
    verify_user_email,
    authenticate_user
)
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(request: UserRegisterRequest, db: Session = Depends(get_db)):
    """Registers a new voter account."""
    user = register_user(db=db, request=request, role="voter")
    return user


@router.post("/verify-email", response_model=UserResponse)
def verify_email(request: EmailVerificationRequest, db: Session = Depends(get_db)):
    """Verifies voter email using confirmation code."""
    user = verify_user_email(db=db, email=request.email, token=request.token)
    return user


@router.post("/login", response_model=TokenResponse)
def login(request: UserLoginRequest, db: Session = Depends(get_db)):
    """Logs in voter or admin and returns JWT bearer token."""
    user, token = authenticate_user(db=db, request=request)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/admin-login", response_model=TokenResponse)
def admin_login(request: UserLoginRequest, db: Session = Depends(get_db)):
    """Dedicated login route for administrative officials."""
    user, token = authenticate_user(db=db, request=request, required_role="admin")
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns profile for currently authenticated user."""
    return current_user
