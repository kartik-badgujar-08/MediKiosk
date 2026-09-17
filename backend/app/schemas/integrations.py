from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ABDMCareContextLinkRequest(BaseModel):
    patient_id: str
    encounter_id: str
    abha_address: str = Field(description="e.g. rahul.sharma@abdm")


class ABDMCareContextLinkResponse(BaseModel):
    status: str = "LINKED"
    transaction_id: str
    abha_address: str
    care_context_reference: str
    is_mock: bool = True
    gateway_mode: str = "SANDBOX"
    timestamp: str


class ABDMRecordPushRequest(BaseModel):
    encounter_id: str
    abha_address: str


class ABDMRecordPushResponse(BaseModel):
    status: str = "SUCCESS"
    consent_id: str
    transaction_id: str
    bundle_id: str
    hip_id: str = "MEDIKIOSK_OPD_01"
    is_mock: bool = True
    gateway_mode: str = "SANDBOX"
    timestamp: str


class HISSyncRequest(BaseModel):
    encounter_id: str
    his_system_code: str = "HOSP_HIS_CORE"


class HISSyncResponse(BaseModel):
    status: str = "SYNCHRONIZED"
    his_transaction_id: str
    encounter_id: str
    records_synced: int
    is_mock: bool = True
    timestamp: str
