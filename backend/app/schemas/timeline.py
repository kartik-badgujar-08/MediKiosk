from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TimelineEvent(BaseModel):
    id: str
    patient_id: str
    encounter_id: Optional[str] = None
    event_type: str = Field(
        description="ENCOUNTER | PRESCRIPTION | LAB_REPORT | INVESTIGATION | VERIFICATION | AYUSH"
    )
    title: str
    description: str
    date: str
    year: str
    status: str = "VERIFIED"
    details: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)


class PatientTimelineResponse(BaseModel):
    patient_id: str
    total_events: int
    events: List[TimelineEvent]
