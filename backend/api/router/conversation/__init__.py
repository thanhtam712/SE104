from fastapi import APIRouter

from . import (
    create_conversation,
    fetch_conversation,
    list_conversation,
    manage_conversation,
)

router = APIRouter()

router.include_router(
    create_conversation.router,
    prefix="/conversation",
    tags=["Conversation Management"],
)
router.include_router(
    fetch_conversation.router,
    prefix="/conversation",
    tags=["Conversation Management"],
)
router.include_router(
    list_conversation.router,
    prefix="/conversations",
    tags=["Conversation Management"],
)
router.include_router(
    manage_conversation.router,
    prefix="/conversation",
    tags=["Conversation Management"],
)