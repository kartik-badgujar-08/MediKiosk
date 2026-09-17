import uuid
from datetime import datetime, timezone
from typing import Optional
from app.repositories.database import db_manager


class SummaryRepository:
    COLLECTION = "summaries"

    async def get_by_encounter(self, encounter_id: str) -> Optional[dict]:
        return await db_manager.find_one(self.COLLECTION, {"encounter_id": encounter_id})

    async def save_or_update(self, summary_dict: dict) -> dict:
        now = datetime.now(timezone.utc).isoformat()
        summary_dict["updated_at"] = now

        encounter_id = summary_dict["encounter_id"]
        existing = await self.get_by_encounter(encounter_id)
        if existing:
            await db_manager.update_one(self.COLLECTION, {"encounter_id": encounter_id}, summary_dict)
            return summary_dict

        if "id" not in summary_dict or not summary_dict["id"]:
            summary_dict["id"] = str(uuid.uuid4())
        summary_dict["created_at"] = now
        await db_manager.insert_one(self.COLLECTION, summary_dict)
        return summary_dict


summary_repo = SummaryRepository()
