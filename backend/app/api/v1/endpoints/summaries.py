from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.repositories.encounter_repo import encounter_repo
from app.repositories.patient_repo import patient_repo
from app.repositories.summary_repo import summary_repo
from app.schemas.summary import PhysicianSummaryResponse
from app.services.clinical.state_service import clinical_state_service
from app.services.llm.llm_service import llm_service

router = APIRouter()


@router.get("/providers", response_model=Dict[str, Any])
async def get_summary_providers():
    """
    Get all supported AI and clinical synthesis providers and their connection statuses.
    """
    return await llm_service.get_providers_status()


@router.post("/generate/{encounter_id}", response_model=PhysicianSummaryResponse)
async def generate_encounter_summary(
    encounter_id: str,
    provider: str = Query("auto", description="auto | gemini | ollama | engine | openai"),
    language: str = Query("en", description="en | hi | mr"),
):
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

    summary = await llm_service.generate_summary(
        state=state,
        patient=patient,
        provider=provider,
        target_language=language,
    )
    saved = await summary_repo.save_or_update(summary.model_dump())
    return saved


@router.get("/{encounter_id}", response_model=PhysicianSummaryResponse)
async def get_encounter_summary(
    encounter_id: str,
    provider: str = Query("auto"),
):
    existing = await summary_repo.get_by_encounter(encounter_id)
    if existing:
        return existing

    # Auto-generate if not yet persisted
    return await generate_encounter_summary(encounter_id=encounter_id, provider=provider)

