from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ClinicalSummarySection(BaseModel):
    title: str
    content: str
    facts: List[Dict[str, Any]] = Field(default_factory=list)
    confidence: float = 0.95


class SoapSections(BaseModel):
    subjective: ClinicalSummarySection
    objective: ClinicalSummarySection
    assessment: ClinicalSummarySection
    plan: ClinicalSummarySection


class StandardClinicalSections(BaseModel):
    chief_complaint: ClinicalSummarySection = Field(description="1. Chief complaint (CC)")
    hpi: ClinicalSummarySection = Field(description="2. History of Present Illness (HPI)")
    past_medical_surgical: ClinicalSummarySection = Field(description="3. Past medical/surgical history (PMH / PSH)")
    drug_and_allergy: ClinicalSummarySection = Field(description="4. Drug & allergy history")
    family_history: ClinicalSummarySection = Field(description="5. Family history (FH)")
    personal_history: ClinicalSummarySection = Field(description="6. Personal history (PH)")
    review_of_systems: ClinicalSummarySection = Field(description="7. Review of systems (ROS)")
    prior_investigations: ClinicalSummarySection = Field(description="8. Prior investigations summary")


class PhysicianSummaryResponse(BaseModel):
    id: str
    encounter_id: str
    patient_id: str
    patient_demographics: Dict[str, Any]
    chief_complaint: str
    hpi_narrative: str
    sections: Dict[str, ClinicalSummarySection]
    standard_clinical_format: Optional[StandardClinicalSections] = None
    soap_sections: Optional[SoapSections] = None
    patient_vernacular_summary: Optional[Dict[str, str]] = None
    pertinent_positives: List[str] = Field(default_factory=list)
    pertinent_negatives: List[str] = Field(default_factory=list)
    triage_level: str = "ROUTINE"  # EMERGENCY | URGENT | ROUTINE
    red_flags: List[str]
    missing_fields: List[str]
    ai_model_used: str
    disclaimer: str = (
        "CONFIDENTIAL MEDICAL SUMMARY (DRAFT) — Generated automatically by MediKiosk AI "
        "intake assistance from patient multi-channel inputs and digitized documents. "
        "Does NOT constitute a clinical diagnosis. Attending physician verification is mandatory."
    )
    doctor_notes: Optional[str] = None
    is_verified_by_doctor: bool = False
    verified_by: Optional[str] = None
    verified_at: Optional[str] = None
    created_at: str
    updated_at: str


class PhysicianSummaryUpdateRequest(BaseModel):
    chief_complaint: Optional[str] = None
    hpi_narrative: Optional[str] = None
    standard_clinical_format: Optional[Dict[str, Any]] = None
    soap_sections: Optional[Dict[str, Any]] = None
    sections: Optional[Dict[str, Any]] = None
    pertinent_positives: Optional[List[str]] = None
    pertinent_negatives: Optional[List[str]] = None
    triage_level: Optional[str] = None
    doctor_notes: Optional[str] = None
    is_verified_by_doctor: Optional[bool] = None
    verified_by: Optional[str] = None
    verified_at: Optional[str] = None



