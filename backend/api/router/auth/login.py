import uuid
from datetime import datetime, timedelta
from typing import Optional

from bootstrap.config import config
from bootstrap.db import get_db
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from internal.password import verify_password
from internal.respond import respond_http
from internal.token import create_access_token, create_refresh_token
from models.session import Session
from models.user import User, UserRole
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select


class UserInDB(BaseModel):
    username: str
    hashed_password: str
    role: str
    id: uuid.UUID  # Changed from int to uuid.UUID
    disabled: bool = False


class TokenData(BaseModel):
    username: Optional[str] = None


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=6)


class LoginResponse(BaseModel):
    session_id: uuid.UUID
    access_token: str
    access_token_expires_in: datetime
    refresh_token: str
    refresh_token_expires_in: datetime
    token_type: str = "bearer"
    name: str | None = None
    userrole: str | None = None
    email: str | None = None
    username: str | None = None


# --- Router ---
router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),  # Changed: Use OAuth2PasswordRequestForm
    db: AsyncSession = Depends(get_db),
):
    print("Login attempt with username:", form_data.username)
    print("Login attempt with password:", form_data.password)

    stmt = select(User).where(User.username == form_data.username)
    result = await db.execute(stmt)
    user = result.scalars().first()

    # Check if user exists and password is correct
    if not user or not verify_password(form_data.password, user.hashed_password):
        return respond_http(
            status_code=status.HTTP_401_UNAUTHORIZED,
            status="error",
            message="Incorrect username or password",
        )

    if user.disabled:
        return respond_http(
            status_code=status.HTTP_400_BAD_REQUEST,
            status="error",
            message="Inactive user",
        )

    access_token_expires = timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token, access_token_expire_time = create_access_token(
        data={
            "sub": user.username,
            "uid": str(user.id),
        },
        expires_delta=access_token_expires,
    )

    refresh_token_expires = timedelta(days=config.REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token, refresh_token_expire_time = create_refresh_token(
        data={"sub": user.username, "uid": str(user.id)},
        expires_delta=refresh_token_expires,
    )

    session_id = uuid.uuid4()
    user_fullname = user.user_fullname
    user_role = user.user_role
    user_email = user.user_email
    username = user.username

    # Create SQLAlchemy DBSession model instance for DB persistence
    db_session = Session(
        id=session_id,
        user_id=user.id,  # user.id is UUID, matching DBSession.user_id type
        refresh_token=refresh_token,
        expires_in=refresh_token_expire_time,
        is_active=True,
    )
    db.add(db_session)
    await db.commit()

    # return respond_http(
    #     status_code=status.HTTP_200_OK,
    #     status="success",
    #     message="Login successful",
    #     data={
    #         "session_id": str(session_id),
    #         "access_token": access_token,
    #         "access_token_expires_in": str(access_token_expire_time),
    #         "refresh_token": refresh_token,
    #         "refresh_token_expires_in": str(refresh_token_expire_time),
    #         "name": user_fullname,
    #         "userrole": user_role,
    #         "email": user_email,
    #         "username": username,
    #     },
    # )

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "session_id": str(session_id),
            "access_token": access_token,
            "access_token_expires_in": str(access_token_expire_time),
            "refresh_token": refresh_token,
            "refresh_token_expires_in": str(refresh_token_expire_time),
            "name": user_fullname,
            "userrole": user_role,
            "email": user_email,
            "username": username,
        },
    )
