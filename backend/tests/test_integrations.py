import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_abdm_and_his_integration_workflow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Setup Patient and Encounter
        p_res = await client.post(
            "/api/v1/patients/",
            json={"name": "Rahul Sharma", "age": 35, "gender": "Male", "abha_id": "rahul.sharma@abdm"},
        )
        patient_id = p_res.json()["id"]

        e_res = await client.post(
            "/api/v1/encounters/",
            json={"patient_id": patient_id, "chief_complaint": "Acute Fever", "intake_channel": "voice"},
        )
        encounter_id = e_res.json()["id"]

        # 2. ABDM Care Context Link
        link_res = await client.post(
            "/api/v1/abdm/link-care-context",
            json={
                "patient_id": patient_id,
                "encounter_id": encounter_id,
                "abha_address": "rahul.sharma@abdm",
            },
        )
        assert link_res.status_code == 200
        link_data = link_res.json()
        assert link_data["status"] == "LINKED"
        assert link_data["gateway_mode"] == "SANDBOX"
        assert link_data["is_mock"] is True

        # 3. ABDM Push Health Record (FHIR payload)
        push_res = await client.post(
            "/api/v1/abdm/push-health-record",
            json={
                "encounter_id": encounter_id,
                "abha_address": "rahul.sharma@abdm",
            },
        )
        assert push_res.status_code == 200
        push_data = push_res.json()
        assert push_data["status"] == "SUCCESS"
        assert push_data["hip_id"] == "MEDIKIOSK_OPD_01"
        assert push_data["gateway_mode"] == "SANDBOX"

        # 4. HIS Integration Sync
        his_res = await client.post(
            "/api/v1/his/sync",
            json={
                "encounter_id": encounter_id,
                "his_system_code": "HOSP_HIS_CORE",
            },
        )
        assert his_res.status_code == 200
        his_data = his_res.json()
        assert his_data["status"] == "SYNCHRONIZED"
        assert his_data["encounter_id"] == encounter_id
        assert his_data["is_mock"] is True
