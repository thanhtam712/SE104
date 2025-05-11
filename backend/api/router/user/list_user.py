from typing import List

from bootstrap.db import get_db
from fastapi import APIRouter, Depends, Query, status
from internal.respond import respond_http
from models.user import User
from pydantic import BaseModel, EmailStr
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from api.middleware.jwt_auth import get_current_user


class UserListItem(BaseModel):
    id: str
    username: str
    user_fullname: str
    user_email: EmailStr
    user_role: str
    created_at: str
    updated_at: str


class ListUsersResponse(BaseModel):
    users: List[UserListItem]
    total_pages: int
    current_page: int


router = APIRouter()


@router.get("/", status_code=status.HTTP_200_OK)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    # Count total users
    total_users_result = await db.execute(select(func.count()).select_from(User))
    total_users = total_users_result.scalar()
    total_pages = (total_users + page_size - 1) // page_size if total_users else 1
    offset = (page - 1) * page_size

    # Fetch users for current page
    result = await db.execute(
        select(User).order_by(User.created_at.desc()).offset(offset).limit(page_size)
    )
    users = result.scalars().all()

    user_list = [
        UserListItem(
            id=str(u.id),
            username=u.username,
            user_fullname=u.user_fullname,
            user_email=u.user_email,
            user_role=str(u.user_role),
            created_at=str(u.created_at),
            updated_at=str(u.updated_at),
        )
        for u in users
    ]

    return respond_http(
        status_code=status.HTTP_200_OK,
        status="success",
        message="Users fetched successfully.",
        data={
            "users": user_list,
            "total_pages": total_pages,
            "current_page": page,
        },
    )
