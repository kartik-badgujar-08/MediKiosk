from fastapi import APIRouter, HTTPException, status
from app.schemas.integrations import (
    ABDMCareContextLinkRequest,
    ABDMCareContextLinkResponse,
    ABDMRecordPushRequest,
    ABDMRecordPushResponse,
)
from app.services.abdm.abdm_service import abdm_service

router = APIRouter()


@router.post("/link-care-context", response_model=ABDMCareContextLinkResponse)
async def link_care_context(request: ABDMCareContextLinkRequest):
    return await abdm_service.link_care_context(request)


@router.post("/push-health-record", response_model=ABDMRecordPushResponse)
async def push_health_record(request: ABDMRecordPushRequest):
    return await abdm_service.push_health_record(request)
