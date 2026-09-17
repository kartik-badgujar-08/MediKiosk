import abc
import time
from typing import Optional
from app.core.config import settings
from app.core.logging import logger
from app.schemas.asr import ASRTranscriptionResponse


class BaseASRService(abc.ABC):
    @abc.abstractmethod
    async def transcribe(self, audio_bytes: bytes, language: str = "en") -> ASRTranscriptionResponse:
        pass


class MockASRAdapter(BaseASRService):
    """
    High-fidelity mock ASR adapter simulating AI4Bharat IndicConformer behavior
    for local development, offline demos, and automated test environments.
    Transparently marks is_mock=True.
    """

    MOCK_RESPONSES = {
        "hi": "मुझे पिछले तीन दिनों से तेज बुखार है और बहुत सिरदर्द और बदन दर्द हो रहा है।",
        "mr": "मला गेल्या तीन दिवसांपासून तीव्र ताप आहे आणि खूप डोकेदुखी व अंगदुखी होत आहे.",
        "en": "I have had high fever for 3 days with headache, severe body ache, and mosquito exposure.",
    }

    async def transcribe(self, audio_bytes: bytes, language: str = "en") -> ASRTranscriptionResponse:
        start_time = time.time()
        lang_code = language.lower()[:2]
        transcription = self.MOCK_RESPONSES.get(lang_code, self.MOCK_RESPONSES["en"])

        duration_ms = round((time.time() - start_time) * 1000, 2)
        return ASRTranscriptionResponse(
            transcription=transcription,
            language=language,
            confidence=0.94,
            engine="mock-indicconformer-asr",
            duration_seconds=round(len(audio_bytes) / 16000, 2) if len(audio_bytes) > 0 else 2.5,
            processing_time_ms=duration_ms,
            is_mock=True,
        )


class IndicConformerASRAdapter(BaseASRService):
    """
    Production adapter utilizing AI4Bharat IndicConformer ASR.
    Connects to configured ASR service endpoint or local model inference.
    """

    def __init__(self):
        self.endpoint = settings.ASR_SERVICE_URL
        if not self.endpoint:
            logger.info(
                "ASR_SERVICE_URL not configured. IndicConformer adapter will fall back to MockASRAdapter.",
                extra={"service": "asr"}
            )

    async def transcribe(self, audio_bytes: bytes, language: str = "en") -> ASRTranscriptionResponse:
        if not self.endpoint:
            return await MockASRAdapter().transcribe(audio_bytes, language)

        start_time = time.time()
        try:
            import httpx
            async with httpx.AsyncClient(timeout=10.0) as client:
                files = {"audio": ("audio.wav", audio_bytes, "audio/wav")}
                data = {"language": language}
                res = await client.post(self.endpoint, data=data, files=files)
                res.raise_for_status()
                payload = res.json()
                
                duration_ms = round((time.time() - start_time) * 1000, 2)
                return ASRTranscriptionResponse(
                    transcription=payload.get("transcription", ""),
                    language=language,
                    confidence=payload.get("confidence", 0.92),
                    engine="ai4bharat-indicconformer-v1",
                    processing_time_ms=duration_ms,
                    is_mock=False,
                )
        except Exception as e:
            logger.error(f"IndicConformer remote transcription failed: {str(e)}", extra={"service": "asr"})
            # Fallback gracefully
            return await MockASRAdapter().transcribe(audio_bytes, language)


def get_asr_service() -> BaseASRService:
    if settings.ASR_MODE == "real" or settings.ASR_MODE == "indicconformer":
        return IndicConformerASRAdapter()
    return MockASRAdapter()


asr_service = get_asr_service()
