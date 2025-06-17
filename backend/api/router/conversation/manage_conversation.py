import uuid

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from bootstrap.db import get_db
from internal.respond import respond_http
from models.conversation import Conversation
from models.user import User
from api.middleware.jwt_auth import get_current_user

router = APIRouter()


class UpdateConversationRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)


@router.put("/{conversation_id}", status_code=status.HTTP_200_OK)
async def update_conversation_title(
    conversation_id: uuid.UUID,
    request_data: UpdateConversationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update the title of a conversation.
    The title is determined by the content of the first message.
    """
    stmt = (
        select(Conversation)
        .where(
            Conversation.id == conversation_id, Conversation.user_id == current_user.id
        )
        .options(selectinload(Conversation.messages))
    )
    result = await db.execute(stmt)
    conversation_to_update = result.scalars().first()

    if not conversation_to_update:
        return respond_http(
            status_code=status.HTTP_404_NOT_FOUND,
            message_code="CONVERSATION_NOT_FOUND",
            message="Conversation not found or access denied.",
        )

    if not conversation_to_update.messages:
        return respond_http(
            status_code=status.HTTP_400_BAD_REQUEST,
            message_code="CANNOT_UPDATE_EMPTY_CONVERSATION_TITLE",
            message="Cannot update title of a conversation with no messages.",
        )

    # The title is the content of the first message
    first_message = conversation_to_update.messages[0]
    first_message.content = request_data.title
    conversation_to_update.updated_at = (
        first_message.created_at
    )  # Or use datetime.utcnow() if preferred for title updates

    try:
        await db.commit()
        await db.refresh(conversation_to_update)
        await db.refresh(first_message)
    except Exception as e:  # Specific exception handling can be added if known, otherwise re-raise or handle broadly
        await db.rollback()
        # Consider logging the error e
        return respond_http(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message_code="DATABASE_ERROR",
            message=f"An error occurred while updating conversation title: {str(e)}",
        )

    return respond_http(
        status_code=status.HTTP_200_OK,
        status="success",
        message="Conversation title updated successfully.",
        data={
            "id": str(conversation_to_update.id),
            "title": conversation_to_update.title,  # This will now reflect the new title
            "updated_at": str(conversation_to_update.updated_at),
        },
    )


@router.delete("/{conversation_id}", status_code=status.HTTP_200_OK)
async def delete_conversation(
    conversation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a conversation and all its messages.
    """
    stmt = select(Conversation).where(
        Conversation.id == conversation_id, Conversation.user_id == current_user.id
    )
    result = await db.execute(stmt)
    conversation_to_delete = result.scalars().first()

    if not conversation_to_delete:
        return respond_http(
            status_code=status.HTTP_404_NOT_FOUND,
            message_code="CONVERSATION_NOT_FOUND",
            message="Conversation not found or access denied.",
        )

    try:
        await db.delete(conversation_to_delete)
        await db.commit()
    except Exception as e:  # Specific exception handling can be added if known, otherwise re-raise or handle broadly
        await db.rollback()
        # Consider logging the error e
        return respond_http(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            status="error",
            message=f"An error occurred while deleting conversation: {str(e)}",
        )

    return respond_http(
        status_code=status.HTTP_200_OK,
        message="Conversation deleted successfully.",
        status="success",
        data={
            "id": str(conversation_to_delete.id),
            "deleted_at": str(
                conversation_to_delete.updated_at
            ),  # Assuming updated_at is used for deletion timestamp
        },
    )
