import uuid
from datetime import datetime, timezone
from fastapi import APIRouter
from app.repositories.clinical_state_repo import clinical_state_repo
from app.repositories.document_repo import document_repo
from app.repositories.encounter_repo import encounter_repo
from app.repositories.patient_repo import patient_repo
from app.repositories.summary_repo import summary_repo
from app.repositories.verification_repo import verification_repo
from app.schemas.clinical_state import CanonicalClinicalState, ClinicalFact, PainAssessment
from app.services.clinical.red_flag_rules import RedFlagRuleEngine
from app.services.llm.llm_service import llm_service

router = APIRouter()


@router.post("/seed")
async def seed_demo_data():
    """
    Seed two complete end-to-end clinical scenarios:
    1. Rahul Sharma (35, Male) - Acute Febrile Illness, Headache, Mosquito exposure, CBC report, Paracetamol.
    2. Sunita Patil (28, Female) - Deaf Patient using Indian Sign Language for acute abdominal pain.
    """
    now = datetime.now(timezone.utc).isoformat()

    # -------------------------------------------------------------
    # Scenario 1: Rahul Sharma
    # -------------------------------------------------------------
    patient_rahul = await patient_repo.create(
        patient_repo.create.__annotations__["patient_in"](
            name="Rahul Sharma",
            age=35,
            gender="Male",
            phone="+919876543210",
            uhid="UHID-2026-8941",
            abha_id="rahul.sharma@abdm",
            preferred_language="hi",
        )
    )

    enc_rahul = await encounter_repo.create(
        encounter_repo.create.__annotations__["encounter_in"](
            patient_id=patient_rahul["id"],
            chief_complaint="Fever (3 days) + Headache",
            intake_channel="voice",
            language="hi",
            consent_given=True,
        )
    )
    enc_rahul_id = enc_rahul["id"]
    await encounter_repo.update_status(enc_rahul_id, "PENDING_REVIEW")

    # Canonical State for Rahul
    state_rahul = CanonicalClinicalState(
        id=str(uuid.uuid4()),
        encounter_id=enc_rahul_id,
        patient_id=patient_rahul["id"],
        chief_complaint=ClinicalFact(
            category="symptom",
            name="Chief Complaint",
            value="Fever",
            source="patient_voice",
            confidence=0.96,
            verification_status="PATIENT_CONFIRMED",
        ),
        history_of_present_illness=[
            ClinicalFact(
                category="symptom",
                name="Fever Duration",
                value="3 days",
                source="patient_voice",
                confidence=0.95,
            ),
            ClinicalFact(
                category="symptom",
                name="Fever Grade",
                value="High grade with chills",
                source="patient_voice",
                confidence=0.94,
            ),
        ],
        associated_symptoms=[
            ClinicalFact(
                category="symptom",
                name="Headache",
                value="Severe frontal throbbing",
                source="patient_voice",
                confidence=0.95,
            ),
            ClinicalFact(
                category="symptom",
                name="Body ache",
                value="Generalized myalgia",
                source="patient_voice",
                confidence=0.94,
            ),
            ClinicalFact(
                category="symptom",
                name="Mosquito exposure",
                value="Significant bites in neighborhood",
                source="patient_voice",
                confidence=0.98,
            ),
        ],
        medications=[
            ClinicalFact(
                category="medication",
                name="Paracetamol 650mg",
                value="1 tab TDS",
                source="ocr",
                confidence=0.94,
                verification_status="PATIENT_CONFIRMED",
                notes="Extracted from uploaded OPD prescription via PaddleOCR",
            )
        ],
        allergies=[
            ClinicalFact(
                category="allergy",
                name="No Known Drug Allergies (NKDA)",
                value=False,
                source="patient_touch",
                confidence=0.99,
            )
        ],
        ayush_history=[
            ClinicalFact(
                category="ayush",
                name="Herbal kadha",
                value="Giloy & Tulsi decoction twice daily",
                source="patient_voice",
                confidence=0.90,
            )
        ],
        investigations=[
            ClinicalFact(
                category="investigation",
                name="Platelet Count",
                value="130,000",
                unit="/uL",
                source="ocr",
                confidence=0.96,
                notes="Mild thrombocytopenia detected in uploaded CBC report",
            ),
            ClinicalFact(
                category="investigation",
                name="Hemoglobin",
                value="13.8",
                unit="g/dL",
                source="ocr",
                confidence=0.97,
            ),
        ],
    )
    state_rahul.red_flags = RedFlagRuleEngine.evaluate(state_rahul)
    await clinical_state_repo.save_or_update(state_rahul.model_dump())

    # Generate Summary for Rahul
    await llm_service.generate_summary(state_rahul, patient_rahul)

    # -------------------------------------------------------------
    # Scenario 2: Sunita Patil (ISL Accessibility Demo)
    # -------------------------------------------------------------
    patient_sunita = await patient_repo.create(
        patient_repo.create.__annotations__["patient_in"](
            name="Sunita Patil",
            age=28,
            gender="Female",
            phone="+919876543299",
            uhid="UHID-2026-8942",
            abha_id="sunita.patil@abdm",
            preferred_language="mr",
        )
    )

    enc_sunita = await encounter_repo.create(
        encounter_repo.create.__annotations__["encounter_in"](
            patient_id=patient_sunita["id"],
            chief_complaint="Acute Abdominal Pain (ISL Sign Intake)",
            intake_channel="sign",
            language="mr",
            consent_given=True,
        )
    )
    enc_sunita_id = enc_sunita["id"]
    await encounter_repo.update_status(enc_sunita_id, "PENDING_REVIEW")

    state_sunita = CanonicalClinicalState(
        id=str(uuid.uuid4()),
        encounter_id=enc_sunita_id,
        patient_id=patient_sunita["id"],
        chief_complaint=ClinicalFact(
            category="symptom",
            name="Chief Complaint",
            value="Abdominal Pain",
            source="sign_language",
            confidence=0.94,
            verification_status="PATIENT_CONFIRMED",
            notes="Captured via Indian Sign Language gesture (ISLRTC-MED-0341: PAIN_STOMACH)",
        ),
        pain_assessment=PainAssessment(
            site=ClinicalFact(
                category="symptom",
                name="Pain Site",
                value="Abdomen Upper",
                source="sign_language",
                confidence=0.95,
            ),
            onset=ClinicalFact(
                category="symptom",
                name="Pain Onset",
                value="Sudden acute",
                source="patient_touch",
            ),
            character=ClinicalFact(
                category="symptom",
                name="Pain Character",
                value="Colicky cramping",
                source="patient_touch",
            ),
            severity=ClinicalFact(
                category="symptom",
                name="Pain Severity",
                value=6,
                source="patient_touch",
            ),
        ),
    )
    state_sunita.red_flags = RedFlagRuleEngine.evaluate(state_sunita)
    await clinical_state_repo.save_or_update(state_sunita.model_dump())
    await llm_service.generate_summary(state_sunita, patient_sunita)

    return {
        "status": "seeded",
        "scenarios": [
            {
                "patient_name": "Rahul Sharma",
                "patient_id": patient_rahul["id"],
                "encounter_id": enc_rahul_id,
                "chief_complaint": "Fever (3 days) + Headache",
                "modality": "Voice (Hindi) + Document OCR",
            },
            {
                "patient_name": "Sunita Patil",
                "patient_id": patient_sunita["id"],
                "encounter_id": enc_sunita_id,
                "chief_complaint": "Abdominal Pain",
                "modality": "Indian Sign Language (ISLRTC)",
            },
        ],
    }
