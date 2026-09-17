from fastapi import APIRouter, HTTPException, Query, status
from app.repositories.encounter_repo import encounter_repo
from app.schemas.interview import InterviewAnswerSubmission, InterviewStateResponse
from app.workflows.interview_engine import dialogue_manager

router = APIRouter()


@router.post("/start", response_model=InterviewStateResponse)
async def start_interview(encounter_id: str, language: str = Query("en", description="en | hi | mr")):
    encounter = await encounter_repo.get_by_id(encounter_id)
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{encounter_id}' not found"
        )
    dialogue_manager.get_or_create_session(encounter_id, language=language)
    return dialogue_manager.get_state(encounter_id)


@router.get("/{encounter_id}/current", response_model=InterviewStateResponse)
async def get_current_question(encounter_id: str):
    encounter = await encounter_repo.get_by_id(encounter_id)
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{encounter_id}' not found"
        )
    return dialogue_manager.get_state(encounter_id)


@router.post("/{encounter_id}/answer", response_model=InterviewStateResponse)
async def submit_answer(encounter_id: str, submission: InterviewAnswerSubmission):
    encounter = await encounter_repo.get_by_id(encounter_id)
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{encounter_id}' not found"
        )

    updated_state = dialogue_manager.submit_answer(
        encounter_id=encounter_id,
        question_id=submission.question_id,
        answer_value=submission.answer_value,
        input_channel=submission.input_channel,
        confidence=submission.confidence,
    )

    # If interview just finished, update encounter status
    if updated_state.is_completed:
        await encounter_repo.update_status(encounter_id, "PENDING_REVIEW")

    return updated_state


@router.get("/{encounter_id}/summary", response_model=InterviewStateResponse)
async def get_interview_summary(encounter_id: str):
    encounter = await encounter_repo.get_by_id(encounter_id)
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{encounter_id}' not found"
        )
    return dialogue_manager.get_state(encounter_id)
