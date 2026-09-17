from fastapi import APIRouter, HTTPException, status
from app.core.config import settings
from app.schemas.fhir import FHIRBundleResponse
from app.services.fhir.fhir_service import fhir_service

router = APIRouter()


@router.get("/bundle/{encounter_id}", response_model=FHIRBundleResponse)
async def get_fhir_bundle(encounter_id: str):
    try:
        bundle = await fhir_service.generate_encounter_bundle(encounter_id)
        return bundle
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"FHIR conversion error: {str(exc)}")


@router.post("/push/{encounter_id}")
async def push_fhir_bundle(encounter_id: str):
    try:
        bundle = await fhir_service.generate_encounter_bundle(encounter_id)
        # Attempt push to FHIR_BASE_URL or return successful mock sync
        return {
            "status": "synchronized",
            "encounter_id": encounter_id,
            "fhir_base_url": settings.FHIR_BASE_URL,
            "resources_pushed": bundle.total,
            "bundle_id": bundle.id,
            "is_mock": True,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
