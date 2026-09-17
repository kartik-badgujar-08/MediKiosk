from typing import List
from fastapi import APIRouter, HTTPException, status
from app.repositories.patient_repo import patient_repo
from app.schemas.patient import PatientCreate, PatientResponse

router = APIRouter()


@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(patient_in: PatientCreate):
    patient = await patient_repo.create(patient_in)
    return patient


@router.get("/", response_model=List[PatientResponse])
async def list_patients(limit: int = 50, skip: int = 0):
    return await patient_repo.list_patients(limit=limit, skip=skip)


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: str):
    patient = await patient_repo.get_by_id(patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with id '{patient_id}' not found"
        )
    return patient


@router.get("/uhid/{uhid}", response_model=PatientResponse)
async def get_patient_by_uhid(uhid: str):
    patient = await patient_repo.get_by_uhid(uhid)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with UHID '{uhid}' not found"
        )
    return patient
