import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_patient_longitudinal_timeline():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Setup Patient and Encounter
        p_res = await client.post(
            "/api/v1/patients/",
            json={"name": "Rahul Sharma", "age": 35, "gender": "Male"},
        )
        patient_id = p_res.json()["id"]

        e_res = await client.post(
            "/api/v1/encounters/",
            json={"patient_id": patient_id, "chief_complaint": "Acute Fever (3 days)", "intake_channel": "voice"},
        )
        assert e_res.status_code == 201

        # 2. Query Longitudinal Timeline
        time_res = await client.get(f"/api/v1/timeline/{patient_id}")
        assert time_res.status_code == 200
        data = time_res.json()
        assert data["patient_id"] == patient_id
        assert data["total_events"] >= 3

        years = [e["year"] for e in data["events"]]
        assert "2026" in years
        assert "2025" in years
        assert "2024" in years
