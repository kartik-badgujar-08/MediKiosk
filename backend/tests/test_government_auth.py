import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_abha_auth_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Step 1: Initiate ABHA auth for Rahul Sharma
        init_res = await client.post(
            "/api/v1/auth/gov/patient/abha/init",
            json={"abha_id": "91-4820-1928-3819", "auth_mode": "MOBILE_OTP"},
        )
        assert init_res.status_code == 200
        init_data = init_res.json()
        assert init_data["status"] == "OTP_DISPATCHED"
        assert "txn_id" in init_data
        txn_id = init_data["txn_id"]

        # Step 2: Verify with wrong OTP
        bad_res = await client.post(
            "/api/v1/auth/gov/patient/abha/verify-otp",
            json={"txn_id": txn_id, "otp": "000000"},
        )
        assert bad_res.status_code == 401

        # Step 3: Verify with valid test OTP 123456
        verify_res = await client.post(
            "/api/v1/auth/gov/patient/abha/verify-otp",
            json={"txn_id": txn_id, "otp": "123456"},
        )
        assert verify_res.status_code == 200
        profile_data = verify_res.json()
        assert profile_data["status"] == "AUTHENTICATED"
        assert profile_data["role"] == "patient"
        assert "access_token" in profile_data
        assert profile_data["profile"]["name"] == "Rahul Sharma"
        assert profile_data["profile"]["abha_number"] == "91-4820-1928-3819"

        # Step 4: Introspect session via /me
        token = profile_data["access_token"]
        me_res = await client.get(
            "/api/v1/auth/gov/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me_res.status_code == 200
        me_data = me_res.json()
        assert me_data["role"] == "patient"
        assert me_data["claims"]["patient_name"] == "Rahul Sharma"


@pytest.mark.asyncio
async def test_hpr_doctor_auth_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Step 1: Initiate Doctor HPR auth for Dr. Anita Desai
        init_res = await client.post(
            "/api/v1/auth/gov/doctor/hpr/init",
            json={"hpr_id": "dr.anita.desai@hpr"},
        )
        assert init_res.status_code == 200
        init_data = init_res.json()
        assert init_data["doctor_name"] == "Dr. Anita Desai"
        assert "txn_id" in init_data
        txn_id = init_data["txn_id"]

        # Step 2: Verify with valid OTP
        verify_res = await client.post(
            "/api/v1/auth/gov/doctor/hpr/verify-otp",
            json={"txn_id": txn_id, "otp": "123456"},
        )
        assert verify_res.status_code == 200
        doc_data = verify_res.json()
        assert doc_data["role"] == "doctor"
        assert doc_data["profile"]["full_name"] == "Dr. Anita Desai"
        assert doc_data["profile"]["nmc_verified"] is True
        assert doc_data["profile"]["registration_number"] == "MMC-2018-09281"

        # Step 3: Check /me endpoint
        token = doc_data["access_token"]
        me_res = await client.get(
            "/api/v1/auth/gov/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me_res.status_code == 200
        assert me_res.json()["role"] == "doctor"


@pytest.mark.asyncio
async def test_abha_qr_scan():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        qr_payload = '{"hid": "91-8841-2091-5821", "name": "Sunita Patil", "gender": "F", "dob": "1981-11-20"}'
        res = await client.post(
            "/api/v1/auth/gov/patient/abha/qr-scan",
            json={"qr_payload": qr_payload},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["profile"]["name"] == "Sunita Patil"
        assert data["profile"]["gender"] == "F"


@pytest.mark.asyncio
async def test_medical_councils_list():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/v1/auth/gov/councils")
        assert res.status_code == 200
        councils = res.json()
        assert len(councils) >= 5
        codes = [c["code"] for c in councils]
        assert "MMC" in codes
        assert "DMC" in codes
