from fastapi import APIRouter
from app.api.v1.endpoints import (
    asr,
    auth,
    clinical_state,
    documents,
    encounters,
    health,
    interview,
    patients,
)

api_router = APIRouter()

# Core routers under /api/v1
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(patients.router, prefix="/patients", tags=["Patients"])
api_router.include_router(encounters.router, prefix="/encounters", tags=["Encounters"])
api_router.include_router(interview.router, prefix="/interview", tags=["Interview"])
api_router.include_router(clinical_state.router, prefix="/clinical-state", tags=["Clinical State"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents & OCR"])
api_router.include_router(asr.router, prefix="/asr", tags=["Multilingual ASR"])
