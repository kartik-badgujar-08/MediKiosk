from fastapi import APIRouter, HTTPException, status
from app.schemas.integrations import HISSyncRequest, HISSyncResponse
from app.services.his.his_service import his_service

router = APIRouter()


@router.post("/sync", response_model=HISSyncResponse)
async def sync_with_his(request: HISSyncRequest):
    return await his_service.sync_encounter(request)
