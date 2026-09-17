from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, HTTPException, status
from app.repositories.encounter_repo import encounter_repo
from app.repositories.verification_repo import verification_repo
from app.schemas.clinical_state import CanonicalClinicalState
from app.schemas.verification import (
    DoctorVerificationSubmission,
    PatientVerificationSubmission,
    VerificationEventResponse,
)
from app.services.clinical.state_service import clinical_state_service

router = APIRouter()


@router.post("/patient-confirm", response_model=CanonicalClinicalState)
async def patient_confirm_encounter(submission: PatientVerificationSubmission):
    encounter_id = submission.encounter_id
    encounter = await encounter_repo.get_by_id(encounter_id)
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{encounter_id}' not found"
        )

    state = await clinical_state_service.get_or_create_state(encounter_id)
    now = datetime.now(timezone.utc).isoformat()

    # Apply any patient corrections
    applied_corrections = []
    for corr in submission.corrections:
        # Search for fact in all sections
        all_facts = (
            [state.chief_complaint] if state.chief_complaint else []
        ) + state.history_of_present_illness + state.medications + state.allergies + state.associated_symptoms + state.investigations

        for fact in all_facts:
            if fact and fact.id == corr.fact_id:
                old_val = fact.value
                fact.value = corr.corrected_value
                fact.verification_status = "PATIENT_CONFIRMED"
                fact.notes = f"Corrected by patient. Original value was '{old_val}'"
                fact.updated_at = now
                applied_corrections.append({
                    "fact_id": corr.fact_id,
                    "field": corr.field_name,
                    "old_value": old_val,
                    "new_value": corr.corrected_value,
                })

    state.overall_verification_status = "PATIENT_CONFIRMED"
    await clinical_state_service.add_fact.__globals__["clinical_state_repo"].save_or_update(state.model_dump())

    # Update encounter status to ready for doctor
    await encounter_repo.update_status(encounter_id, "PENDING_REVIEW")

    # Audit logging
    await verification_repo.log_event(
        encounter_id=encounter_id,
        actor_type="patient",
        actor_id=encounter["patient_id"],
        action_type="PATIENT_CONFIRMATION",
        details={"corrections": applied_corrections, "confirmed": submission.confirmed},
    )

    return await clinical_state_service.get_or_create_state(encounter_id)


@router.post("/doctor-verify", response_model=CanonicalClinicalState)
async def doctor_verify_encounter(submission: DoctorVerificationSubmission):
    encounter_id = submission.encounter_id
    encounter = await encounter_repo.get_by_id(encounter_id)
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{encounter_id}' not found"
        )

    state = await clinical_state_service.get_or_create_state(encounter_id)
    now = datetime.now(timezone.utc).isoformat()

    actions_audit = []
    all_facts = (
        ([state.chief_complaint] if state.chief_complaint else [])
        + state.history_of_present_illness
        + state.medications
        + state.allergies
        + state.associated_symptoms
        + state.investigations
    )

    for action_item in submission.actions:
        for fact in all_facts:
            if fact and fact.id == action_item.fact_id:
                if action_item.action == "ACCEPT":
                    fact.verification_status = "VERIFIED"
                elif action_item.action == "AMEND":
                    fact.verification_status = "AMENDED"
                    fact.amended_value = action_item.amended_value
                elif action_item.action == "REJECT":
                    fact.verification_status = "REJECTED"

                fact.verified_by = f"{submission.doctor_id} ({submission.doctor_name})"
                fact.verified_at = now
                if action_item.clinical_notes:
                    fact.notes = action_item.clinical_notes

                actions_audit.append({
                    "fact_id": fact.id,
                    "fact_name": fact.name,
                    "action": action_item.action,
                    "amended_value": action_item.amended_value,
                })

    if submission.finalize_encounter:
        state.overall_verification_status = "VERIFIED"
        await encounter_repo.update_status(encounter_id, "VERIFIED")

    await clinical_state_service.add_fact.__globals__["clinical_state_repo"].save_or_update(state.model_dump())

    # Log doctor verification event
    await verification_repo.log_event(
        encounter_id=encounter_id,
        actor_type="doctor",
        actor_id=submission.doctor_id,
        action_type="DOCTOR_VERIFICATION",
        details={
            "doctor_name": submission.doctor_name,
            "actions": actions_audit,
            "overall_assessment": submission.overall_assessment,
            "finalized": submission.finalize_encounter,
        },
    )

    return await clinical_state_service.get_or_create_state(encounter_id)


@router.get("/history/{encounter_id}", response_model=List[VerificationEventResponse])
async def get_verification_history(encounter_id: str):
    return await verification_repo.get_events_for_encounter(encounter_id)
