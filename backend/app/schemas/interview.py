from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


class QuestionOption(BaseModel):
    value: str
    label_en: str
    label_hi: str
    label_mr: str
    is_red_flag: bool = False
    metadata: Optional[Dict[str, Any]] = None


class ClinicalQuestion(BaseModel):
    id: str
    section: str  # CC | HPI | SOCRATES | PMH | PSH | MEDS | ALLERGIES | FH | PH | ROS | AYUSH
    type: str  # single_choice | multi_choice | scale | text | boolean
    text_en: str
    text_hi: str
    text_mr: str
    audio_prompt_en: Optional[str] = None
    audio_prompt_hi: Optional[str] = None
    audio_prompt_mr: Optional[str] = None
    isl_gloss: Optional[str] = None
    isl_video_url: Optional[str] = None
    options: Optional[List[QuestionOption]] = None
    min_value: Optional[int] = None
    max_value: Optional[int] = None
    can_skip: bool = True
    allow_unknown: bool = True


class InterviewAnswerSubmission(BaseModel):
    question_id: str
    answer_value: Union[str, int, float, bool, List[str]]
    input_channel: str = Field(default="touch", description="touch | voice | sign | text")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class InterviewStateResponse(BaseModel):
    encounter_id: str
    current_section: str
    current_step: int
    total_estimated_steps: int
    is_completed: bool
    current_question: Optional[ClinicalQuestion] = None
    answers: Dict[str, Any]
    red_flags: List[str]
    missing_fields: List[str]
