import os
import uuid
from typing import List
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
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


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    encounter_id: str = Form(...),
    file: UploadFile = File(...),
):
    # Verify encounter exists
    encounter = await encounter_repo.get_by_id(encounter_id)
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Encounter '{encounter_id}' not found"
        )

    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: PNG, JPG, JPEG, PDF"
        )

    # Read and validate size
    content = await file.read()
    size_bytes = len(content)
    if size_bytes > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of 15MB (got {round(size_bytes / (1024*1024), 2)}MB)"
        )

    # Save to disk
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
            detail=f"Document '{document_id}' not found"
        )

    # 1. OCR Extraction (PaddleOCR / PP-Structure)
    ocr_result = await ocr_service.extract(
        file_path=doc["storage_path"],
        filename=doc["filename"],
        document_id=document_id,
    )

    # 2. Clinical NER & Concept Extraction (MedCAT)
    concepts = await clinical_ner_service.extract_concepts(
        text=ocr_result.raw_text,
        source=f"doc:{doc['filename']}"
    )
    ocr_result.extracted_entities = concepts

    # 3. Save extraction to repository
    await document_repo.save_extraction(ocr_result.model_dump())

    # 4. Normalize and merge extracted facts into Canonical Clinical State!
    encounter_id = doc["encounter_id"]
    for ent in concepts:
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
            detail=f"Document '{document_id}' not found"
        )
    return doc


@router.get("/encounter/{encounter_id}", response_model=List[DocumentResponse])
async def list_encounter_documents(encounter_id: str):
    return await document_repo.list_by_encounter(encounter_id)
