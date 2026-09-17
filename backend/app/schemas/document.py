from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DocumentTable(BaseModel):
    headers: List[str]
    rows: List[List[str]]


class ExtractedEntity(BaseModel):
    name: str
    category: str  # medication | symptom | condition | lab_test | vital
    value: Any
    unit: Optional[str] = None
    confidence: float
    source: str
    extraction_method: str = "OCR+NER"
    verified: bool = False


class DocumentExtractionResult(BaseModel):
    document_id: str
    raw_text: str
    layout_blocks: List[Dict[str, Any]] = Field(default_factory=list)
    tables: List[DocumentTable] = Field(default_factory=list)
    extracted_entities: List[ExtractedEntity] = Field(default_factory=list)
    confidence: float = 0.95
    processing_time_ms: float = 0.0
    ocr_engine: str = "paddleocr-v3"


class DocumentResponse(BaseModel):
    id: str
    encounter_id: str
    patient_id: str
    filename: str
    content_type: str
    size_bytes: int
    storage_path: str
    status: str = Field(default="UPLOADED", description="UPLOADED | PROCESSING | PROCESSED | FAILED")
    created_at: str
    updated_at: str
    extraction: Optional[DocumentExtractionResult] = None
