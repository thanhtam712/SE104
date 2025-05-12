from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from bootstrap.db import get_db
from models.user import User
from models.conversation import Conversation

# Removed: from models.message import Message
from api.middleware.jwt_auth import get_current_active_admin
from internal.respond import respond_http


class RecentConversationItem(BaseModel):
    id: str
    title: Optional[str]
    created_at: datetime
    updated_at: datetime
    user_id: str
    # user_username: str # Consider adding if useful and easy to fetch


class DashboardStatsResponse(BaseModel):
    num_users: int
    num_conversations: int
    # num_messages: int # Example: if you want to count messages
    recent_conversations: List[RecentConversationItem]


router = APIRouter()


@router.get(
    "/stats",
    response_model=DashboardStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get dashboard statistical information",
)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(
        get_current_active_admin
    ),  # current_admin is used for auth
    limit_recent_conversations: int = 5,
):
    # Count total users
    total_users_result = await db.execute(select(func.count()).select_from(User))
    num_users = total_users_result.scalar_one_or_none() or 0

    # Count total conversations
    total_conversations_result = await db.execute(
        select(func.count()).select_from(Conversation)
    )
    num_conversations = total_conversations_result.scalar_one_or_none() or 0

    # Fetch recent conversations
    recent_conversations_stmt = (
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .order_by(Conversation.created_at.desc())
        .limit(limit_recent_conversations)
    )
    recent_conversations_result = await db.execute(recent_conversations_stmt)
    recent_conversations_db = recent_conversations_result.scalars().all()

    recent_conversations_list = [
        RecentConversationItem(
            id=str(conv.id),
            title=conv.title,
            created_at=str(conv.created_at),
            updated_at=str(conv.updated_at),
            user_id=str(conv.user_id),
        )
        for conv in recent_conversations_db
    ]
    
    print(recent_conversations_list)
    print(num_users)
    print(num_conversations)

    return respond_http(
        status_code=status.HTTP_200_OK,
        status="success",
        message="Dashboard statistics fetched successfully.",
        data={
            "num_users": num_users,
            "num_conversations": num_conversations,
            "recent_conversations": recent_conversations_list,
        },
    )
