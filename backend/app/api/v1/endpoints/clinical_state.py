from typing import List
from fastapi import APIRouter, HTTPException, status
from app.schemas.clinical_state import CanonicalClinicalState, ClinicalFact, RedFlagAlert
from app.services.clinical.state_service import clinical_state_service

router = APIRouter()


@router.get("/{encounter_id}", response_model=CanonicalClinicalState)
async def get_clinical_state(encounter_id: str):
    state = await clinical_state_service.get_or_create_state(encounter_id)
    return state


@router.post("/{encounter_id}/facts", response_model=CanonicalClinicalState)
async def add_clinical_fact(encounter_id: str, fact: ClinicalFact):
    updated_state = await clinical_state_service.add_fact(encounter_id, fact)
    return updated_state


@router.get("/{encounter_id}/red-flags", response_model=List[RedFlagAlert])
async def get_red_flags(encounter_id: str):
    state = await clinical_state_service.get_or_create_state(encounter_id)
    return state.red_flags
