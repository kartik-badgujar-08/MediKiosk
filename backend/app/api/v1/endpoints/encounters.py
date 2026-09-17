from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.repositories.encounter_repo import encounter_repo
from app.repositories.patient_repo import patient_repo
from app.schemas.encounter import (
    EncounterConsentUpdate,
    EncounterCreate,
    EncounterResponse,
    EncounterStatusUpdate,
)

router = APIRouter()


@router.post("/", response_model=EncounterResponse, status_code=status.HTTP_201_CREATED)
async def create_encounter(encounter_in: EncounterCreate):
    # Verify patient exists
    patient = await patient_repo.get_by_id(encounter_in.patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cannot create encounter: Patient '{encounter_in.patient_id}' not found"
        )
    encounter = await encounter_repo.create(encounter_in)
    return encounter


@router.get("/", response_model=List[EncounterResponse])
async def list_encounters(
    patient_id: Optional[str] = Query(None, description="Filter by patient ID"),
    limit: int = 50,
    skip: int = 0
):
    if patient_id:
        return await encounter_repo.list_by_patient(patient_id)
    return await encounter_repo.list_all(limit=limit, skip=skip)


@router.get("/{encounter_id}", response_model=EncounterResponse)
async def get_encounter(encounter_id: str):
    encounter = await encounter_repo.get_by_id(encounter_id)
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{encounter_id}' not found"
        )
    return encounter


@router.patch("/{encounter_id}/status", response_model=EncounterResponse)
async def update_encounter_status(encounter_id: str, payload: EncounterStatusUpdate):
    encounter = await encounter_repo.get_by_id(encounter_id)
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{encounter_id}' not found"
        )
    success = await encounter_repo.update_status(encounter_id, payload.status)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update encounter status"
        )
    return await encounter_repo.get_by_id(encounter_id)


@router.patch("/{encounter_id}/consent", response_model=EncounterResponse)
async def update_encounter_consent(encounter_id: str, payload: EncounterConsentUpdate):
    encounter = await encounter_repo.get_by_id(encounter_id)
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{encounter_id}' not found"
        )
    success = await encounter_repo.update_consent(encounter_id, payload.consent_given)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to record encounter consent"
        )
    return await encounter_repo.get_by_id(encounter_id)
