import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_llm_physician_summary_generation():
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

        # 2. Add clinical facts to state
        await client.post(
            f"/api/v1/clinical-state/{encounter_id}/facts",
            json={
                "category": "symptom",
                "name": "Chief Complaint",
                "value": "Fever",
                "source": "patient_voice",
                "confidence": 0.95,
            },
        )
        await client.post(
            f"/api/v1/clinical-state/{encounter_id}/facts",
            json={
                "category": "medication",
                "name": "Paracetamol 650mg",
                "value": "1 tab TDS PRN",
                "source": "ocr",
                "confidence": 0.93,
            },
        )

        # 3. Generate Physician Summary
        gen_res = await client.post(f"/api/v1/summaries/generate/{encounter_id}")
        assert gen_res.status_code == 200
        summary = gen_res.json()
        assert summary["encounter_id"] == encounter_id
        assert "Rahul Sharma" in summary["patient_demographics"]["name"]
        assert "fever" in summary["hpi_narrative"].lower()
        assert "Paracetamol" in summary["sections"]["medications"]["content"]
        assert "CONFIDENTIAL MEDICAL SUMMARY (DRAFT)" in summary["disclaimer"]

        # 4. Fetch Summary via GET
        get_res = await client.get(f"/api/v1/summaries/{encounter_id}")
        assert get_res.status_code == 200
        assert get_res.json()["id"] == summary["id"]
