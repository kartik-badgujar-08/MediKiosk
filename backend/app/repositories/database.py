import json
import os
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.logging import logger

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
DB_FILE_PATH = DATA_DIR / "medikiosk_db.json"


class DatabaseManager:
    """
    Persistent Dual-Engine Database Manager:
    - Primary: MongoDB Motor Client (production / cloud cluster).
    - Persistent Local Engine: Disk-persisted JSON database storing all collections
      (patients, encounters, clinical_states, documents, summaries, verification_events)
      directly to `backend/data/medikiosk_db.json`.
    """

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
        self._init_local_persistence()

    def _init_local_persistence(self):
        """Ensure data directory and load persistent records from disk."""
        try:
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            if DB_FILE_PATH.exists():
                with open(DB_FILE_PATH, "r", encoding="utf-8") as f:
                    saved = json.load(f)
                    for col, records in saved.items():
                        self._in_memory_store.setdefault(col, {}).update(records)
                logger.info(f"Loaded persistent database from {DB_FILE_PATH}", extra={"service": "database"})
            else:
                self._seed_default_records()
                self._save_to_disk()
        except Exception as e:
            logger.warning(f"Failed to load persistent db file: {e}", extra={"service": "database"})

    def _save_to_disk(self):
        """Persist current state to disk JSON file."""
        try:
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            with open(DB_FILE_PATH, "w", encoding="utf-8") as f:
                json.dump(self._in_memory_store, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Failed to save db to disk: {e}", extra={"service": "database"})

    def _seed_default_records(self):
        """Pre-seed standard clinical intake records for immediate local operation."""
        # Patient 1: Rahul Sharma
        p1_id = "pat-rahul-sharma-001"
        self._in_memory_store["patients"][p1_id] = {
            "id": p1_id,
            "name": "Rahul Sharma",
            "age": 35,
            "gender": "Male",
            "phone": "+91-9876543210",
            "uhid": "UHID-2026-092811",
            "abha_id": "91-2834-5829-1029",
            "abha_number": "91-2834-5829-1029",
            "abha_address": "rahul.sharma@abdm",
            "preferred_language": "hi",
            "created_at": "2026-09-17T10:00:00Z",
            "updated_at": "2026-09-17T10:00:00Z",
        }

        # Patient 2: Sunita Patil
        p2_id = "pat-sunita-patil-002"
        self._in_memory_store["patients"][p2_id] = {
            "id": p2_id,
            "name": "Sunita Patil",
            "age": 52,
            "gender": "Female",
            "phone": "+91-9812345678",
            "uhid": "UHID-2026-081244",
            "abha_id": "91-9482-1049-3821",
            "abha_number": "91-9482-1049-3821",
            "abha_address": "sunita.patil@abdm",
            "preferred_language": "mr",
            "created_at": "2026-09-17T11:00:00Z",
            "updated_at": "2026-09-17T11:00:00Z",
        }

        # Encounter 1: Rahul Sharma - Febrile Syndrome
        e1_id = "enc-demo-fever-001"
        self._in_memory_store["encounters"][e1_id] = {
            "id": e1_id,
            "patient_id": p1_id,
            "doctor_id": "doc-anita-desai-001",
            "chief_complaint": "Fever with severe body ache and chills",
            "status": "PENDING_REVIEW",
            "intake_channel": "voice",
            "language": "hi",
            "consent_given": True,
            "created_at": "2026-09-17T10:15:00Z",
            "updated_at": "2026-09-17T10:25:00Z",
        }

        # Encounter 2: Sunita Patil - Chest Discomfort (Red Flag)
        e2_id = "enc-demo-chest-002"
        self._in_memory_store["encounters"][e2_id] = {
            "id": e2_id,
            "patient_id": p2_id,
            "doctor_id": "doc-anita-desai-001",
            "chief_complaint": "Acute chest tightness radiating to left arm with cold sweat",
            "status": "PENDING_REVIEW",
            "intake_channel": "touch",
            "language": "mr",
            "consent_given": True,
            "created_at": "2026-09-17T11:30:00Z",
            "updated_at": "2026-09-17T11:45:00Z",
        }

    async def connect(self):
        try:
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=1000,
                connectTimeoutMS=1000,
            )
            await self.client.admin.command('ping')
            self.db = self.client[settings.DB_NAME]
            self.is_connected = True
            logger.info("Successfully connected to MongoDB Cluster", extra={"service": "database"})
        except Exception as e:
            self.is_connected = False
            logger.info(
                f"Using disk-backed persistent storage at {DB_FILE_PATH}",
                extra={"service": "database"}
            )

    async def get_collection(self, collection_name: str):
        if self.is_connected and self.db is not None:
            return self.db[collection_name]
        return None

    def get_stats(self) -> Dict[str, Any]:
        """Return collection counts and storage metadata."""
        counts = {col: len(records) for col, records in self._in_memory_store.items()}
        return {
            "backend_storage": "MongoDB" if self.is_connected else "Persistent Disk JSON",
            "db_file": str(DB_FILE_PATH),
            "file_exists": DB_FILE_PATH.exists(),
            "file_size_bytes": DB_FILE_PATH.stat().st_size if DB_FILE_PATH.exists() else 0,
            "collections": counts,
        }

    async def insert_one(self, collection: str, document: Dict[str, Any]) -> Dict[str, Any]:
        doc_id = document.get("id") or document.get("_id")
        if not doc_id:
            doc_id = str(uuid.uuid4())
            document["id"] = doc_id

        if self.is_connected and self.db is not None:
            await self.db[collection].insert_one(document.copy())
            return document

        self._in_memory_store.setdefault(collection, {})[doc_id] = document.copy()
        self._save_to_disk()
        return document

    async def find_one(self, collection: str, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if self.is_connected and self.db is not None:
            res = await self.db[collection].find_one(query)
            if res and "_id" in res and "id" not in res:
                res["id"] = str(res["_id"])
            return res

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
            self._save_to_disk()
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
            self._save_to_disk()
            return True
        return False


db_manager = DatabaseManager()
