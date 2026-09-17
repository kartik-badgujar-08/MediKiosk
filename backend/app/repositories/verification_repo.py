import uuid
from datetime import datetime, timezone
from typing import List, Optional
from app.repositories.database import db_manager


class VerificationRepository:
    EVENTS_COLLECTION = "verification_events"
    AUDIT_COLLECTION = "audit_logs"

    async def log_event(
        self,
        encounter_id: str,
        actor_type: str,
        actor_id: str,
        action_type: str,
        details: dict,
    ) -> dict:
        event_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        event = {
            "id": event_id,
            "encounter_id": encounter_id,
            "actor_type": actor_type,
            "actor_id": actor_id,
            "action_type": action_type,
            "details": details,
            "timestamp": now,
        }
        await db_manager.insert_one(self.EVENTS_COLLECTION, event)

        # Mirror into security audit log
        audit_record = {
            "id": str(uuid.uuid4()),
            "event_type": f"VERIFICATION_{action_type.upper()}",
            "encounter_id": encounter_id,
            "actor": f"{actor_type}:{actor_id}",
            "details": details,
            "timestamp": now,
        }
        await db_manager.insert_one(self.AUDIT_COLLECTION, audit_record)
        return event

    async def get_events_for_encounter(self, encounter_id: str) -> List[dict]:
        return await db_manager.find_many(self.EVENTS_COLLECTION, {"encounter_id": encounter_id})

    async def get_audit_logs(self, limit: int = 100, skip: int = 0) -> List[dict]:
        return await db_manager.find_many(self.AUDIT_COLLECTION, limit=limit, skip=skip)


verification_repo = VerificationRepository()
