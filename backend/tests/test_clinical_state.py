import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_canonical_clinical_state_and_red_flag_rules():
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

        # 2. Get Canonical State
        state_res = await client.get(f"/api/v1/clinical-state/{encounter_id}")
        assert state_res.status_code == 200
        state = state_res.json()
        assert state["encounter_id"] == encounter_id
        assert state["patient_id"] == patient_id
        assert state["version"] == 1

        # 3. Add Clinical Fact with Provenance (Paracetamol from OCR)
        fact_res = await client.post(
            f"/api/v1/clinical-state/{encounter_id}/facts",
            json={
                "category": "medication",
                "name": "Paracetamol 650mg",
                "value": "1 tab TDS PRN",
                "source": "ocr",
                "confidence": 0.94,
                "verification_status": "PENDING",
            },
        )
        assert fact_res.status_code == 200
        updated = fact_res.json()
        assert len(updated["medications"]) == 1
        assert updated["medications"][0]["name"] == "Paracetamol 650mg"
        assert updated["medications"][0]["source"] == "ocr"
        assert len(updated["provenance_log"]) >= 1

        # 4. Trigger Acute Chest Pain Red Flag
        await client.post(
            f"/api/v1/clinical-state/{encounter_id}/facts",
            json={
                "category": "symptom",
                "name": "Bleeding / Petechiae",
                "value": True,
                "source": "patient_voice",
                "confidence": 0.96,
            },
        )

        # Start interview and answer fever to trigger bleeding + fever rule
        await client.post(f"/api/v1/interview/start?encounter_id={encounter_id}")
        await client.post(
            f"/api/v1/interview/{encounter_id}/answer",
            json={"question_id": "CC_PRIMARY", "answer_value": "Fever"},
        )

        rf_res = await client.get(f"/api/v1/clinical-state/{encounter_id}/red-flags")
        assert rf_res.status_code == 200
        alerts = rf_res.json()
        assert len(alerts) >= 1
        assert any("Bleeding Manifestations" in a["title"] for a in alerts)
