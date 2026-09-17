import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_demo_seed_and_e2e_scenarios():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Trigger Demo Seed
        seed_res = await client.post("/api/v1/demo/seed")
        assert seed_res.status_code == 200
        data = seed_res.json()
        assert data["status"] == "seeded"
        assert len(data["scenarios"]) == 2

        # 2. Verify Rahul Sharma Scenario (Fever + OCR + Red Flag)
        rahul_scenario = next(s for s in data["scenarios"] if s["patient_name"] == "Rahul Sharma")
        enc_id = rahul_scenario["encounter_id"]
        p_id = rahul_scenario["patient_id"]

        # Check clinical state
        state_res = await client.get(f"/api/v1/clinical-state/{enc_id}")
        assert state_res.status_code == 200
        state = state_res.json()
        assert state["chief_complaint"]["value"] == "Fever"
        assert len(state["medications"]) >= 1
        assert len(state["investigations"]) >= 1

        # Check Red flags
        assert len(state["red_flags"]) >= 1
        assert any("Vector Exposure" in rf["title"] for rf in state["red_flags"])

        # Check Physician Summary
        sum_res = await client.get(f"/api/v1/summaries/{enc_id}")
        assert sum_res.status_code == 200
        assert "Rahul Sharma" in sum_res.json()["patient_demographics"]["name"]

        # Check FHIR Bundle
        fhir_res = await client.get(f"/api/v1/fhir/bundle/{enc_id}")
        assert fhir_res.status_code == 200
        assert fhir_res.json()["resourceType"] == "Bundle"

        # Check Longitudinal Timeline
        time_res = await client.get(f"/api/v1/timeline/{p_id}")
        assert time_res.status_code == 200
        assert time_res.json()["total_events"] >= 3

        # 3. Verify Sunita Patil Scenario (ISL Accessibility Demo)
        sunita_scenario = next(s for s in data["scenarios"] if s["patient_name"] == "Sunita Patil")
        enc_sunita_id = sunita_scenario["encounter_id"]

        sunita_state_res = await client.get(f"/api/v1/clinical-state/{enc_sunita_id}")
        assert sunita_state_res.status_code == 200
        sunita_state = sunita_state_res.json()
        assert sunita_state["chief_complaint"]["source"] == "sign_language"
        assert sunita_state["pain_assessment"]["site"]["value"] == "Abdomen Upper"
