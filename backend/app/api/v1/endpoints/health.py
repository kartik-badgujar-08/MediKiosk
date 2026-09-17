from typing import Any, Dict
from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


@router.get("/health", response_model=Dict[str, Any])
def health_check() -> Dict[str, Any]:
    """
    Health check endpoint returning system status and active operational modes.
    """
    return {
        "status": "ok",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "modes": {
            "asr_mode": settings.ASR_MODE,
            "ocr_mode": settings.OCR_MODE,
            "clinical_ner_mode": settings.CLINICAL_NER_MODE,
            "llm_mode": settings.LLM_MODE,
            "abdm_mode": settings.ABDM_MODE,
            "his_mode": settings.HIS_MODE,
            "sign_recognition_mode": settings.SIGN_RECOGNITION_MODE,
        }
    }
