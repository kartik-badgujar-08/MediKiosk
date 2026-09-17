import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_auth_workflow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Register a doctor
        reg_response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "dr.sharma@example.com",
                "full_name": "Dr. Ramesh Sharma",
                "role": "doctor",
                "password": "SecurePassword123!",
            },
        )
        assert reg_response.status_code == 201
        user_data = reg_response.json()
        assert user_data["email"] == "dr.sharma@example.com"
        assert user_data["role"] == "doctor"
        assert "id" in user_data

        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "dr.sharma@example.com",
                "password": "SecurePassword123!",
            },
        )
        assert login_response.status_code == 200
        token_data = login_response.json()
        assert "access_token" in token_data
        assert token_data["token_type"] == "bearer"
        assert token_data["role"] == "doctor"

        # Check /me with Bearer token
        token = token_data["access_token"]
        me_response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me_response.status_code == 200
        assert me_response.json()["email"] == "dr.sharma@example.com"


@pytest.mark.asyncio
async def test_patient_and_encounter_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Register Patient (Rahul Sharma, 35)
        patient_res = await client.post(
            "/api/v1/patients/",
            json={
                "name": "Rahul Sharma",
                "age": 35,
                "gender": "Male",
                "phone": "+919876543210",
                "preferred_language": "hi",
            },
        )
        assert patient_res.status_code == 201
        patient = patient_res.json()
        patient_id = patient["id"]
        assert patient["name"] == "Rahul Sharma"
        assert patient["uhid"].startswith("UHID-")

        # 2. Get patient by ID
        get_p = await client.get(f"/api/v1/patients/{patient_id}")
        assert get_p.status_code == 200
        assert get_p.json()["id"] == patient_id

        # 3. Create Encounter for Rahul
        enc_res = await client.post(
            "/api/v1/encounters/",
            json={
                "patient_id": patient_id,
                "chief_complaint": "Fever for 3 days",
                "intake_channel": "voice",
                "language": "hi",
                "consent_given": True,
            },
        )
        assert enc_res.status_code == 201
        encounter = enc_res.json()
        enc_id = encounter["id"]
        assert encounter["status"] == "IN_PROGRESS"
        assert encounter["consent_given"] is True

        # 4. Update status to PENDING_REVIEW
        update_res = await client.patch(
            f"/api/v1/encounters/{enc_id}/status",
            json={"status": "PENDING_REVIEW"},
        )
        assert update_res.status_code == 200
        assert update_res.json()["status"] == "PENDING_REVIEW"

        # 5. List encounters for this patient
        list_res = await client.get(f"/api/v1/encounters/?patient_id={patient_id}")
        assert list_res.status_code == 200
        encounters = list_res.json()
        assert len(encounters) >= 1
        assert encounters[0]["id"] == enc_id
