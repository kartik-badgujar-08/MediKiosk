import abc
import uuid
from datetime import datetime, timezone
from app.core.config import settings
from app.core.logging import logger
from app.repositories.encounter_repo import encounter_repo
from app.schemas.integrations import HISSyncRequest, HISSyncResponse
from app.services.clinical.state_service import clinical_state_service


class BaseHISService(abc.ABC):
    @abc.abstractmethod
    async def sync_encounter(self, request: HISSyncRequest) -> HISSyncResponse:
        pass


class MockHISAdapter(BaseHISService):
    """
    Hospital Information System (HIS / EHR) integration adapter.
    Pushes intake encounter clinical facts into hospital database.
    """

    async def sync_encounter(self, request: HISSyncRequest) -> HISSyncResponse:
        now = datetime.now(timezone.utc).isoformat()
        state = await clinical_state_service.get_or_create_state(request.encounter_id)
        
        # Count total facts synchronized
        total_facts = (
            (1 if state.chief_complaint else 0)
            + len(state.history_of_present_illness)
            + len(state.medications)
            + len(state.allergies)
            + len(state.associated_symptoms)
            + len(state.investigations)
        )

        return HISSyncResponse(
            status="SYNCHRONIZED",
            his_transaction_id=f"his-tx-{uuid.uuid4().hex[:10]}",
            encounter_id=request.encounter_id,
            records_synced=total_facts,
            is_mock=True,
            timestamp=now,
        )


def get_his_service() -> BaseHISService:
    return MockHISAdapter()


his_service = get_his_service()
