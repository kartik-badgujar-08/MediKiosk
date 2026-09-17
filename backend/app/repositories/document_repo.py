import uuid
from datetime import datetime, timezone
from typing import List, Optional
from app.repositories.database import db_manager


class DocumentRepository:
    DOCUMENTS_COLLECTION = "documents"
    EXTRACTIONS_COLLECTION = "document_extractions"

    async def create_document(
        self,
        encounter_id: str,
        patient_id: str,
        filename: str,
        content_type: str,
        size_bytes: int,
        storage_path: str,
    ) -> dict:
        doc_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        doc = {
            "id": doc_id,
            "encounter_id": encounter_id,
            "patient_id": patient_id,
            "filename": filename,
            "content_type": content_type,
            "size_bytes": size_bytes,
            "storage_path": storage_path,
            "status": "UPLOADED",
            "created_at": now,
            "updated_at": now,
        }
        await db_manager.insert_one(self.DOCUMENTS_COLLECTION, doc)
        return doc

    async def get_document(self, document_id: str) -> Optional[dict]:
        doc = await db_manager.find_one(self.DOCUMENTS_COLLECTION, {"id": document_id})
        if doc:
            extraction = await db_manager.find_one(self.EXTRACTIONS_COLLECTION, {"document_id": document_id})
            doc["extraction"] = extraction
        return doc

    async def list_by_encounter(self, encounter_id: str) -> List[dict]:
        docs = await db_manager.find_many(self.DOCUMENTS_COLLECTION, {"encounter_id": encounter_id})
        for doc in docs:
            extraction = await db_manager.find_one(self.EXTRACTIONS_COLLECTION, {"document_id": doc["id"]})
            doc["extraction"] = extraction
        return docs

    async def update_status(self, document_id: str, status: str) -> bool:
        now = datetime.now(timezone.utc).isoformat()
        return await db_manager.update_one(
            self.DOCUMENTS_COLLECTION,
            {"id": document_id},
            {"status": status, "updated_at": now}
        )

    async def save_extraction(self, extraction_dict: dict) -> dict:
        now = datetime.now(timezone.utc).isoformat()
        extraction_dict["created_at"] = now
        await db_manager.insert_one(self.EXTRACTIONS_COLLECTION, extraction_dict)
        await self.update_status(extraction_dict["document_id"], "PROCESSED")
        return extraction_dict


document_repo = DocumentRepository()
