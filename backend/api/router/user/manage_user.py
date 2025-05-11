import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from bootstrap.db import get_db
from internal.respond import respond_http
from internal.password import get_password_hash
from models.user import User, UserRole
from api.middleware.jwt_auth import get_current_active_admin

router = APIRouter()


class UpdateUserRequest(BaseModel):
    username: Optional[str] = Field(
        None, min_length=3, max_length=50, pattern="^[a-zA-Z0-9_]+$"
    )
    user_fullname: Optional[str] = Field(None, min_length=1, max_length=100)
    user_email: Optional[EmailStr] = None
    user_role: Optional[UserRole] = None
    disabled: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6)


@router.put("/{user_id}", status_code=status.HTTP_200_OK)
async def update_user_info(
    user_id: uuid.UUID,
    request_data: UpdateUserRequest,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin),
):
    """
    Update user information. Admin role required.
    """
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user_to_update = result.scalars().first()

    if not user_to_update:
        return respond_http(
            status_code=status.HTTP_404_NOT_FOUND,
            status="error",
            message="User not found.",
        )

    update_data = request_data.model_dump(exclude_unset=True)

    if "password" in update_data and update_data["password"]:
        hashed_password = get_password_hash(update_data["password"])
        user_to_update.hashed_password = hashed_password
        del update_data["password"]  # Avoid trying to set it directly

    for field, value in update_data.items():
        setattr(user_to_update, field, value)

    try:
        await db.commit()
        await db.refresh(user_to_update)
    except Exception as e:
        await db.rollback()
        # Log error e
        return respond_http(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            status="error",
            message=f"An error occurred while updating user: {str(e)}",
        )

    return respond_http(
        status_code=status.HTTP_200_OK,
        status="success",
        message="User information updated successfully.",
        data={
            "id": str(user_to_update.id),
            "username": user_to_update.username,
            "user_email": user_to_update.user_email,
            "user_fullname": user_to_update.user_fullname,
            "user_role": user_to_update.user_role.value
            if user_to_update.user_role
            else None,
            "disabled": user_to_update.disabled,
            "created_at": str(user_to_update.created_at),
            "updated_at": str(user_to_update.updated_at),
        },
    )


@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user_account(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin),
):
    """
    Delete a user account. Admin role required.
    """
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user_to_delete = result.scalars().first()

    if not user_to_delete:
        return respond_http(
            status_code=status.HTTP_404_NOT_FOUND,
            status="error",
            message="User not found.",
        )

    if user_to_delete.id == current_admin.id:
        return respond_http(
            status_code=status.HTTP_403_FORBIDDEN,
            status="error",
            message="Admin users cannot delete their own account.",
        )

    try:
        await db.delete(user_to_delete)
        await db.commit()
    except Exception as e:
        await db.rollback()
        # Log error e
        return respond_http(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            status="error",
            message=f"An error occurred while deleting user: {str(e)}",
        )

    return respond_http(
        status_code=status.HTTP_200_OK,
        status="success",
        message="User account deleted successfully.",
    )
