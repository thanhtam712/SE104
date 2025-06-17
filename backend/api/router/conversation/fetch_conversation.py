import uuid
from datetime import datetime
from typing import List

from api.middleware.jwt_auth import get_current_user
from bootstrap.db import get_db
from fastapi import APIRouter, Depends, status
from internal.respond import respond_http
from models.conversation import Conversation
from models.user import User
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload


class MessageResponse(BaseModel):
    id: uuid.UUID
    sender_type: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class FetchConversationResponse(BaseModel):
    conversation_id: uuid.UUID
    messages: List[MessageResponse]


router = APIRouter()


@router.get(
    "/{conversation_id}",
    response_model=FetchConversationResponse,
    status_code=status.HTTP_200_OK,
)
async def fetch_conversation_messages(
    conversation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Conversation)
        .where(
            Conversation.id == conversation_id, Conversation.user_id == current_user.id
        )
        .options(selectinload(Conversation.messages))
    )
    conversation = result.scalars().first()

    if not conversation:
        return respond_http(
            status_code=status.HTTP_404_NOT_FOUND,
            status="error",
            message="Conversation not found or access denied.",
        )

    message_responses = [MessageResponse.from_orm(msg) for msg in conversation.messages]

    return FetchConversationResponse(
        conversation_id=conversation.id, messages=message_responses
    )
