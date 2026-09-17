from fastapi import APIRouter, HTTPException, Query, status
from app.repositories.encounter_repo import encounter_repo
from app.schemas.interview import InterviewAnswerSubmission, InterviewStateResponse
from app.workflows.interview_engine import dialogue_manager

router = APIRouter()


from pydantic import BaseModel
from app.services.clinical.ai_clinical_analyzer import ai_clinical_analyzer, AIAnalysisResult

class AIAnalyzeRequest(BaseModel):
    text: str
    language: str = "en"


@router.post("/ai-analyze", response_model=AIAnalysisResult)
async def analyze_clinical_complaint(request: AIAnalyzeRequest):
    """
    AI Clinical Extractor that parses unstructured voice or text complaints
    into structured SOCRATES slots and detects acute red flags.
    """
    return ai_clinical_analyzer.analyze(text=request.text, language=request.language)


@router.post("/start", response_model=InterviewStateResponse)
async def start_interview(encounter_id: str, language: str = Query("en", description="en | hi | mr")):
    dialogue_manager.get_or_create_session(encounter_id, language=language)
    return dialogue_manager.get_state(encounter_id)


@router.get("/{encounter_id}/current", response_model=InterviewStateResponse)
async def get_current_question(encounter_id: str):
    return dialogue_manager.get_state(encounter_id)


@router.post("/{encounter_id}/answer", response_model=InterviewStateResponse)
async def submit_answer(encounter_id: str, submission: InterviewAnswerSubmission):
    updated_state = dialogue_manager.submit_answer(
        encounter_id=encounter_id,
        question_id=submission.question_id,
        answer_value=submission.answer_value,
        input_channel=submission.input_channel,
        confidence=submission.confidence,
    )

    # If interview just finished, update encounter status if encounter exists in DB
    if updated_state.is_completed:
        encounter = await encounter_repo.get_by_id(encounter_id)
        if encounter:
            await encounter_repo.update_status(encounter_id, "PENDING_REVIEW")

    return updated_state


@router.get("/{encounter_id}/summary", response_model=InterviewStateResponse)
async def get_interview_summary(encounter_id: str):
    return dialogue_manager.get_state(encounter_id)

