import uuid
from datetime import datetime
from typing import Optional

from bootstrap.db import get_db
from fastapi import APIRouter, Depends, status
from internal.password import get_password_hash
from internal.respond import respond_http
from models.user import User, UserRole
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern="^[a-zA-Z0-9_]+$")
    password: str = Field(..., min_length=6)
    user_fullname: str = Field(..., min_length=1, max_length=100)
    user_role: UserRole
    user_email: EmailStr


class UserInfoResponse(BaseModel):
    id: uuid.UUID
    username: str
    user_email: EmailStr
    user_fullname: str
    user_role: UserRole
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Router
router = APIRouter()


@router.post(
    "/register",
    response_model=UserInfoResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    responses={
        status.HTTP_409_CONFLICT: {
            "description": "Username or email already registered"
        },
        status.HTTP_400_BAD_REQUEST: {"description": "Invalid input data"},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"description": "Internal server error"},
    },
)
async def register_user(
    request_data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User).where(
        (User.username == request_data.username)
        | (User.user_email == request_data.user_email)
    )
    result = await db.execute(stmt)
    existing_user = result.scalars().first()

    if existing_user:
        if existing_user.username == request_data.username:
            return respond_http(
                status_code=status.HTTP_409_CONFLICT,
                status="error",
                message="Username already registered.",
            )

        if existing_user.user_email == request_data.user_email:
            return respond_http(
                status_code=status.HTTP_409_CONFLICT,
                status="error",
                message="Email already registered.",
            )

    hashed_password = get_password_hash(request_data.password)

    new_user_data = {
        "username": request_data.username,
        "hashed_password": hashed_password,
        "user_fullname": request_data.user_fullname,
        "user_email": request_data.user_email,
        "user_role": request_data.user_role,
    }

    print(new_user_data) 

    new_user = User(**new_user_data)

    try:
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
    except IntegrityError: 
        await db.rollback()
        return respond_http(
            status_code=status.HTTP_409_CONFLICT,
            status="error",
            message="User registration conflict. Please try again.",
        )
    except Exception as e:
        await db.rollback()
        print(f"Error during user registration: {e}")  # Basic logging
        return respond_http(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            status="error",
            message="An unexpected error occurred during registration.",
        )

    return respond_http(
        status_code=status.HTTP_201_CREATED,
        status="success",
        message="User registered successfully.",
        data={
            "id": str(new_user.id),
            "username": new_user.username,
            "user_email": new_user.user_email,
            "user_fullname": new_user.user_fullname,
            "user_role": new_user.user_role,
            "created_at": str(new_user.created_at),
            "updated_at": str(new_user.updated_at),
        },
    )
