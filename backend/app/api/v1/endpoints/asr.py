from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from app.schemas.asr import ASRTranscriptionResponse
from app.services.asr.asr_service import asr_service

router = APIRouter()


@router.post("/transcribe", response_model=ASRTranscriptionResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = Form("en", description="en | hi | mr"),
):
    try:
        audio_bytes = await file.read()
        if not audio_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty audio payload received"
            )
        result = await asr_service.transcribe(audio_bytes=audio_bytes, language=language)
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech recognition service error: {str(exc)}"
        )
