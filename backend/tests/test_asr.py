import io
import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_multilingual_asr_transcription():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Mock audio bytes
        mock_audio = b"RIFF....WAVEfmt ....data...."

        # 1. Test Hindi transcription
        files_hi = {"file": ("audio_hi.wav", io.BytesIO(mock_audio), "audio/wav")}
        res_hi = await client.post("/api/v1/asr/transcribe", files=files_hi, data={"language": "hi"})
        assert res_hi.status_code == 200
        data_hi = res_hi.json()
        assert "बुखार" in data_hi["transcription"]
        assert data_hi["language"] == "hi"
        assert data_hi["confidence"] >= 0.90

        # 2. Test Marathi transcription
        files_mr = {"file": ("audio_mr.wav", io.BytesIO(mock_audio), "audio/wav")}
        res_mr = await client.post("/api/v1/asr/transcribe", files=files_mr, data={"language": "mr"})
        assert res_mr.status_code == 200
        data_mr = res_mr.json()
        assert "ताप" in data_mr["transcription"]
        assert data_mr["language"] == "mr"

        # 3. Test English transcription
        files_en = {"file": ("audio_en.wav", io.BytesIO(mock_audio), "audio/wav")}
        res_en = await client.post("/api/v1/asr/transcribe", files=files_en, data={"language": "en"})
        assert res_en.status_code == 200
        data_en = res_en.json()
        assert "fever" in data_en["transcription"].lower()
        assert data_en["language"] == "en"
