import uuid
from datetime import datetime, timezone
from typing import List, Optional, Union
from app.repositories.database import db_manager
from app.schemas.patient import PatientCreate


class PatientRepository:
    COLLECTION = "patients"

    async def get_by_id(self, patient_id: str) -> Optional[dict]:
        return await db_manager.find_one(self.COLLECTION, {"id": patient_id})

    async def get_by_uhid(self, uhid: str) -> Optional[dict]:
        return await db_manager.find_one(self.COLLECTION, {"uhid": uhid})

    async def get_by_abha_id(self, abha_id: str) -> Optional[dict]:
        return await db_manager.find_one(self.COLLECTION, {"abha_id": abha_id})

    async def list_patients(self, limit: int = 100, skip: int = 0) -> List[dict]:
        return await db_manager.find_many(self.COLLECTION, limit=limit, skip=skip)

    async def search(self, name: Optional[str] = None) -> List[dict]:
        all_patients = await self.list_patients(limit=200)
        if not name:
            return all_patients
        return [p for p in all_patients if name.lower() in p.get("name", "").lower()]

    async def create(self, patient_in: PatientCreate) -> dict:
        patient_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        if isinstance(patient_in, dict):
            raw_uhid = patient_in.get("uhid")
            name = patient_in.get("name", "")
            age = patient_in.get("age", 0)
            gender = patient_in.get("gender", "Other")
            phone = patient_in.get("phone", "")
            abha_id = patient_in.get("abha_id")
            preferred_language = patient_in.get("preferred_language") or patient_in.get("language_preference", "en")
            metadata = patient_in.get("metadata", {})
        else:
            raw_uhid = patient_in.uhid
            name = patient_in.name
            age = patient_in.age
            gender = patient_in.gender
            phone = patient_in.phone
            abha_id = patient_in.abha_id
            preferred_language = patient_in.preferred_language
            metadata = {}

        uhid = raw_uhid or f"UHID-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"

        patient_doc = {
            "id": patient_id,
            "name": name,
            "age": age,
            "gender": gender,
            "phone": phone,
            "uhid": uhid,
            "abha_id": abha_id,
            "preferred_language": preferred_language,
            "metadata": metadata,
            "created_at": now,
            "updated_at": now,
        }
        await db_manager.insert_one(self.COLLECTION, patient_doc)
        return patient_doc


patient_repo = PatientRepository()
