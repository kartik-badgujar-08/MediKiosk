import asyncio
from typing import Any, Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.logging import logger


class DatabaseManager:
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
        self.is_connected = False
        self._in_memory_store: Dict[str, Dict[str, Any]] = {
            "users": {},
            "patients": {},
            "encounters": {},
            "clinical_states": {},
            "documents": {},
            "document_extractions": {},
            "summaries": {},
            "verification_events": {},
            "audit_logs": {},
        }

    async def connect(self):
        try:
            # Attempt to connect to MongoDB with a short timeout
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=2000,
                connectTimeoutMS=2000,
            )
            # Verify connection
            await self.client.admin.command('ping')
            self.db = self.client[settings.DB_NAME]
            self.is_connected = True
            logger.info("Successfully connected to MongoDB", extra={"service": "database"})
        except Exception as e:
            self.is_connected = False
            logger.warning(
                f"MongoDB connection failed ({str(e)}). Activating in-memory database store for local development/testing.",
                extra={"service": "database"}
            )

    async def get_collection(self, collection_name: str):
        if self.is_connected and self.db is not None:
            return self.db[collection_name]
        return None

    # Generic CRUD operations compatible with both MongoDB and In-Memory fallback
    async def insert_one(self, collection: str, document: Dict[str, Any]) -> Dict[str, Any]:
        doc_id = document.get("id") or document.get("_id")
        if not doc_id:
            import uuid
            doc_id = str(uuid.uuid4())
            document["id"] = doc_id

        if self.is_connected and self.db is not None:
            await self.db[collection].insert_one(document.copy())
            return document

        self._in_memory_store.setdefault(collection, {})[doc_id] = document.copy()
        return document

    async def find_one(self, collection: str, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if self.is_connected and self.db is not None:
            res = await self.db[collection].find_one(query)
            if res and "_id" in res and "id" not in res:
                res["id"] = str(res["_id"])
            return res

        # In-memory query matcher
        records = self._in_memory_store.get(collection, {}).values()
        for rec in records:
            match = True
            for k, v in query.items():
                if rec.get(k) != v:
                    match = False
                    break
            if match:
                return rec.copy()
        return None

    async def find_many(
        self,
        collection: str,
        query: Optional[Dict[str, Any]] = None,
        limit: int = 100,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        query = query or {}
        if self.is_connected and self.db is not None:
            cursor = self.db[collection].find(query).skip(skip).limit(limit)
            results = []
            async for doc in cursor:
                if "_id" in doc and "id" not in doc:
                    doc["id"] = str(doc["_id"])
                results.append(doc)
            return results

        records = list(self._in_memory_store.get(collection, {}).values())
        filtered = []
        for rec in records:
            match = True
            for k, v in query.items():
                if rec.get(k) != v:
                    match = False
                    break
            if match:
                filtered.append(rec.copy())
        return filtered[skip : skip + limit]

    async def update_one(
        self,
        collection: str,
        query: Dict[str, Any],
        update_data: Dict[str, Any]
    ) -> bool:
        if self.is_connected and self.db is not None:
            res = await self.db[collection].update_one(query, {"$set": update_data})
            return res.modified_count > 0

        record = await self.find_one(collection, query)
        if record:
            doc_id = record["id"]
            self._in_memory_store[collection][doc_id].update(update_data)
            return True
        return False

    async def delete_one(self, collection: str, query: Dict[str, Any]) -> bool:
        if self.is_connected and self.db is not None:
            res = await self.db[collection].delete_one(query)
            return res.deleted_count > 0

        record = await self.find_one(collection, query)
        if record:
            doc_id = record["id"]
            del self._in_memory_store[collection][doc_id]
            return True
        return False


db_manager = DatabaseManager()
