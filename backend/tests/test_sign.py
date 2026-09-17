import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_isl_controlled_medical_recognition():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Get Controlled ISL Vocabulary
        vocab_res = await client.get("/api/v1/sign/vocabulary")
        assert vocab_res.status_code == 200
        vocab = vocab_res.json()
        assert len(vocab) >= 4
        fever_item = next(v for v in vocab if v["sign_code"] == "FEVER")
        assert fever_item["islrtc_ref_id"] == "ISLRTC-MED-0104"
        assert fever_item["english_meaning"] == "Fever"

        # 2. Recognize Supported Medical Sign: Stomach Ache (Deaf Patient Scenario)
        rec_res = await client.post(
            "/api/v1/sign/recognize",
            json={
                "encounter_id": "enc-test-sign-01",
                "question_id": "CC_PRIMARY",
                "simulated_sign": "PAIN_STOMACH",
            },
        )
        assert rec_res.status_code == 200
        data = rec_res.json()
        assert data["recognized_sign"] == "PAIN_STOMACH"
        assert data["islrtc_ref_id"] == "ISLRTC-MED-0341"
        assert data["mapped_answer_value"] == "Abdominal"
        assert data["is_supported"] is True
        assert data["confidence"] >= 0.90

        # 3. Test Unsupported Sign Handling with Touch Route Fallback
        unsupp_res = await client.post(
            "/api/v1/sign/recognize",
            json={
                "encounter_id": "enc-test-sign-01",
                "question_id": "CC_PRIMARY",
                "simulated_sign": "COMPLEX_UNSUPPORTED_SIGN",
            },
        )
        assert unsupp_res.status_code == 200
        unsupp_data = unsupp_res.json()
        assert unsupp_data["is_supported"] is False
        assert "Unsupported sign" in unsupp_data["clinical_meaning"]
