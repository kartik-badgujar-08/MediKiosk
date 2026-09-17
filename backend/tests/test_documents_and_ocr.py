import io
import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_document_upload_ocr_and_clinical_ner():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Setup Patient and Encounter
        p_res = await client.post(
            "/api/v1/patients/",
            json={"name": "Rahul Sharma", "age": 35, "gender": "Male"},
        )
        patient_id = p_res.json()["id"]

        e_res = await client.post(
            "/api/v1/encounters/",
            json={"patient_id": patient_id, "intake_channel": "document"},
        )
        encounter_id = e_res.json()["id"]

        # 2. Upload Sample Prescription Document
        fake_file_content = b"%PDF-1.4 Mock Prescription Content for Rahul Sharma"
        files = {
            "file": ("prescription_opd_01.pdf", io.BytesIO(fake_file_content), "application/pdf")
        }
        data = {"encounter_id": encounter_id}

        upload_res = await client.post("/api/v1/documents/upload", data=data, files=files)
        assert upload_res.status_code == 201
        doc_data = upload_res.json()
        doc_id = doc_data["id"]
        assert doc_data["filename"] == "prescription_opd_01.pdf"
        assert doc_data["status"] == "UPLOADED"

        # 3. Process Document with OCR + Clinical NER Pipeline
        proc_res = await client.post(f"/api/v1/documents/{doc_id}/process")
        assert proc_res.status_code == 200
        extraction = proc_res.json()
        assert extraction["ocr_engine"].startswith("mock-paddleocr")
        assert "Paracetamol" in extraction["raw_text"]
        
        # Verify MedCAT/NER extracted entities
        entities = extraction["extracted_entities"]
        assert len(entities) >= 1
        drug_names = [e["name"] for e in entities if e["category"] == "medication"]
        assert "Paracetamol" in drug_names

        # 4. Verify Canonical Clinical State was automatically updated with OCR provenance
        state_res = await client.get(f"/api/v1/clinical-state/{encounter_id}")
        assert state_res.status_code == 200
        state = state_res.json()
        assert len(state["medications"]) >= 1
        paracetamol_fact = next(m for m in state["medications"] if "Paracetamol" in m["name"])
        assert paracetamol_fact["source"] == "ocr"
        assert paracetamol_fact["confidence"] >= 0.90
