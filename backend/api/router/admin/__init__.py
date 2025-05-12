from fastapi import APIRouter

from . import analysis

router = APIRouter()

router.include_router(analysis.router, prefix="/analysis", tags=["Admin Analysis"])
