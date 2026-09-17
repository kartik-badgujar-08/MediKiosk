from fastapi import APIRouter, HTTPException, status
from app.repositories.patient_repo import patient_repo
from app.schemas.timeline import PatientTimelineResponse
from app.services.clinical.timeline_service import timeline_service

router = APIRouter()


@router.get("/{patient_id}", response_model=PatientTimelineResponse)
async def get_patient_timeline(patient_id: str):
    patient = await patient_repo.get_by_id(patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{patient_id}' not found"
        )
    return await timeline_service.get_timeline(patient_id)
