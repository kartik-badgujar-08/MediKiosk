from fastapi import APIRouter
from app.api.v1.endpoints import health

api_router = APIRouter()

# Core health endpoint under /api/v1
api_router.include_router(health.router, tags=["Health"])
