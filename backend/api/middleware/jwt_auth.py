import uuid
import json
from typing import Optional

from bootstrap.config import config
from bootstrap.db import get_db
from fastapi import Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from internal.respond import respond_http
from jose import JWTError, jwt
from models.user import User
from pydantic import BaseModel, ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    uid: Optional[str] = None


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
) -> User:
    # Use respond_http for consistent error response
    def credentials_response(message="Could not validate credentials"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    try:
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
        print("Decoded JWT payload:", payload)

        token_data = TokenPayload(**payload)
        if token_data.uid is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )

        user_id_str = token_data.uid
    except JWTError as e:
        print(f"JWTError: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    except ValidationError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
        )

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if user is None:
        return credentials_response()

    if user.disabled:
        # return JSONResponse(
        #     status_code=status.HTTP_400_BAD_REQUEST,
        #     content=respond_http(
        #         status_code=status.HTTP_400_BAD_REQUEST,
        #         status="error",
        #         message="Inactive user",
        #         data=None,
        #     ).body,
        # )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    return user


async def get_current_active_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    def credentials_response(message="Could not validate credentials"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "status": "error",
                "message": message,
                "data": None,
            },
        )

    if current_user.user_role.value != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not enough permissions",
        )

    return current_user
