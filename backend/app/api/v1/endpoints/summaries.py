from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.repositories.encounter_repo import encounter_repo
from app.repositories.patient_repo import patient_repo
from app.repositories.summary_repo import summary_repo
from app.schemas.summary import PhysicianSummaryResponse, PhysicianSummaryUpdateRequest
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
    if existing and existing.get("standard_clinical_format"):
        return existing

    # Auto-generate if not yet persisted or missing standard clinical format
    return await generate_encounter_summary(encounter_id=encounter_id, provider=provider)


@router.put("/{encounter_id}", response_model=PhysicianSummaryResponse)
async def update_encounter_summary_draft(
    encounter_id: str,
    update_data: PhysicianSummaryUpdateRequest,
):
    """
    Save or update an editable physician clinical summary draft.
    Allows attending clinicians to amend standard clinical format, SOAP sections, HPI, impressions, plans, and notes.
    """
    existing = await summary_repo.get_by_encounter(encounter_id)
    if not existing:
        existing = (await generate_encounter_summary(encounter_id=encounter_id, provider="auto"))
        if hasattr(existing, "model_dump"):
            existing = existing.model_dump()

    # Merge incoming update fields
    data_dict = update_data.model_dump(exclude_unset=True)
    for key, value in data_dict.items():
        if value is not None:
            if key == "soap_sections" and isinstance(value, dict):
                # Deep merge soap sections
                curr_soap = existing.get("soap_sections") or {}
                for s_key, s_val in value.items():
                    if isinstance(s_val, dict) and s_key in curr_soap:
                        curr_soap[s_key].update(s_val)
                    else:
                        curr_soap[s_key] = s_val
                existing["soap_sections"] = curr_soap
            elif key == "standard_clinical_format" and isinstance(value, dict):
                # Deep merge standard clinical format sections
                curr_std = existing.get("standard_clinical_format") or {}
                for s_key, s_val in value.items():
                    if isinstance(s_val, dict) and s_key in curr_std:
                        curr_std[s_key].update(s_val)
                    else:
                        curr_std[s_key] = s_val
                existing["standard_clinical_format"] = curr_std
            else:
                existing[key] = value


    saved = await summary_repo.save_or_update(existing)
    return saved


