import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_fhir_r4_bundle_generation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Setup Patient and Encounter
        p_res = await client.post(
            "/api/v1/patients/",
            json={"name": "Rahul Sharma", "age": 35, "gender": "Male", "uhid": "UHID-2026-9999"},
        )
        patient_id = p_res.json()["id"]

        e_res = await client.post(
            "/api/v1/encounters/",
            json={"patient_id": patient_id, "chief_complaint": "Acute Fever", "intake_channel": "voice"},
        )
        encounter_id = e_res.json()["id"]

        # 2. Add Medication and Allergy to Clinical State
        await client.post(
            f"/api/v1/clinical-state/{encounter_id}/facts",
            json={
                "category": "medication",
                "name": "Paracetamol 650mg",
                "value": "1 tab TDS",
                "source": "ocr",
                "confidence": 0.95,
            },
        )
        await client.post(
            f"/api/v1/clinical-state/{encounter_id}/facts",
            json={
                "category": "allergy",
                "name": "Penicillin",
                "value": "Severe anaphylaxis",
                "source": "patient_voice",
                "confidence": 0.98,
            },
        )

        # 3. Request FHIR R4 Bundle
        bundle_res = await client.get(f"/api/v1/fhir/bundle/{encounter_id}")
        assert bundle_res.status_code == 200
        bundle = bundle_res.json()
        assert bundle["resourceType"] == "Bundle"
        assert bundle["type"] == "collection"
        assert bundle["total"] >= 5

        # Check resource types present in bundle
        res_types = [e["resource"]["resourceType"] for e in bundle["entry"]]
        assert "Patient" in res_types
        assert "Encounter" in res_types
        assert "MedicationRequest" in res_types
        assert "AllergyIntolerance" in res_types
        assert "Provenance" in res_types

        # 4. Test FHIR Push Endpoint
        push_res = await client.post(f"/api/v1/fhir/push/{encounter_id}")
        assert push_res.status_code == 200
        push_data = push_res.json()
        assert push_data["status"] == "synchronized"
        assert push_data["resources_pushed"] == bundle["total"]
