from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.database.database import get_db
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin
from app.utils.security import hash_password, verify_password
from app.utils.jwt_handler import create_access_token, get_current_user
from app.utils.permissions import require_role


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# ---------------------------------------------------------
# Password Change Schema
# ---------------------------------------------------------

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)


# ---------------------------------------------------------
# Test Authentication Router
# ---------------------------------------------------------

@router.get("/test")
def test():
    return {
        "message": "Authentication router is working"
    }


# ---------------------------------------------------------
# Register
# ---------------------------------------------------------

@router.post("/register")
def register(
    user: UserRegister,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password=hash_password(user.password),
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "id": new_user.id
    }


# ---------------------------------------------------------
# Login
# ---------------------------------------------------------

@router.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    db_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid Email"
        )

    if not verify_password(
        user.password,
        db_user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid Password"
        )

    access_token = create_access_token(
        {
            "sub": db_user.email,
            "role": db_user.role
        }
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "full_name": db_user.full_name,
            "email": db_user.email,
            "role": db_user.role
        }
    }


# ---------------------------------------------------------
# Profile
# ---------------------------------------------------------

@router.get("/profile")
def profile(
    current_user=Depends(get_current_user)
):
    return {
        "message": "Authorized User",
        "user": current_user
    }


# ---------------------------------------------------------
# Change Password
# ---------------------------------------------------------

@router.post("/change-password")
def change_password(
    password_data: ChangePasswordRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get logged-in user's email from JWT
    email = current_user.get("email")

    if not email:
        raise HTTPException(
            status_code=401,
            detail="User information not found"
        )

    # Find user in database
    db_user = db.query(User).filter(
        User.email == email
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Verify current password
    if not verify_password(
        password_data.current_password,
        db_user.password
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )

    # Prevent using the same password
    if verify_password(
        password_data.new_password,
        db_user.password
    ):
        raise HTTPException(
            status_code=400,
            detail="New password must be different from the current password"
        )

    # Hash and save new password
    db_user.password = hash_password(
        password_data.new_password
    )

    db.commit()
    db.refresh(db_user)

    return {
        "message": "Password changed successfully"
    }


# ---------------------------------------------------------
# Admin Dashboard
# ---------------------------------------------------------

@router.get("/admin")
def admin_dashboard(
    current_user=Depends(require_role("Admin"))
):
    return {
        "message": "Welcome Admin",
        "user": current_user
    }


# ---------------------------------------------------------
# Quality Engineer Dashboard
# ---------------------------------------------------------

@router.get("/quality")
def quality_dashboard(
    current_user=Depends(
        require_role("Quality Engineer")
    )
):
    return {
        "message": "Welcome Quality Engineer",
        "user": current_user
    }