import uuid
from datetime import datetime, timezone
from typing import List, Optional
from app.repositories.database import db_manager
from app.schemas.patient import PatientCreate


class PatientRepository:
    COLLECTION = "patients"

    async def get_by_id(self, patient_id: str) -> Optional[dict]:
        return await db_manager.find_one(self.COLLECTION, {"id": patient_id})

    async def get_by_uhid(self, uhid: str) -> Optional[dict]:
        return await db_manager.find_one(self.COLLECTION, {"uhid": uhid})

    async def list_patients(self, limit: int = 100, skip: int = 0) -> List[dict]:
        return await db_manager.find_many(self.COLLECTION, limit=limit, skip=skip)

    async def create(self, patient_in: PatientCreate) -> dict:
        patient_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        # Generate default UHID if none provided
        uhid = patient_in.uhid or f"UHID-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"

        patient_doc = {
            "id": patient_id,
            "name": patient_in.name,
            "age": patient_in.age,
            "gender": patient_in.gender,
            "phone": patient_in.phone,
            "uhid": uhid,
            "abha_id": patient_in.abha_id,
            "preferred_language": patient_in.preferred_language,
            "created_at": now,
            "updated_at": now,
        }
        await db_manager.insert_one(self.COLLECTION, patient_doc)
        return patient_doc


patient_repo = PatientRepository()
