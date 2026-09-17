import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.repositories.clinical_state_repo import clinical_state_repo
from app.repositories.encounter_repo import encounter_repo
from app.schemas.clinical_state import (
    CanonicalClinicalState,
    ClinicalFact,
    PainAssessment,
)
from app.services.clinical.red_flag_rules import RedFlagRuleEngine
from app.workflows.interview_engine import dialogue_manager


class ClinicalStateService:
    """
    Core service managing the single source of truth: Canonical Clinical State.
    Aggregates multimodal input facts, maintains provenance, and computes red flags.
    """

    async def get_or_create_state(self, encounter_id: str) -> CanonicalClinicalState:
        existing = await clinical_state_repo.get_by_encounter_id(encounter_id)
        if existing:
            # Parse into pydantic model
            state = CanonicalClinicalState(**existing)
        else:
            encounter = await encounter_repo.get_by_id(encounter_id)
            patient_id = encounter.get("patient_id", "unknown") if encounter else "unknown"
            
            state = CanonicalClinicalState(
                id=str(uuid.uuid4()),
                encounter_id=encounter_id,
                patient_id=patient_id,
            )
            await clinical_state_repo.save_or_update(state.model_dump())

        # Sync with dialogue manager if active
        state = self._sync_with_dialogue_answers(state)
        # Evaluate deterministic red flags
        state.red_flags = RedFlagRuleEngine.evaluate(state)
        await clinical_state_repo.save_or_update(state.model_dump())
        return state

    def _sync_with_dialogue_answers(self, state: CanonicalClinicalState) -> CanonicalClinicalState:
        session = dialogue_manager.sessions.get(state.encounter_id)
        if not session:
            return state

        answers = session.get("answers", {})
        now = datetime.now(timezone.utc).isoformat()

        # Sync Chief Complaint
        if "CC_PRIMARY" in answers and not state.chief_complaint:
            state.chief_complaint = ClinicalFact(
                category="symptom",
                name="Chief Complaint",
                value=answers["CC_PRIMARY"],
                source="patient_voice" if session.get("input_channel") == "voice" else "patient_touch",
                confidence=0.95,
                verification_status="PENDING",
            )

        # Sync Fever HPI
        if "FEVER_DURATION" in answers:
            if not any(f.name == "Fever Duration" for f in state.history_of_present_illness):
                state.history_of_present_illness.append(
                    ClinicalFact(
                        category="symptom",
                        name="Fever Duration",
                        value=answers["FEVER_DURATION"],
                        source="patient_touch",
                        confidence=0.95,
                    )
                )

        if "FEVER_GRADE" in answers:
            if not any(f.name == "Fever Grade" for f in state.history_of_present_illness):
                state.history_of_present_illness.append(
                    ClinicalFact(
                        category="symptom",
                        name="Fever Grade",
                        value=answers["FEVER_GRADE"],
                        source="patient_touch",
                        confidence=0.95,
                    )
                )

        if "FEVER_ASSOCIATED" in answers:
            assoc_list = answers["FEVER_ASSOCIATED"]
            if isinstance(assoc_list, list):
                for item in assoc_list:
                    if item != "None" and not any(f.name == item for f in state.associated_symptoms):
                        state.associated_symptoms.append(
                            ClinicalFact(
                                category="symptom",
                                name=item,
                                value=True,
                                source="patient_touch",
                                confidence=0.95,
                            )
                        )

        # Sync SOCRATES Pain
        if "SOCRATES_SITE" in answers:
            if not state.pain_assessment:
                state.pain_assessment = PainAssessment()

            state.pain_assessment.site = ClinicalFact(
                category="symptom",
                name="Pain Site",
                value=answers["SOCRATES_SITE"],
                source="patient_touch",
            )

            if "SOCRATES_ONSET" in answers:
                state.pain_assessment.onset = ClinicalFact(
                    category="symptom",
                    name="Pain Onset",
                    value=answers["SOCRATES_ONSET"],
                    source="patient_touch",
                )

            if "SOCRATES_CHARACTER" in answers:
                state.pain_assessment.character = ClinicalFact(
                    category="symptom",
                    name="Pain Character",
                    value=answers["SOCRATES_CHARACTER"],
                    source="patient_touch",
                )

            if "SOCRATES_RADIATION" in answers:
                state.pain_assessment.radiation = ClinicalFact(
                    category="symptom",
                    name="Pain Radiation",
                    value=answers["SOCRATES_RADIATION"],
                    source="patient_touch",
                )

            if "SOCRATES_SEVERITY" in answers:
                state.pain_assessment.severity = ClinicalFact(
                    category="symptom",
                    name="Pain Severity",
                    value=answers["SOCRATES_SEVERITY"],
                    source="patient_touch",
                )

            if "SOCRATES_ASSOCIATED" in answers:
                assoc = answers["SOCRATES_ASSOCIATED"]
                if isinstance(assoc, list):
                    state.pain_assessment.associated_symptoms = [
                        ClinicalFact(category="symptom", name=a, value=True, source="patient_touch")
                        for a in assoc if a != "None"
                    ]

        # Sync Meds
        if "MEDICATIONS_CURRENT" in answers:
            meds = answers["MEDICATIONS_CURRENT"]
            if isinstance(meds, list):
                for m in meds:
                    if m != "None" and not any(f.name == m for f in state.medications):
                        state.medications.append(
                            ClinicalFact(
                                category="medication",
                                name=m,
                                value="Active",
                                source="patient_touch",
                            )
                        )

        # Sync Allergies
        if "ALLERGIES_KNOWN" in answers:
            alg = answers["ALLERGIES_KNOWN"]
            if alg != "None" and not any(f.name == alg for f in state.allergies):
                state.allergies.append(
                    ClinicalFact(
                        category="allergy",
                        name=alg,
                        value="Allergic",
                        source="patient_touch",
                    )
                )

        # Sync AYUSH
        if "AYUSH_REMEDIES" in answers:
            ayush = answers["AYUSH_REMEDIES"]
            if isinstance(ayush, list):
                for a in ayush:
                    if a != "None" and not any(f.name == a for f in state.ayush_history):
                        state.ayush_history.append(
                            ClinicalFact(
                                category="ayush",
                                name=a,
                                value="Reported Home/Herbal Remedy",
                                source="patient_touch",
                            )
                        )

        return state

    async def add_fact(self, encounter_id: str, fact: ClinicalFact) -> CanonicalClinicalState:
        state = await self.get_or_create_state(encounter_id)
        fact_id = fact.id or str(uuid.uuid4())
        fact.id = fact_id

        # Categorize fact into appropriate state section
        if fact.name.lower() in ("chief complaint", "primary concern") or fact.category in ("chief_complaint", "cc"):
            state.chief_complaint = fact
        elif fact.category == "medication":
            state.medications.append(fact)
        elif fact.category == "allergy":
            state.allergies.append(fact)
        elif fact.category == "investigation":
            state.investigations.append(fact)
        elif fact.category == "vital":
            state.vital_signs.append(fact)
        elif fact.category == "ayush":
            state.ayush_history.append(fact)
        else:
            state.associated_symptoms.append(fact)

        # Provenance audit log entry
        state.provenance_log.append({
            "fact_id": fact_id,
            "fact_name": fact.name,
            "source": fact.source,
            "confidence": fact.confidence,
            "verification_status": fact.verification_status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        # Re-evaluate red flag rules
        state.red_flags = RedFlagRuleEngine.evaluate(state)
        await clinical_state_repo.save_or_update(state.model_dump())
        return state


clinical_state_service = ClinicalStateService()
