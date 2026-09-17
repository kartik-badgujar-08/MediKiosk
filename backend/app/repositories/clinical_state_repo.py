import uuid
from datetime import datetime, timezone
from typing import Optional
from app.repositories.database import db_manager


class ClinicalStateRepository:
    COLLECTION = "clinical_states"

    async def get_by_encounter_id(self, encounter_id: str) -> Optional[dict]:
        return await db_manager.find_one(self.COLLECTION, {"encounter_id": encounter_id})

    async def save_or_update(self, state_dict: dict) -> dict:
        now = datetime.now(timezone.utc).isoformat()
        state_dict["updated_at"] = now

        encounter_id = state_dict.get("encounter_id")
        existing = await self.get_by_encounter_id(encounter_id)
        if existing:
            state_dict["version"] = existing.get("version", 1) + 1
            await db_manager.update_one(self.COLLECTION, {"encounter_id": encounter_id}, state_dict)
            return state_dict
        else:
            if "id" not in state_dict or not state_dict["id"]:
                state_dict["id"] = str(uuid.uuid4())
            state_dict["created_at"] = now
            state_dict["version"] = 1
            await db_manager.insert_one(self.COLLECTION, state_dict)
            return state_dict


clinical_state_repo = ClinicalStateRepository()
