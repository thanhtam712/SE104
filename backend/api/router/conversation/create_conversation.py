import os
import uuid
from datetime import datetime
from typing import Optional

import load_dotenv
import openai
from api.middleware.jwt_auth import get_current_user
from bootstrap.db import get_db
from fastapi import APIRouter, Depends, status
from internal.respond import respond_http
from models.conversation import Conversation
from models.message import Message
from models.user import User
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

load_dotenv.load_dotenv()


openai.api_key = os.getenv("OPENAI")


class CreateConversationRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    conversation_id: Optional[uuid.UUID] = None


class CreateConversationResponse(BaseModel):
    conversation_id: uuid.UUID
    user_message: str
    bot_message: str
    created_at: datetime


router = APIRouter()


@router.post(
    "/create",
    response_model=CreateConversationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_conversation(
    request: CreateConversationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4.1-mini",  # Or your desired model
            messages=[
                {"role": "system", "content": "You are an admission chatbot."},
                {"role": "user", "content": request.message},
            ],
        )
        bot_message_text = response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error calling GPT API: {e}")
        bot_message_text = "Sorry, I'm having trouble connecting to my brain right now. Please try again later."

    conversation_id_to_return = None
    created_at_to_return = None
    conversation = None

    if request.conversation_id:
        result = await db.execute(
            select(Conversation).where(
                Conversation.id == request.conversation_id,
                Conversation.user_id == current_user.id,
            )
        )
        conversation = result.scalars().first()

        if not conversation:
            return await respond_http(
                status_code=status.HTTP_404_NOT_FOUND,
                message_code="CONVERSATION_NOT_FOUND",
                message="Conversation not found or access denied.",
            )

        conversation_id_to_return = conversation.id
        created_at_to_return = conversation.created_at

    else:
        conversation = Conversation(
            user_id=current_user.id,
        )
        db.add(conversation)
        await db.flush()
        conversation_id_to_return = conversation.id
        created_at_to_return = conversation.created_at

    user_message_obj = Message(
        conversation_id=conversation_id_to_return,
        sender_type="user",
        content=request.message,
    )
    db.add(user_message_obj)

    bot_message_obj = Message(
        conversation_id=conversation_id_to_return,
        sender_type="bot",
        content=bot_message_text,
    )
    db.add(bot_message_obj)

    await db.commit()

    return CreateConversationResponse(
        conversation_id=conversation_id_to_return,
        user_message=request.message,
        bot_message=bot_message_text,
        created_at=created_at_to_return,
    )
