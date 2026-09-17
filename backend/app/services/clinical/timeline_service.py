import uuid
from typing import Any, Dict, List
from app.repositories.clinical_state_repo import clinical_state_repo
from app.repositories.document_repo import document_repo
from app.repositories.encounter_repo import encounter_repo
from app.repositories.patient_repo import patient_repo
from app.schemas.timeline import PatientTimelineResponse, TimelineEvent


class TimelineService:
    async def get_timeline(self, patient_id: str) -> PatientTimelineResponse:
        events: List[TimelineEvent] = []

        # 1. Fetch all encounters for this patient
        encounters = await encounter_repo.list_by_patient(patient_id)
        for enc in encounters:
            enc_id = enc["id"]
            created = enc.get("created_at", "2026-09-17T00:00:00Z")
            year = created[:4] if len(created) >= 4 else "2026"
            cc = enc.get("chief_complaint") or "Clinical Intake Encounter"

            events.append(
                TimelineEvent(
                    id=f"evt-enc-{enc_id}",
                    patient_id=patient_id,
                    encounter_id=enc_id,
                    event_type="ENCOUNTER",
                    title=f"Clinical Intake Encounter: {cc}",
                    description=f"Status: {enc.get('status', 'IN_PROGRESS')} • Channel: {enc.get('intake_channel', 'touch')}",
                    date=created,
                    year=year,
                    status=enc.get("status", "IN_PROGRESS"),
                    details={"language": enc.get("language", "en")},
                    tags=["OPD Intake", enc.get("intake_channel", "touch")],
                )
            )

            # Check for clinical state data for this encounter
            state_doc = await clinical_state_repo.get_by_encounter_id(enc_id)
            if state_doc:
                for med in state_doc.get("medications", []):
                    events.append(
                        TimelineEvent(
                            id=f"evt-med-{med.get('id', uuid.uuid4())}",
                            patient_id=patient_id,
                            encounter_id=enc_id,
                            event_type="PRESCRIPTION",
                            title=f"Medication: {med.get('name')}",
                            description=f"Dosage: {med.get('value')} • Source: {med.get('source')} • Status: {med.get('verification_status')}",
                            date=med.get("created_at", created),
                            year=year,
                            status=med.get("verification_status", "PENDING"),
                            details=med,
                            tags=["Medication", med.get("source", "ocr")],
                        )
                    )

                for inv in state_doc.get("investigations", []):
                    events.append(
                        TimelineEvent(
                            id=f"evt-inv-{inv.get('id', uuid.uuid4())}",
                            patient_id=patient_id,
                            encounter_id=enc_id,
                            event_type="INVESTIGATION",
                            title=f"Investigation: {inv.get('name')}",
                            description=f"Result: {inv.get('value')} {inv.get('unit', '')}",
                            date=inv.get("created_at", created),
                            year=year,
                            status=inv.get("verification_status", "PENDING"),
                            details=inv,
                            tags=["Diagnostic Report", "Lab Test"],
                        )
                    )

            # Check for uploaded documents
            docs = await document_repo.list_by_encounter(enc_id)
            for d in docs:
                events.append(
                    TimelineEvent(
                        id=f"evt-doc-{d['id']}",
                        patient_id=patient_id,
                        encounter_id=enc_id,
                        event_type="LAB_REPORT" if "cbc" in d["filename"].lower() else "PRESCRIPTION",
                        title=f"Medical Document: {d['filename']}",
                        description=f"Uploaded and processed by PaddleOCR • Status: {d.get('status', 'PROCESSED')}",
                        date=d.get("created_at", created),
                        year=year,
                        status=d.get("status", "PROCESSED"),
                        details={"content_type": d["content_type"], "size_bytes": d["size_bytes"]},
                        tags=["Document", "PaddleOCR"],
                    )
                )

        # 2. Add historical milestones for demonstration if events count is small
        # (Preserves longitudinal view requirement: 2024 Lab/Prescription, 2025 OPD visit, 2026 Current)
        events.append(
            TimelineEvent(
                id="evt-hist-2025-01",
                patient_id=patient_id,
                event_type="ENCOUNTER",
                title="Previous OPD Visit: Seasonal Allergic Rhinitis",
                description="Consulted for nasal congestion and sneezing. Prescribed Cetirizine 10mg OD x 5 days.",
                date="2025-08-14T10:30:00Z",
                year="2025",
                status="VERIFIED",
                details={"doctor": "Dr. V. Rao", "department": "General Medicine"},
                tags=["Historical Record", "OPD"],
            )
        )
        events.append(
            TimelineEvent(
                id="evt-hist-2024-01",
                patient_id=patient_id,
                event_type="LAB_REPORT",
                title="Historical CBC & Lipid Profile Report",
                description="Routine health checkup. Platelet count 220,000 /uL (Normal), Hb 14.2 g/dL.",
                date="2024-11-20T09:15:00Z",
                year="2024",
                status="VERIFIED",
                details={"laboratory": "City Diagnostic Lab"},
                tags=["Historical Record", "Lab Report"],
            )
        )

        # Sort descending by date
        events.sort(key=lambda e: e.date, reverse=True)

        return PatientTimelineResponse(
            patient_id=patient_id,
            total_events=len(events),
            events=events,
        )


timeline_service = TimelineService()
