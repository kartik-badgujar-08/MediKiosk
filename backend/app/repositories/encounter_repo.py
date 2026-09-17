import uuid
from datetime import datetime, timezone
from typing import List, Optional
from app.repositories.database import db_manager
from app.schemas.encounter import EncounterCreate


class EncounterRepository:
    COLLECTION = "encounters"

    async def get_by_id(self, encounter_id: str) -> Optional[dict]:
        return await db_manager.find_one(self.COLLECTION, {"id": encounter_id})

    async def list_by_patient(self, patient_id: str) -> List[dict]:
        return await db_manager.find_many(self.COLLECTION, {"patient_id": patient_id})

    async def list_all(self, limit: int = 100, skip: int = 0) -> List[dict]:
        return await db_manager.find_many(self.COLLECTION, limit=limit, skip=skip)

    async def create(self, encounter_in: EncounterCreate) -> dict:
        encounter_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        encounter_doc = {
            "id": encounter_id,
            "patient_id": encounter_in.patient_id,
            "status": "IN_PROGRESS",
            "chief_complaint": encounter_in.chief_complaint,
            "intake_channel": encounter_in.intake_channel,
            "language": encounter_in.language,
            "consent_given": encounter_in.consent_given,
            "consent_timestamp": now if encounter_in.consent_given else None,
            "created_at": now,
            "updated_at": now,
        }
        await db_manager.insert_one(self.COLLECTION, encounter_doc)
        return encounter_doc

    async def update_status(self, encounter_id: str, status: str) -> bool:
        now = datetime.now(timezone.utc).isoformat()
        return await db_manager.update_one(
            self.COLLECTION,
            {"id": encounter_id},
            {"status": status, "updated_at": now}
        )

    async def update_consent(self, encounter_id: str, consent_given: bool) -> bool:
        now = datetime.now(timezone.utc).isoformat()
        return await db_manager.update_one(
            self.COLLECTION,
            {"id": encounter_id},
            {
                "consent_given": consent_given,
                "consent_timestamp": now if consent_given else None,
                "updated_at": now
            }
        )


encounter_repo = EncounterRepository()
