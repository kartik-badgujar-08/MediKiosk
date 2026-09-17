from fastapi import APIRouter, HTTPException, status
from app.repositories.encounter_repo import encounter_repo
from app.repositories.patient_repo import patient_repo
from app.repositories.summary_repo import summary_repo
from app.schemas.summary import PhysicianSummaryResponse
from app.services.clinical.state_service import clinical_state_service
from app.services.llm.llm_service import llm_service

router = APIRouter()


@router.post("/generate/{encounter_id}", response_model=PhysicianSummaryResponse)
async def generate_encounter_summary(encounter_id: str):
    encounter = await encounter_repo.get_by_id(encounter_id)
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{encounter_id}' not found"
        )

    patient = await patient_repo.get_by_id(encounter["patient_id"]) or {
        "name": "Unknown",
        "age": 35,
        "gender": "Unknown",
    }

    state = await clinical_state_service.get_or_create_state(encounter_id)

    summary = await llm_service.generate_summary(state=state, patient=patient)
    saved = await summary_repo.save_or_update(summary.model_dump())
    return saved


@router.get("/{encounter_id}", response_model=PhysicianSummaryResponse)
async def get_encounter_summary(encounter_id: str):
    existing = await summary_repo.get_by_encounter(encounter_id)
    if existing:
        return existing

    # Auto-generate if not yet persisted
    return await generate_encounter_summary(encounter_id)
