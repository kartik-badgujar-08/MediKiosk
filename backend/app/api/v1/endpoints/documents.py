import os
import uuid
from typing import Any, Dict, List
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from app.repositories.document_repo import document_repo
from app.repositories.encounter_repo import encounter_repo
from app.schemas.clinical_state import ClinicalFact
from app.schemas.document import DocumentExtractionResult, DocumentResponse
from app.services.clinical.ner_service import clinical_ner_service
from app.services.clinical.state_service import clinical_state_service
from app.services.ocr.ocr_service import ocr_service

router = APIRouter()

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".pdf"}
MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15MB


class SampleAttachRequest(BaseModel):
    encounter_id: str
    sample_id: str  # "sample_rx" | "sample_cbc" | "sample_diabetic"


SAMPLE_DOCUMENTS = {
    "sample_rx": {
        "filename": "Prescription_DrAnitaDesai_OPD.pdf",
        "title": "Doctor's Handwritten Prescription (OPD)",
        "subtitle": "Dr. Anita Desai • Paracetamol 650mg TDS, Pantoprazole 40mg OD, Azithromycin 500mg, ORS",
        "type": "prescription",
        "content_type": "application/pdf",
        "ocr_model": "microsoft/trocr-base-handwritten",
    },
    "sample_cbc": {
        "filename": "CBC_Metropolis_Diagnostic_Report.pdf",
        "title": "Complete Blood Count (CBC) Panel",
        "subtitle": "Metropolis Diagnostics • Platelets 92,000 /uL [LOW], Hb 11.2 g/dL [LOW], WBC 7,400",
        "type": "lab_report",
        "content_type": "application/pdf",
        "ocr_model": "tabular-lab-extractor-v2",
    },
    "sample_diabetic": {
        "filename": "Diabetic_Lipid_Panel_Apollo.pdf",
        "title": "Diabetic & Lipid Metabolic Panel",
        "subtitle": "Apollo Diagnostics • Fasting Glucose 186 mg/dL [HIGH], HbA1c 8.4% [HIGH], Cholesterol 224",
        "type": "lab_report",
        "content_type": "application/pdf",
        "ocr_model": "tabular-lab-extractor-v2",
    },
}


@router.get("/samples/list")
async def list_sample_documents():
    return [
        {"id": key, **meta}
        for key, meta in SAMPLE_DOCUMENTS.items()
    ]


@router.post("/sample/attach")
async def attach_sample_document(req: SampleAttachRequest):
    encounter = await encounter_repo.get_by_id(req.encounter_id)
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{req.encounter_id}' not found",
        )

    sample_meta = SAMPLE_DOCUMENTS.get(req.sample_id, SAMPLE_DOCUMENTS["sample_rx"])
    filename = sample_meta["filename"]

    # Create dummy file on disk if not exists
    file_path = os.path.join(UPLOAD_DIR, f"sample_{req.sample_id}_{filename}")
    if not os.path.exists(file_path):
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(f"SAMPLE DOCUMENT: {sample_meta['title']}\nFilename: {filename}\n")

    doc = await document_repo.create_document(
        encounter_id=req.encounter_id,
        patient_id=encounter["patient_id"],
        filename=filename,
        content_type=sample_meta["content_type"],
        size_bytes=42000,
        storage_path=file_path,
    )

    # Process immediately
    extraction = await process_document(doc["id"])
    return {
        "document": doc,
        "extraction": extraction,
    }


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    encounter_id: str = Form(...),
    file: UploadFile = File(...),
):
    encounter = await encounter_repo.get_by_id(encounter_id)
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{encounter_id}' not found",
        )

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: PNG, JPG, JPEG, PDF",
        )

    content = await file.read()
    size_bytes = len(content)
    if size_bytes > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of 15MB (got {round(size_bytes / (1024*1024), 2)}MB)",
        )

    stored_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, stored_filename)
    with open(file_path, "wb") as f:
        f.write(content)

    doc = await document_repo.create_document(
        encounter_id=encounter_id,
        patient_id=encounter["patient_id"],
        filename=file.filename,
        content_type=file.content_type or "application/octet-stream",
        size_bytes=size_bytes,
        storage_path=file_path,
    )
    return doc


@router.post("/{document_id}/process", response_model=DocumentExtractionResult)
async def process_document(document_id: str):
    doc = await document_repo.get_document(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_id}' not found",
        )

    # 1. OCR Extraction (TrOCR / Tabular Lab Parser / pypdf)
    ocr_result = await ocr_service.extract(
        file_path=doc["storage_path"],
        filename=doc["filename"],
        document_id=document_id,
    )

    # 2. Clinical NER & Concept Extraction (MedCAT)
    ner_concepts = await clinical_ner_service.extract_concepts(
        text=ocr_result.raw_text,
        source=f"doc:{doc['filename']}",
    )

    # Merge extracted entities without duplicates
    existing_names = {ent.name.lower() for ent in ocr_result.extracted_entities}
    for ent in ner_concepts:
        if ent.name.lower() not in existing_names:
            ocr_result.extracted_entities.append(ent)
            existing_names.add(ent.name.lower())

    # 3. Save extraction to repository
    await document_repo.save_extraction(ocr_result.model_dump())

    # 4. Normalize and merge extracted facts into Canonical Clinical State
    encounter_id = doc["encounter_id"]
    for ent in ocr_result.extracted_entities:
        category = "medication" if ent.category == "medication" else "investigation" if ent.category == "lab_test" else "symptom"
        fact = ClinicalFact(
            category=category,
            name=ent.name,
            value=ent.value,
            unit=ent.unit,
            source="ocr",
            confidence=ent.confidence,
            verification_status="PENDING",
            notes=f"Extracted from uploaded document '{doc['filename']}' via {ent.extraction_method}",
        )
        await clinical_state_service.add_fact(encounter_id, fact)

    return ocr_result


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str):
    doc = await document_repo.get_document(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_id}' not found",
        )
    return doc


@router.get("/encounter/{encounter_id}", response_model=List[DocumentResponse])
async def list_encounter_documents(encounter_id: str):
    return await document_repo.list_by_encounter(encounter_id)
