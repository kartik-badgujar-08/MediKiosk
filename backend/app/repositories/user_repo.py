import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from app.repositories.database import db_manager
from app.schemas.user import UserCreate
from app.core.security import get_password_hash


class UserRepository:
    COLLECTION = "users"

    async def get_by_email(self, email: str) -> Optional[dict]:
        return await db_manager.find_one(self.COLLECTION, {"email": email.lower()})

    async def get_by_id(self, user_id: str) -> Optional[dict]:
        return await db_manager.find_one(self.COLLECTION, {"id": user_id})

    async def create(self, user_in: UserCreate) -> dict:
        user_id = str(uuid.uuid4())
        hashed_pwd = get_password_hash(user_in.password)
        now = datetime.now(timezone.utc).isoformat()

        user_doc = {
            "id": user_id,
            "email": user_in.email.lower(),
            "full_name": user_in.full_name,
            "role": user_in.role,
            "is_active": user_in.is_active,
            "hashed_password": hashed_pwd,
            "created_at": now,
            "updated_at": now,
        }
        await db_manager.insert_one(self.COLLECTION, user_doc)
        return user_doc

    async def create_or_update_doctor(self, doc_data: Dict[str, Any]) -> dict:
        email = doc_data.get("email", "").lower()
        existing = await self.get_by_email(email) if email else None
        now = datetime.now(timezone.utc).isoformat()
        if existing:
            await db_manager.update_one(
                self.COLLECTION, 
                {"id": existing["id"]}, 
                {"$set": {"metadata": doc_data.get("metadata", {}), "updated_at": now}}
            )
            return existing

        user_id = str(uuid.uuid4())
        user_doc = {
            "id": user_id,
            "email": email,
            "full_name": doc_data.get("full_name", "Doctor"),
            "role": "doctor",
            "is_active": True,
            "hashed_password": get_password_hash("GovVerifiedAuth!"),
            "metadata": doc_data.get("metadata", {}),
            "created_at": now,
            "updated_at": now,
        }
        await db_manager.insert_one(self.COLLECTION, user_doc)
        return user_doc


user_repo = UserRepository()
