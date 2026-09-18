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


@pytest.mark.asyncio
async def test_get_summary_providers():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/v1/summaries/providers")
        assert res.status_code == 200
        data = res.json()
        assert "active_provider" in data
        assert "providers" in data
        provider_ids = [p["id"] for p in data["providers"]]
        assert "engine" in provider_ids
        assert "gemini" in provider_ids
        assert "ollama" in provider_ids
        assert "openai" in provider_ids


@pytest.mark.asyncio
async def test_soap_sections_and_multilingual_vernacular_summary():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Create Patient & Encounter
        p_res = await client.post(
            "/api/v1/patients/",
            json={"name": "Pooja Patil", "age": 28, "gender": "Female"},
        )
        patient_id = p_res.json()["id"]

        e_res = await client.post(
            "/api/v1/encounters/",
            json={"patient_id": patient_id, "intake_channel": "touch"},
        )
        encounter_id = e_res.json()["id"]

        # 2. Add Chief Complaint & SOCRATES Pain slots
        await client.post(
            f"/api/v1/clinical-state/{encounter_id}/facts",
            json={"category": "symptom", "name": "Chief Complaint", "value": "Headache", "source": "patient_touch"},
        )
        await client.post(
            f"/api/v1/clinical-state/{encounter_id}/facts",
            json={"category": "symptom", "name": "Pain Site", "value": "Frontal forehead", "source": "patient_touch"},
        )
        await client.post(
            f"/api/v1/clinical-state/{encounter_id}/facts",
            json={"category": "symptom", "name": "Nausea", "value": True, "source": "patient_touch"},
        )
        await client.post(
            f"/api/v1/clinical-state/{encounter_id}/facts",
            json={"category": "vital", "name": "Blood Pressure", "value": "118/76", "unit": "mmHg", "source": "ocr"},
        )

        # 3. Generate summary with vernacular translations
        res = await client.post(f"/api/v1/summaries/generate/{encounter_id}?provider=engine&language=hi")
        assert res.status_code == 200
        data = res.json()

        # Check SOAP sections
        assert "soap_sections" in data and data["soap_sections"] is not None
        soap = data["soap_sections"]
        assert "subjective" in soap
        assert "objective" in soap
        assert "assessment" in soap
        assert "plan" in soap
        assert "Headache" in soap["subjective"]["content"]
        assert "Frontal forehead" in soap["subjective"]["content"]
        assert "118/76" in soap["objective"]["content"]
        assert "TRIAGE PRIORITY" in soap["assessment"]["content"]

        # Check Patient Vernacular
        assert "patient_vernacular_summary" in data and data["patient_vernacular_summary"] is not None
        vernacular = data["patient_vernacular_summary"]
        assert "en" in vernacular and "Pooja Patil" in vernacular["en"]
        assert "hi" in vernacular and "नमस्ते Pooja Patil" in vernacular["hi"]
        assert "mr" in vernacular and "नमस्कार Pooja Patil" in vernacular["mr"]

        # Check Pertinent Positives
        assert any("Nausea" in p or "Frontal" in p for p in data["pertinent_positives"])
        assert data["triage_level"] in ("ROUTINE", "URGENT")


@pytest.mark.asyncio
async def test_emergency_triage_and_real_ocr_meds_synthesis():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Patient with chest pain and red flag
        p_res = await client.post(
            "/api/v1/patients/",
            json={"name": "Santu Ghorai", "age": 33, "gender": "Male"},
        )
        patient_id = p_res.json()["id"]

        e_res = await client.post(
            "/api/v1/encounters/",
            json={"patient_id": patient_id, "intake_channel": "touch"},
        )
        encounter_id = e_res.json()["id"]

        # Add symptoms matching user's real prescription
        await client.post(
            f"/api/v1/clinical-state/{encounter_id}/facts",
            json={"category": "symptom", "name": "Chief Complaint", "value": "Vertigo", "source": "patient_touch"},
        )
        # Real prescription drugs extracted by TrOCR
        await client.post(
            f"/api/v1/clinical-state/{encounter_id}/facts",
            json={"category": "medication", "name": "Vertin 16", "value": "16mg TDS x 10 days", "source": "ocr"},
        )
        await client.post(
            f"/api/v1/clinical-state/{encounter_id}/facts",
            json={"category": "medication", "name": "Sompraz D 40", "value": "40mg OD AC", "source": "ocr"},
        )
        await client.post(
            f"/api/v1/clinical-state/{encounter_id}/facts",
            json={"category": "medication", "name": "Ondem 4", "value": "4mg SOS", "source": "ocr"},
        )
        # Real BP extracted by TrOCR
        await client.post(
            f"/api/v1/clinical-state/{encounter_id}/facts",
            json={"category": "vital", "name": "Blood Pressure", "value": "131/83", "unit": "mmHg", "source": "ocr"},
        )

        res = await client.post(f"/api/v1/summaries/generate/{encounter_id}")
        assert res.status_code == 200
        summary = res.json()

        assert "Vertin 16" in summary["soap_sections"]["subjective"]["content"]
        assert "Sompraz D 40" in summary["soap_sections"]["subjective"]["content"]
        assert "131/83" in summary["soap_sections"]["objective"]["content"]
        assert "Vertin 16" in summary["patient_vernacular_summary"]["en"]


@pytest.mark.asyncio
async def test_update_encounter_summary_draft():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create test encounter
        p_res = await client.post(
            "/api/v1/patients/",
            json={"name": "Anita Verma", "age": 42, "gender": "Female"},
        )
        patient_id = p_res.json()["id"]

        e_res = await client.post(
            "/api/v1/encounters/",
            json={"patient_id": patient_id, "intake_channel": "touch"},
        )
        encounter_id = e_res.json()["id"]

        # 1. Update draft
        put_res = await client.put(
            f"/api/v1/summaries/{encounter_id}",
            json={
                "chief_complaint": "Acute Migraine with visual aura",
                "hpi_narrative": "Patient reports recurrent unilateral throbbing headache with nausea.",
                "triage_level": "URGENT",
                "doctor_notes": "Prescribed Sumatriptan 50mg SOS. Advised dark room rest.",
                "pertinent_positives": ["Photophobia", "Phonophobia", "Visual Aura"],
                "soap_sections": {
                    "assessment": {"title": "Assessment", "content": "Classical Migraine with aura."},
                    "plan": {"title": "Plan", "content": "1. Sumatriptan 50mg SOS\n2. Avoid chocolate and bright lights."}
                }
            },
        )
        assert put_res.status_code == 200
        saved = put_res.json()
        assert saved["chief_complaint"] == "Acute Migraine with visual aura"
        assert saved["hpi_narrative"] == "Patient reports recurrent unilateral throbbing headache with nausea."
        assert saved["triage_level"] == "URGENT"
        assert saved["doctor_notes"] == "Prescribed Sumatriptan 50mg SOS. Advised dark room rest."
        assert "Visual Aura" in saved["pertinent_positives"]
        assert "Classical Migraine with aura." in saved["soap_sections"]["assessment"]["content"]

        # 2. Re-fetch via GET to verify disk persistence
        get_res = await client.get(f"/api/v1/summaries/{encounter_id}")
        assert get_res.status_code == 200
        reloaded = get_res.json()
        assert reloaded["chief_complaint"] == "Acute Migraine with visual aura"
        assert reloaded["doctor_notes"] == "Prescribed Sumatriptan 50mg SOS. Advised dark room rest."


