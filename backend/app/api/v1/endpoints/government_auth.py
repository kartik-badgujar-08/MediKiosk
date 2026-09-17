"""
Government of India Digital Health Authentication Endpoints (ABHA / ABDM & HPR / NMC).
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Header
from app.core.security import decode_access_token
from app.schemas.auth_government import (
    ABHAInitRequest,
    ABHAInitResponse,
    ABHAVerifyOTPRequest,
    ABHAProfileResponse,
    ABHAQRScanRequest,
    HPRInitRequest,
    HPRInitResponse,
    HPRVerifyOTPRequest,
    HPRProfileResponse,
    MedicalCouncilItem,
)
from app.services.abdm.abha_auth_service import abha_auth_service
from app.services.abdm.hpr_auth_service import hpr_auth_service

router = APIRouter()


async def get_current_gov_session(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Extracts and verifies JWT token for either patient or doctor.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token required. Please login with ABHA or HPR.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token. Please re-authenticate.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


# -------------------------------------------------------------
# Patient ABHA / ABDM Endpoints
# -------------------------------------------------------------

@router.post("/patient/abha/init", response_model=ABHAInitResponse)
async def init_abha_authentication(request: ABHAInitRequest):
    """
    Initiate ABDM M1 Patient authentication via OTP dispatch.
    Accepts 14-digit ABHA Number, ABHA Address (e.g. rahul.sharma@abdm), or Mobile Number.
    """
    return await abha_auth_service.init_auth(request)


@router.post("/patient/abha/verify-otp", response_model=ABHAProfileResponse)
async def verify_abha_otp(request: ABHAVerifyOTPRequest):
    """
    Verify citizen OTP against ABDM M1 specification and issue official ABHA digital profile + JWT token.
    (Sandbox test OTP: 123456)
    """
    return await abha_auth_service.verify_otp(request)


@router.post("/patient/abha/qr-scan", response_model=ABHAProfileResponse)
async def scan_abha_qr(request: ABHAQRScanRequest):
    """
    Instant identification via official ABDM Scan & Share QR code payload.
    """
    return await abha_auth_service.parse_qr_code(request)


# -------------------------------------------------------------
# Doctor HPR / NMC Registry Endpoints
# -------------------------------------------------------------

@router.post("/doctor/hpr/init", response_model=HPRInitResponse)
async def init_hpr_doctor_authentication(request: HPRInitRequest):
    """
    Lookup doctor credentials in Healthcare Professionals Registry (HPR) or State Medical Council (SMC).
    Dispatches verification challenge.
    """
    return await hpr_auth_service.init_auth(request)


@router.post("/doctor/hpr/verify-otp", response_model=HPRProfileResponse)
async def verify_hpr_doctor_otp(request: HPRVerifyOTPRequest):
    """
    Verify doctor OTP and issue NMC practitioner credential profile + JWT token.
    (Sandbox test OTP: 123456)
    """
    return await hpr_auth_service.verify_otp(request)


@router.get("/councils", response_model=List[MedicalCouncilItem])
async def get_official_medical_councils():
    """
    Returns list of official State Medical Councils operating under National Medical Commission (NMC).
    """
    return hpr_auth_service.get_councils()


# -------------------------------------------------------------
# Session & Profile Introspection
# -------------------------------------------------------------

@router.get("/me")
async def get_authenticated_government_profile(
    session: Dict[str, Any] = Depends(get_current_gov_session)
):
    """
    Introspects current authenticated session, returning role and official verified claims.
    """
    return {
        "status": "ACTIVE_SESSION",
        "user_id": session.get("sub"),
        "role": session.get("role"),
        "claims": session,
        "gateway_mode": "SANDBOX",
        "verified_gov_source": session.get("gov_id_source", "ABDM_NHA"),
    }


@router.post("/logout")
async def logout_government_session():
    """
    Terminates active session.
    """
    return {"status": "LOGGED_OUT", "message": "Government session successfully cleared"}
