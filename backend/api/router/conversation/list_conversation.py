import uuid
from datetime import datetime
from typing import List, Optional

from api.middleware.jwt_auth import get_current_user
from bootstrap.db import get_db
from fastapi import APIRouter, Depends, status
from models.conversation import Conversation
from models.user import User
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

# Message model is implicitly used via the relationship in Conversation model with order_by

class ConversationInfo(BaseModel):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    title: Optional[str] = None # To store the first message content

class ListConversationsResponse(BaseModel):
    conversations: List[ConversationInfo]

router = APIRouter()

@router.get("/", response_model=ListConversationsResponse, status_code=status.HTTP_200_OK)
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .options(selectinload(Conversation.messages)) # Ensure messages are loaded
        .order_by(Conversation.updated_at.desc()) # Show most recently updated first
    )
    conversations = result.scalars().all()

    conversation_infos: List[ConversationInfo] = []
    for conv in conversations:
        first_message_content = None
        if conv.messages: # Messages are ordered by created_at due to model definition
            first_message_content = conv.messages[0].content
        
        conversation_infos.append(
            ConversationInfo(
                id=conv.id,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
                title=first_message_content,
            )
        )

    return ListConversationsResponse(conversations=conversation_infos)
