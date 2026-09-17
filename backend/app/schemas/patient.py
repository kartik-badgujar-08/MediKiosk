from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


class PatientBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    age: int = Field(ge=0, le=130)
    gender: str = Field(default="Male")
    phone: Optional[str] = None
    uhid: Optional[str] = None
    abha_id: Optional[str] = None
    preferred_language: str = Field(default="en")


class PatientCreate(PatientBase):
    pass


class PatientResponse(PatientBase):
    id: str
    created_at: str
    updated_at: str
