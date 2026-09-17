import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_patient_and_doctor_verification_workflow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Setup Patient and Encounter
        p_res = await client.post(
            "/api/v1/patients/",
            json={"name": "Rahul Sharma", "age": 35, "gender": "Male"},
        )
        patient_id = p_res.json()["id"]

        e_res = await client.post(
            "/api/v1/encounters/",
            json={"patient_id": patient_id, "intake_channel": "voice"},
        )
        encounter_id = e_res.json()["id"]

        # 2. Add OCR extracted fact with typo
        fact_res = await client.post(
            f"/api/v1/clinical-state/{encounter_id}/facts",
            json={
                "category": "medication",
                "name": "Paracetmol 650mg",
                "value": "Paracetmol",
                "source": "ocr",
                "confidence": 0.91,
                "verification_status": "PENDING",
            },
        )
        state_data = fact_res.json()
        med_fact = state_data["medications"][0]
        med_fact_id = med_fact["id"]

        # 3. Patient Review & Correction
        confirm_res = await client.post(
            "/api/v1/verification/patient-confirm",
            json={
                "encounter_id": encounter_id,
                "confirmed": True,
                "corrections": [
                    {
                        "fact_id": med_fact_id,
                        "original_value": "Paracetmol",
                        "corrected_value": "Paracetamol 650mg TDS",
                        "field_name": "medication",
                    }
                ],
            },
        )
        assert confirm_res.status_code == 200
        patient_verified_state = confirm_res.json()
        assert patient_verified_state["overall_verification_status"] == "PATIENT_CONFIRMED"
        corrected_med = patient_verified_state["medications"][0]
        assert corrected_med["value"] == "Paracetamol 650mg TDS"
        assert corrected_med["verification_status"] == "PATIENT_CONFIRMED"

        # 4. Doctor Verification (Accept fact & finalize encounter)
        doc_res = await client.post(
            "/api/v1/verification/doctor-verify",
            json={
                "encounter_id": encounter_id,
                "doctor_id": "dr_sharma",
                "doctor_name": "Dr. Ramesh Sharma",
                "actions": [
                    {
                        "fact_id": med_fact_id,
                        "action": "ACCEPT",
                        "clinical_notes": "Confirmed patient is taking Paracetamol TDS.",
                    }
                ],
                "overall_assessment": "Clinically stable acute febrile illness. Prescribing paracetamol, hydration.",
                "finalize_encounter": True,
            },
        )
        assert doc_res.status_code == 200
        doc_verified_state = doc_res.json()
        assert doc_verified_state["overall_verification_status"] == "VERIFIED"
        verified_med = doc_verified_state["medications"][0]
        assert verified_med["verification_status"] == "VERIFIED"
        assert "Dr. Ramesh Sharma" in verified_med["verified_by"]

        # 5. Check Verification Audit History
        hist_res = await client.get(f"/api/v1/verification/history/{encounter_id}")
        assert hist_res.status_code == 200
        history = hist_res.json()
        assert len(history) >= 2
        actors = [h["actor_type"] for h in history]
        assert "patient" in actors
        assert "doctor" in actors
