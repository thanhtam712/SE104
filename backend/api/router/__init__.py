from api.router.auth.login import router as login_router
from api.router.auth.register import router as register_router
from api.router.auth.me import router as me_router

from api.router.conversation.create_conversation import router as create_conversation_router
from api.router.conversation.list_conversation import router as list_conversations_router
from api.router.conversation.fetch_conversation import router as fetch_conversation_router

from api.router.user.list_user import router as list_users_router
from api.router.user.manage_user import router as manage_user_router
from api.router.admin import router as admin_router
