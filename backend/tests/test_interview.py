import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_adaptive_fever_interview_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create patient & encounter
        p_res = await client.post(
            "/api/v1/patients/",
            json={"name": "Rahul Sharma", "age": 35, "gender": "Male", "preferred_language": "hi"},
        )
        patient_id = p_res.json()["id"]

        e_res = await client.post(
            "/api/v1/encounters/",
            json={"patient_id": patient_id, "intake_channel": "voice", "language": "hi"},
        )
        encounter_id = e_res.json()["id"]

        # 1. Start interview
        start_res = await client.post(f"/api/v1/interview/start?encounter_id={encounter_id}&language=hi")
        assert start_res.status_code == 200
        state = start_res.json()
        assert state["current_question"]["id"] == "CC_PRIMARY"
        assert state["is_completed"] is False

        # 2. Answer Chief Complaint: Fever
        ans1 = await client.post(
            f"/api/v1/interview/{encounter_id}/answer",
            json={"question_id": "CC_PRIMARY", "answer_value": "Fever", "input_channel": "voice"},
        )
        state1 = ans1.json()
        assert state1["current_question"]["id"] == "FEVER_DURATION"
        assert state1["current_section"] == "HPI"

        # 3. Answer Fever Duration: 3 days
        ans2 = await client.post(
            f"/api/v1/interview/{encounter_id}/answer",
            json={"question_id": "FEVER_DURATION", "answer_value": "3 days", "input_channel": "touch"},
        )
        assert ans2.json()["current_question"]["id"] == "FEVER_GRADE"

        # 4. Answer Fever Grade: High with chills
        ans3 = await client.post(
            f"/api/v1/interview/{encounter_id}/answer",
            json={"question_id": "FEVER_GRADE", "answer_value": "High with chills", "input_channel": "touch"},
        )
        assert ans3.json()["current_question"]["id"] == "FEVER_ASSOCIATED"

        # 5. Answer Associated: Headache, Body ache, Mosquito exposure
        ans4 = await client.post(
            f"/api/v1/interview/{encounter_id}/answer",
            json={
                "question_id": "FEVER_ASSOCIATED",
                "answer_value": ["Headache", "Body ache", "Mosquito exposure"],
                "input_channel": "voice",
            },
        )
        assert ans4.json()["current_question"]["id"] == "PMH_CONDITIONS"

        # 6. Answer PMH: None
        ans5 = await client.post(
            f"/api/v1/interview/{encounter_id}/answer",
            json={"question_id": "PMH_CONDITIONS", "answer_value": ["None"], "input_channel": "touch"},
        )
        assert ans5.json()["current_question"]["id"] == "MEDICATIONS_CURRENT"

        # 7. Answer Meds: Paracetamol
        ans6 = await client.post(
            f"/api/v1/interview/{encounter_id}/answer",
            json={"question_id": "MEDICATIONS_CURRENT", "answer_value": ["Paracetamol"], "input_channel": "touch"},
        )
        assert ans6.json()["current_question"]["id"] == "ALLERGIES_KNOWN"

        # 8. Answer Allergies: None
        ans7 = await client.post(
            f"/api/v1/interview/{encounter_id}/answer",
            json={"question_id": "ALLERGIES_KNOWN", "answer_value": "None", "input_channel": "touch"},
        )
        assert ans7.json()["current_question"]["id"] == "AYUSH_REMEDIES"

        # 9. Answer AYUSH: Herbal kadha
        ans8 = await client.post(
            f"/api/v1/interview/{encounter_id}/answer",
            json={"question_id": "AYUSH_REMEDIES", "answer_value": ["Herbal kadha"], "input_channel": "touch"},
        )
        final_state = ans8.json()
        assert final_state["is_completed"] is True
        assert final_state["current_question"] is None


@pytest.mark.asyncio
async def test_socrates_pain_and_red_flag_detection():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create patient & encounter
        p_res = await client.post(
            "/api/v1/patients/",
            json={"name": "Emergency Patient", "age": 58, "gender": "Male"},
        )
        patient_id = p_res.json()["id"]

        e_res = await client.post(
            "/api/v1/encounters/",
            json={"patient_id": patient_id, "intake_channel": "touch"},
        )
        encounter_id = e_res.json()["id"]

        await client.post(f"/api/v1/interview/start?encounter_id={encounter_id}")

        # CC = Pain
        await client.post(
            f"/api/v1/interview/{encounter_id}/answer",
            json={"question_id": "CC_PRIMARY", "answer_value": "Pain"},
        )

        # S = Chest
        await client.post(
            f"/api/v1/interview/{encounter_id}/answer",
            json={"question_id": "SOCRATES_SITE", "answer_value": "Chest"},
        )

        # O = Sudden acute
        await client.post(
            f"/api/v1/interview/{encounter_id}/answer",
            json={"question_id": "SOCRATES_ONSET", "answer_value": "Sudden acute"},
        )

        # C = Sharp stabbing
        await client.post(
            f"/api/v1/interview/{encounter_id}/answer",
            json={"question_id": "SOCRATES_CHARACTER", "answer_value": "Sharp stabbing"},
        )

        # R = Left arm / jaw (Red Flag Trigger 1)
        r_res = await client.post(
            f"/api/v1/interview/{encounter_id}/answer",
            json={"question_id": "SOCRATES_RADIATION", "answer_value": "Left arm / jaw"},
        )
        assert len(r_res.json()["red_flags"]) >= 1

        # A = Shortness of breath (Red Flag Trigger 2)
        a_res = await client.post(
            f"/api/v1/interview/{encounter_id}/answer",
            json={"question_id": "SOCRATES_ASSOCIATED", "answer_value": ["Shortness of breath"]},
        )
        red_flags = a_res.json()["red_flags"]
        assert any("chest discomfort with respiratory compromise" in rf.lower() for rf in red_flags)
