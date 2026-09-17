import time
import uuid
from typing import Callable
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.logging import logger, setup_logging
from app.api.v1.api import api_router
from app.repositories.database import db_manager

# Initialize structured logger
setup_logging(debug=settings.DEBUG)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db_manager.connect()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="MediKiosk - Multimodal Multilingual Clinical Intake & Case-Taking System",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def logging_and_request_id_middleware(request: Request, call_next: Callable) -> Response:
    """
    Attach unique request_id to each request, track execution time, and log structured access.
    """
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id
    start_time = time.time()

    try:
        response = await call_next(request)
        duration_ms = round((time.time() - start_time) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time-Ms"] = str(duration_ms)

        logger.info(
            f"{request.method} {request.url.path} - Status: {response.status_code} - {duration_ms}ms",
            extra={"request_id": request_id, "service": "http-gateway"}
        )
        return response
    except Exception as exc:
        duration_ms = round((time.time() - start_time) * 1000, 2)
        logger.error(
            f"Unhandled error in {request.method} {request.url.path}: {str(exc)}",
            exc_info=True,
            extra={"request_id": request_id, "service": "http-gateway"}
        )
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error. Please try again or seek clinician assistance.",
                "request_id": request_id,
            },
            headers={"X-Request-ID": request_id}
        )


@app.get("/health", tags=["Health"])
def root_health_check():
    """
    Mandatory root health check endpoint returning {"status": "ok"}.
    """
    return {
        "status": "ok",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health_check": "/health",
        "api_v1": settings.API_V1_PREFIX,
    }


@app.get("/system/db-status", tags=["System"])
def get_db_status():
    """
    Direct system endpoint reporting live database storage engine, file path, and collection record counts.
    """
    return db_manager.get_stats()


# Include API v1 Router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)
