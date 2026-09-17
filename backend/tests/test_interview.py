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


@pytest.mark.asyncio
async def test_full_socrates_workflow_and_ai_analysis():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Test AI clinical complaint analysis
        ai_res = await client.post(
            "/api/v1/interview/ai-analyze",
            json={
                "text": "I have sudden severe burning pain in my chest that radiates to my left arm with cold sweating, rated 9/10",
                "language": "en",
            },
        )
        assert ai_res.status_code == 200
        data = ai_res.json()
        assert data["chief_complaint"] == "Pain"
        assert data["extracted_slots"]["site"] == "Chest"
        assert data["extracted_slots"]["character"] == "Burning"
        assert data["extracted_slots"]["radiation"] == "Left arm / jaw"
        assert "Cold sweating" in data["extracted_slots"]["associated"]
        assert data["extracted_slots"]["severity"] == 9
        assert len(data["detected_red_flags"]) >= 1

        # 2. Test Hindi speech parsing
        hi_res = await client.post(
            "/api/v1/interview/ai-analyze",
            json={
                "text": "छाती में बहुत तेज जलन हो रही है और सांस फूल रही है",
                "language": "hi",
            },
        )
        assert hi_res.status_code == 200
        hi_data = hi_res.json()
        assert hi_data["extracted_slots"]["site"] == "Chest"
        assert hi_data["extracted_slots"]["character"] == "Burning"
        assert "Shortness of breath" in hi_data["extracted_slots"]["associated"]

        # 3. Test Full 8-Letter SOCRATES Sequence
        enc_id = "test-socrates-encounter-001"
        start_res = await client.post(f"/api/v1/interview/start?encounter_id={enc_id}&language=en")
        assert start_res.status_code == 200

        # CC -> Pain
        res = await client.post(f"/api/v1/interview/{enc_id}/answer", json={"question_id": "CC_PRIMARY", "answer_value": "Pain"})
        assert res.json()["current_question"]["id"] == "SOCRATES_SITE"

        # S -> Chest
        res = await client.post(f"/api/v1/interview/{enc_id}/answer", json={"question_id": "SOCRATES_SITE", "answer_value": "Chest"})
        assert res.json()["current_question"]["id"] == "SOCRATES_ONSET"

        # O -> Sudden acute
        res = await client.post(f"/api/v1/interview/{enc_id}/answer", json={"question_id": "SOCRATES_ONSET", "answer_value": "Sudden acute"})
        assert res.json()["current_question"]["id"] == "SOCRATES_CHARACTER"

        # C -> Burning
        res = await client.post(f"/api/v1/interview/{enc_id}/answer", json={"question_id": "SOCRATES_CHARACTER", "answer_value": "Burning"})
        assert res.json()["current_question"]["id"] == "SOCRATES_RADIATION"

        # R -> Left arm / jaw
        res = await client.post(f"/api/v1/interview/{enc_id}/answer", json={"question_id": "SOCRATES_RADIATION", "answer_value": "Left arm / jaw"})
        assert res.json()["current_question"]["id"] == "SOCRATES_ASSOCIATED"

        # A -> Cold sweating
        res = await client.post(f"/api/v1/interview/{enc_id}/answer", json={"question_id": "SOCRATES_ASSOCIATED", "answer_value": ["Cold sweating"]})
        assert res.json()["current_question"]["id"] == "SOCRATES_TIMING"

        # T -> Continuous
        res = await client.post(f"/api/v1/interview/{enc_id}/answer", json={"question_id": "SOCRATES_TIMING", "answer_value": "Continuous"})
        assert res.json()["current_question"]["id"] == "SOCRATES_EXACERBATING"

        # E -> Worse with exertion
        res = await client.post(f"/api/v1/interview/{enc_id}/answer", json={"question_id": "SOCRATES_EXACERBATING", "answer_value": "Worse with exertion"})
        assert res.json()["current_question"]["id"] == "SOCRATES_SEVERITY"

        # S -> Severity 9
        res = await client.post(f"/api/v1/interview/{enc_id}/answer", json={"question_id": "SOCRATES_SEVERITY", "answer_value": 9})
        assert res.json()["current_question"]["id"] == "PMH_CONDITIONS"

        # Verify red flags captured
        assert len(res.json()["red_flags"]) >= 2

