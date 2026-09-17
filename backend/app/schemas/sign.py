from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ISLVocabularyItem(BaseModel):
    sign_code: str
    islrtc_ref_id: str
    gloss: str
    english_meaning: str
    hindi_meaning: str
    marathi_meaning: str
    clinical_category: str  # symptom | response | body_part
    mapped_question_id: Optional[str] = None
    mapped_answer_value: Optional[str] = None
    video_url: str


class SignRecognitionRequest(BaseModel):
    encounter_id: str
    question_id: str
    frame_sequence_base64: Optional[str] = None
    simulated_sign: Optional[str] = None  # for testing/demo selection


class SignRecognitionResponse(BaseModel):
    recognized_sign: str
    islrtc_ref_id: str
    confidence: float = 0.93
    clinical_meaning: str
    mapped_answer_value: str
    is_supported: bool = True
    input_channel: str = "sign_language"
    processing_time_ms: float = 0.0
