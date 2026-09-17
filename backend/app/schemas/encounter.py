from typing import Optional
from pydantic import BaseModel, Field


class EncounterBase(BaseModel):
    patient_id: str
    chief_complaint: Optional[str] = None
    intake_channel: str = Field(default="touch")
    language: str = Field(default="en")


class EncounterCreate(EncounterBase):
    consent_given: bool = True


class EncounterConsentUpdate(BaseModel):
    consent_given: bool
    notes: Optional[str] = None


class EncounterStatusUpdate(BaseModel):
    status: str = Field(description="IN_PROGRESS | PENDING_REVIEW | VERIFIED | AMENDED | REJECTED")


class EncounterResponse(EncounterBase):
    id: str
    status: str
    consent_given: bool
    consent_timestamp: Optional[str] = None
    created_at: str
    updated_at: str
