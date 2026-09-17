from typing import Optional
from pydantic import BaseModel, Field


class ASRTranscriptionResponse(BaseModel):
    transcription: str
    language: str = Field(default="en", description="en | hi | mr")
    confidence: float = Field(default=0.95, ge=0.0, le=1.0)
    engine: str = Field(default="indicconformer-asr")
    duration_seconds: Optional[float] = None
    processing_time_ms: float = 0.0
    is_mock: bool = False
