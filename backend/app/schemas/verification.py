from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class PatientCorrectionItem(BaseModel):
    fact_id: str
    original_value: Any
    corrected_value: Any
    field_name: str


class PatientVerificationSubmission(BaseModel):
    encounter_id: str
    confirmed: bool = True
    corrections: List[PatientCorrectionItem] = Field(default_factory=list)


class FactVerificationAction(BaseModel):
    fact_id: str
    action: str = Field(description="ACCEPT | AMEND | REJECT")
    amended_value: Optional[Any] = None
    clinical_notes: Optional[str] = None


class DoctorVerificationSubmission(BaseModel):
    encounter_id: str
    doctor_id: str = "dr_current"
    doctor_name: str = "Attending Physician"
    actions: List[FactVerificationAction] = Field(default_factory=list)
    overall_assessment: Optional[str] = None
    finalize_encounter: bool = True


class VerificationEventResponse(BaseModel):
    id: str
    encounter_id: str
    actor_type: str  # patient | doctor
    actor_id: str
    action_type: str
    details: Dict[str, Any]
    timestamp: str
