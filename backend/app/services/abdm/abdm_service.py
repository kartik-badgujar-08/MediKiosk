import abc
import uuid
from datetime import datetime, timezone
from app.core.config import settings
from app.core.logging import logger
from app.schemas.integrations import (
    ABDMCareContextLinkRequest,
    ABDMCareContextLinkResponse,
    ABDMRecordPushRequest,
    ABDMRecordPushResponse,
)
from app.services.fhir.fhir_service import fhir_service


class BaseABDMService(abc.ABC):
    @abc.abstractmethod
    async def link_care_context(self, request: ABDMCareContextLinkRequest) -> ABDMCareContextLinkResponse:
        pass

    @abc.abstractmethod
    async def push_health_record(self, request: ABDMRecordPushRequest) -> ABDMRecordPushResponse:
        pass


class MockABDMSandboxAdapter(BaseABDMService):
    """
    ABDM (Ayushman Bharat Digital Mission) sandbox adapter.
    Implements Milestone 1, 2, and 3 workflows with realistic ABDM gateway signatures.
    Clearly badges responses as is_mock=True, gateway_mode="SANDBOX".
    """

    async def link_care_context(self, request: ABDMCareContextLinkRequest) -> ABDMCareContextLinkResponse:
        now = datetime.now(timezone.utc).isoformat()
        tx_id = f"abdm-tx-{uuid.uuid4().hex[:12]}"
        care_ref = f"CC-OPD-{request.encounter_id[:8]}"

        return ABDMCareContextLinkResponse(
            status="LINKED",
            transaction_id=tx_id,
            abha_address=request.abha_address,
            care_context_reference=care_ref,
            is_mock=True,
            gateway_mode="SANDBOX",
            timestamp=now,
        )

    async def push_health_record(self, request: ABDMRecordPushRequest) -> ABDMRecordPushResponse:
        now = datetime.now(timezone.utc).isoformat()
        bundle = await fhir_service.generate_encounter_bundle(request.encounter_id)
        tx_id = f"abdm-fhir-{uuid.uuid4().hex[:12]}"
        consent_id = f"consent-{uuid.uuid4().hex[:8]}"

        return ABDMRecordPushResponse(
            status="SUCCESS",
            consent_id=consent_id,
            transaction_id=tx_id,
            bundle_id=bundle.id,
            hip_id="MEDIKIOSK_OPD_01",
            is_mock=True,
            gateway_mode="SANDBOX",
            timestamp=now,
        )


def get_abdm_service() -> BaseABDMService:
    # Future live ABDM adapter if client ID/secret are active
    return MockABDMSandboxAdapter()


abdm_service = get_abdm_service()
