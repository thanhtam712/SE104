from api.router import (
    create_conversation_router,
    list_conversations_router,
    list_users_router,
    fetch_conversation_router,
    login_router,
    me_router,
    register_router,
    manage_user_router
)
from bootstrap.db import init_db
from fastapi import FastAPI
from fastapi.exceptions import HTTPException as FastAPIHTTPException
from fastapi.middleware.cors import CORSMiddleware
from internal.respond import respond_http
from starlette.requests import Request


def create_app() -> FastAPI:
    app = FastAPI()

    # Configure CORS to allow all origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins
        allow_credentials=True,
        allow_methods=["*"],  # Allow all HTTP methods
        allow_headers=["*"],  # Allow all headers
    )

    # Include routers
    app.include_router(login_router, prefix="/api/auth", tags=["auth"])
    app.include_router(register_router, prefix="/api/auth", tags=["auth"])
    app.include_router(me_router, prefix="/api/auth", tags=["auth"])

    app.include_router(
        create_conversation_router, prefix="/api/conversation", tags=["conversation"]
    )
    app.include_router(
        list_conversations_router, prefix="/api/conversation", tags=["conversation"]
    )
    app.include_router(
        fetch_conversation_router, prefix="/api/conversation", tags=["conversation"]
    )

    app.include_router(list_users_router, prefix="/api/user", tags=["user"])
    app.include_router(manage_user_router, prefix="/api/user", tags=["user"])

    @app.on_event("startup")
    async def on_startup():
        await init_db()

    @app.exception_handler(FastAPIHTTPException)
    async def custom_http_exception_handler(
        request: Request, exc: FastAPIHTTPException
    ):
        # Use your respond_http for consistent response
        return respond_http(
            status_code=exc.status_code, status="error", message=exc.detail, data=None
        )

    return app
