from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ClinicalFact(BaseModel):
    id: Optional[str] = None
    category: str  # symptom | condition | medication | allergy | investigation | vital | ayush
    name: str
    value: Any
    unit: Optional[str] = None
    source: str = Field(
        default="patient_touch",
        description="patient_voice | patient_touch | patient_text | sign_language | ocr | previous_record | doctor | ai_draft"
    )
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    verification_status: str = Field(
        default="PENDING",
        description="PENDING | PATIENT_CONFIRMED | VERIFIED | AMENDED | REJECTED"
    )
    amended_value: Optional[Any] = None
    verified_by: Optional[str] = None
    verified_at: Optional[str] = None
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class PainAssessment(BaseModel):
    site: Optional[ClinicalFact] = None
    onset: Optional[ClinicalFact] = None
    character: Optional[ClinicalFact] = None
    radiation: Optional[ClinicalFact] = None
    associated_symptoms: List[ClinicalFact] = Field(default_factory=list)
    timing: Optional[ClinicalFact] = None
    exacerbating_relieving: Optional[ClinicalFact] = None
    severity: Optional[ClinicalFact] = None  # Scale 1-10


class RedFlagAlert(BaseModel):
    rule_id: str
    severity: str = "HIGH"  # CRITICAL | HIGH | MEDIUM
    title: str
    description: str
    clinical_rationale: str
    triggered_facts: List[str]
    detected_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CanonicalClinicalState(BaseModel):
    id: str
    encounter_id: str
    patient_id: str
    version: int = 1

    # Clinical Sections with Typed Facts
    chief_complaint: Optional[ClinicalFact] = None
    history_of_present_illness: List[ClinicalFact] = Field(default_factory=list)
    pain_assessment: Optional[PainAssessment] = None
    associated_symptoms: List[ClinicalFact] = Field(default_factory=list)
    past_medical_history: List[ClinicalFact] = Field(default_factory=list)
    past_surgical_history: List[ClinicalFact] = Field(default_factory=list)
    medications: List[ClinicalFact] = Field(default_factory=list)
    allergies: List[ClinicalFact] = Field(default_factory=list)
    family_history: List[ClinicalFact] = Field(default_factory=list)
    personal_history: List[ClinicalFact] = Field(default_factory=list)
    review_of_systems: List[ClinicalFact] = Field(default_factory=list)
    ayush_history: List[ClinicalFact] = Field(default_factory=list)
    vital_signs: List[ClinicalFact] = Field(default_factory=list)
    investigations: List[ClinicalFact] = Field(default_factory=list)

    # Document and AI Artifact References
    document_ids: List[str] = Field(default_factory=list)
    extracted_entities: List[Dict[str, Any]] = Field(default_factory=list)
    red_flags: List[RedFlagAlert] = Field(default_factory=list)
    
    # Audit & Status
    provenance_log: List[Dict[str, Any]] = Field(default_factory=list)
    overall_verification_status: str = Field(default="PENDING")
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
