from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ClinicalSummarySection(BaseModel):
    title: str
    content: str
    facts: List[Dict[str, Any]] = Field(default_factory=list)
    confidence: float = 0.95


class PhysicianSummaryResponse(BaseModel):
    id: str
    encounter_id: str
    patient_id: str
    patient_demographics: Dict[str, Any]
    chief_complaint: str
    hpi_narrative: str
    sections: Dict[str, ClinicalSummarySection]
    red_flags: List[str]
    missing_fields: List[str]
    ai_model_used: str
    disclaimer: str = (
        "CONFIDENTIAL MEDICAL SUMMARY (DRAFT) — Generated automatically by MediKiosk AI "
        "intake assistance from patient multi-channel inputs and digitized documents. "
        "Does NOT constitute a clinical diagnosis. Attending physician verification is mandatory."
    )
    is_verified_by_doctor: bool = False
    verified_by: Optional[str] = None
    verified_at: Optional[str] = None
    created_at: str
    updated_at: str
