"""
Official Government of India Digital Health Authentication Schemas
Complies with ABDM (Ayushman Bharat Digital Mission) M1 and HPR (Healthcare Professionals Registry) specs.
"""
from typing import Optional, List
from pydantic import BaseModel, Field


# ==========================================
# Patient ABHA (Ayushman Bharat Health Account) Schemas
# ==========================================

class ABHAInitRequest(BaseModel):
    """
    Request to initiate ABHA authentication via OTP.
    Accepts 14-digit ABHA Number (with or without hyphens), ABHA Address, or registered Mobile.
    """
    abha_id: str = Field(
        ..., 
        description="14-digit ABHA Number (e.g. 91-4820-1928-3819), ABHA Address (e.g. rahul@abdm), or Mobile",
        min_length=10
    )
    auth_mode: str = Field(
        default="MOBILE_OTP", 
        description="Authentication mode: MOBILE_OTP or AADHAAR_OTP"
    )


class ABHAInitResponse(BaseModel):
    """
    Response acknowledging OTP dispatch through ABDM Gateway.
    """
    status: str = "OTP_DISPATCHED"
    txn_id: str = Field(..., description="Unique ABDM Gateway Transaction ID")
    auth_mode: str
    masked_recipient: str = Field(..., description="Masked destination, e.g. 'XXXX-XXXX-3819'")
    gateway_mode: str = "SANDBOX"
    message: str = "OTP successfully dispatched to registered mobile number"


class ABHAVerifyOTPRequest(BaseModel):
    """
    Verification of the 6-digit OTP returned by the citizen.
    """
    txn_id: str = Field(..., description="ABDM Transaction ID from init step")
    otp: str = Field(..., description="6-digit OTP", min_length=4, max_length=6)


class ABHAProfile(BaseModel):
    """
    Official KYC Patient Profile issued by ABDM.
    """
    abha_number: str = Field(..., description="14-digit ABHA Number (XX-XXXX-XXXX-XXXX)")
    abha_address: str = Field(..., description="ABHA Address / PHR Handle (e.g. rahul.sharma@abdm)")
    name: str = Field(..., description="Full Name of the citizen")
    gender: str = Field(..., description="M, F, or O")
    date_of_birth: str = Field(..., description="YYYY-MM-DD or YYYY")
    age: int
    mobile: str
    address: Optional[str] = None
    district_name: Optional[str] = "Central Delhi"
    state_name: Optional[str] = "Delhi"
    pincode: Optional[str] = "110001"
    kyc_verified: bool = True
    photo_url: Optional[str] = None


class ABHAProfileResponse(BaseModel):
    status: str = "AUTHENTICATED"
    access_token: str
    token_type: str = "bearer"
    role: str = "patient"
    profile: ABHAProfile
    gateway_mode: str = "SANDBOX"


class ABHAQRScanRequest(BaseModel):
    """
    Official ABDM Scan & Share QR code payload format.
    """
    qr_payload: str = Field(..., description="Raw text or JSON scanned from citizen's ABHA Card QR")


# ==========================================
# Doctor / Healthcare Professional (HPR / NMC) Schemas
# ==========================================

class HPRInitRequest(BaseModel):
    """
    Doctor identification request via HPR ID or State Medical Council Registration.
    """
    hpr_id: Optional[str] = Field(None, description="HPR ID (e.g. dr.anita.desai@hpr or 14-digit HPR number)")
    registration_number: Optional[str] = Field(None, description="State Medical Council Registration No (e.g. MMC-2018-09281)")
    state_medical_council: Optional[str] = Field(None, description="Official State Medical Council Name")


class HPRInitResponse(BaseModel):
    status: str = "DOCTOR_FOUND_OTP_DISPATCHED"
    txn_id: str
    doctor_name: str
    council: str
    registration_number: str
    status_in_registry: str = "ACTIVE_VERIFIED"
    masked_mobile: str = "XXXX-XXXX-4912"
    gateway_mode: str = "SANDBOX"
    message: str = "OTP dispatched to practitioner's registered mobile"


class HPRVerifyOTPRequest(BaseModel):
    txn_id: str
    otp: str = Field(..., min_length=4, max_length=6)


class HPRDoctorProfile(BaseModel):
    """
    Official Healthcare Professionals Registry (HPR) Practitioner Profile.
    """
    hpr_id: str
    registration_number: str
    state_medical_council: str
    full_name: str
    degrees: str = "MBBS, MD"
    specialization: str = "General Medicine"
    registry_status: str = "ACTIVE_VERIFIED"
    hospital_affiliation: Optional[str] = "All India Institute of Medical Sciences (AIIMS)"
    nmc_verified: bool = True


class HPRProfileResponse(BaseModel):
    status: str = "AUTHENTICATED"
    access_token: str
    token_type: str = "bearer"
    role: str = "doctor"
    profile: HPRDoctorProfile
    gateway_mode: str = "SANDBOX"


class MedicalCouncilItem(BaseModel):
    code: str
    name: str
    state: str
