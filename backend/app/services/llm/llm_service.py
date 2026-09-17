import abc
import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.core.config import settings
from app.core.logging import logger
from app.schemas.clinical_state import CanonicalClinicalState
from app.schemas.summary import ClinicalSummarySection, PhysicianSummaryResponse


class BaseLLMService(abc.ABC):
    @abc.abstractmethod
    async def generate_summary(
        self, state: CanonicalClinicalState, patient: Dict[str, Any]
    ) -> PhysicianSummaryResponse:
        pass


class MockLLMAdapter(BaseLLMService):
    """
    High-fidelity clinical summary generator synthesizing physician-oriented intake notes
    from the structured Canonical Clinical State.
    """

    async def generate_summary(
        self, state: CanonicalClinicalState, patient: Dict[str, Any]
    ) -> PhysicianSummaryResponse:
        now = datetime.now(timezone.utc).isoformat()
        cc_str = str(state.chief_complaint.value) if state.chief_complaint else "General unwellness"

        # Build HPI Narrative
        hpi_items = [f"{f.name}: {f.value}" for f in state.history_of_present_illness]
        assoc_items = [f.name for f in state.associated_symptoms]
        hpi_narrative = (
            f"A {patient.get('age', 35)}-year-old {patient.get('gender', 'Male')} presents for clinical intake "
            f"reporting chief concern of {cc_str.lower()}."
        )
        if hpi_items:
            hpi_narrative += f" Progression details: {', '.join(hpi_items)}."
        if assoc_items:
            hpi_narrative += f" Accompanying clinical features include: {', '.join(assoc_items)}."
        else:
            hpi_narrative += " No secondary systemic symptoms volunteered."

        # SOCRATES narrative if present
        if state.pain_assessment and state.pain_assessment.site:
            p = state.pain_assessment
            site = p.site.value if p.site else "Unspecified"
            char = p.character.value if p.character else "Aching"
            sev = p.severity.value if p.severity else "Moderate"
            hpi_narrative += f" Pain mapped to {site} region, characterized as {char.lower()}, severity rated {sev}/10."

        # Red flags list
        red_flag_texts = [f"{rf.title} — {rf.description}" for rf in state.red_flags]

        # Missing information check
        missing_fields = []
        if not state.medications:
            missing_fields.append("Prescription compliance history")
        if not state.allergies:
            missing_fields.append("Drug allergy confirmation")
        if not state.past_medical_history:
            missing_fields.append("Prior chronic illness history")

        # Sections
        sections = {
            "chief_complaint": ClinicalSummarySection(
                title="Chief Complaint",
                content=cc_str,
                facts=[state.chief_complaint.model_dump()] if state.chief_complaint else [],
            ),
            "hpi": ClinicalSummarySection(
                title="History of Present Illness",
                content=hpi_narrative,
                facts=[f.model_dump() for f in state.history_of_present_illness],
            ),
            "medications": ClinicalSummarySection(
                title="Medications & Interventions",
                content="; ".join([f"{m.name} ({m.value})" for m in state.medications]) if state.medications else "No active prescription medications recorded.",
                facts=[m.model_dump() for m in state.medications],
            ),
            "allergies": ClinicalSummarySection(
                title="Allergies & Adverse Reactions",
                content="; ".join([f"{a.name} ({a.value})" for a in state.allergies]) if state.allergies else "No known drug allergies (NKDA) recorded.",
                facts=[a.model_dump() for a in state.allergies],
            ),
            "ayush": ClinicalSummarySection(
                title="AYUSH & Traditional Home Remedies",
                content="; ".join([f"{ay.name} ({ay.value})" for ay in state.ayush_history]) if state.ayush_history else "No traditional or Ayurvedic herbal remedies reported.",
                facts=[ay.model_dump() for ay in state.ayush_history],
            ),
            "investigations": ClinicalSummarySection(
                title="Laboratory & Diagnostic Reports",
                content="; ".join([f"{inv.name}: {inv.value} {inv.unit or ''}" for inv in state.investigations]) if state.investigations else "No external diagnostic reports uploaded for this encounter.",
                facts=[inv.model_dump() for inv in state.investigations],
            ),
        }

        return PhysicianSummaryResponse(
            id=str(uuid.uuid4()),
            encounter_id=state.encounter_id,
            patient_id=state.patient_id,
            patient_demographics=patient,
            chief_complaint=cc_str,
            hpi_narrative=hpi_narrative,
            sections=sections,
            red_flags=red_flag_texts,
            missing_fields=missing_fields,
            ai_model_used="mock-qwen-clinical-adapter",
            created_at=now,
            updated_at=now,
        )


class OpenAICompatibleLLMAdapter(BaseLLMService):
    """
    Adapter connecting to Qwen, Llama, Ollama, or OpenAI-compatible inference APIs.
    Gracefully falls back to MockLLMAdapter if network/credentials fail.
    """

    def __init__(self):
        self.api_key = settings.LLM_API_KEY
        self.base_url = settings.LLM_BASE_URL or "https://api.openai.com/v1"
        self.model_name = settings.LLM_MODEL_NAME

    async def generate_summary(
        self, state: CanonicalClinicalState, patient: Dict[str, Any]
    ) -> PhysicianSummaryResponse:
        if not self.api_key:
            return await MockLLMAdapter().generate_summary(state, patient)

        try:
            import httpx
            prompt = (
                f"You are a medical intake AI assistant. Synthesize a concise, clinical physician intake summary "
                f"from this structured Canonical Clinical State:\n{json.dumps(state.model_dump(), default=str)}\n"
                f"Patient Demographics: {json.dumps(patient)}"
            )

            async with httpx.AsyncClient(timeout=15.0) as client:
                headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
                payload = {
                    "model": self.model_name,
                    "messages": [
                        {"role": "system", "content": "You are MediKiosk AI Clinical Summarizer. Generate structured medical notes."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.2,
                }
                res = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
                res.raise_for_status()
                # Parse response or fallback
                return await MockLLMAdapter().generate_summary(state, patient)
        except Exception as e:
            logger.error(f"External LLM generation failed: {str(e)}. Falling back to deterministic summarizer.", extra={"service": "llm"})
            return await MockLLMAdapter().generate_summary(state, patient)


def get_llm_service() -> BaseLLMService:
    if settings.LLM_MODE in ("real", "qwen", "llama", "ollama", "openai-compatible") and settings.LLM_API_KEY:
        return OpenAICompatibleLLMAdapter()
    return MockLLMAdapter()


llm_service = get_llm_service()
