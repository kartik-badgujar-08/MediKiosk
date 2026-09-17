from fastapi import APIRouter
from app.api.v1.endpoints import (
    abdm,
    asr,
    auth,
    clinical_state,
    demo,
    documents,
    encounters,
    fhir,
    government_auth,
    health,
    his,
    interview,
    patients,
    sign,
    summaries,
    timeline,
    verification,
)

api_router = APIRouter()

# Core routers under /api/v1
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(government_auth.router, prefix="/auth/gov", tags=["Government Identity Auth (ABHA / HPR)"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(patients.router, prefix="/patients", tags=["Patients"])
api_router.include_router(encounters.router, prefix="/encounters", tags=["Encounters"])
api_router.include_router(interview.router, prefix="/interview", tags=["Interview"])
api_router.include_router(clinical_state.router, prefix="/clinical-state", tags=["Clinical State"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents & OCR"])
api_router.include_router(asr.router, prefix="/asr", tags=["Multilingual ASR"])
api_router.include_router(summaries.router, prefix="/summaries", tags=["Physician Summary"])
api_router.include_router(verification.router, prefix="/verification", tags=["Verification"])
api_router.include_router(timeline.router, prefix="/timeline", tags=["Patient Timeline"])
api_router.include_router(fhir.router, prefix="/fhir", tags=["FHIR R4"])
api_router.include_router(abdm.router, prefix="/abdm", tags=["ABDM Integration"])
api_router.include_router(his.router, prefix="/his", tags=["HIS Integration"])
api_router.include_router(sign.router, prefix="/sign", tags=["Indian Sign Language"])
api_router.include_router(demo.router, prefix="/demo", tags=["Demo Seed Scenarios"])
