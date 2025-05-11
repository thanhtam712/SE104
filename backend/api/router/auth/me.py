import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, EmailStr

from api.middleware.jwt_auth import get_current_user
from models.user import User, UserRole
from internal.respond import respond_http


class UserMeResponse(BaseModel):
    id: uuid.UUID
    username: str
    user_email: EmailStr
    user_fullname: str
    user_role: UserRole
    disabled: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


router = APIRouter()


@router.get(
    "/me",
    response_model=UserMeResponse,
    summary="Get current user information",
    status_code=status.HTTP_200_OK,
)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Get information about the currently authenticated user.
    """
    # return UserMeResponse.from_orm(current_user)
    return respond_http(
        status_code=status.HTTP_200_OK,
        status="success",
        message="User information retrieved successfully.",
        data={
            "id": str(current_user.id),
            "username": current_user.username,
            "user_email": current_user.user_email,
            "user_fullname": current_user.user_fullname,
            "user_role": current_user.user_role,
        },
    )
