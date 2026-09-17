import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.core.config import settings
from app.repositories.encounter_repo import encounter_repo
from app.repositories.patient_repo import patient_repo
from app.schemas.clinical_state import CanonicalClinicalState
from app.schemas.fhir import FHIRBundleEntry, FHIRBundleResponse
from app.services.clinical.state_service import clinical_state_service


class FHIRService:
    """
    FHIR R4 interoperability layer mapping verified Canonical Clinical State
    into standard HL7 FHIR R4 resources.
    """

    def create_patient_resource(self, patient: dict) -> Dict[str, Any]:
        p_id = patient.get("id", str(uuid.uuid4()))
        name_parts = patient.get("name", "Unknown Patient").split(" ")
        family = name_parts[-1] if len(name_parts) > 1 else ""
        given = name_parts[:-1] if len(name_parts) > 1 else [name_parts[0]]

        identifiers = []
        if patient.get("uhid"):
            identifiers.append({
                "system": "https://healthid.ndhm.gov.in/uhid",
                "value": patient["uhid"],
                "type": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v2-0203", "code": "MR"}]}
            })
        if patient.get("abha_id"):
            identifiers.append({
                "system": "https://healthid.ndhm.gov.in/abha",
                "value": patient["abha_id"],
                "type": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v2-0203", "code": "MB"}]}
            })

        return {
            "resourceType": "Patient",
            "id": f"patient-{p_id}",
            "identifier": identifiers,
            "active": True,
            "name": [{"use": "official", "family": family, "given": given}],
            "gender": patient.get("gender", "unknown").lower(),
            "telecom": [{"system": "phone", "value": patient.get("phone", "")}] if patient.get("phone") else [],
        }

    def create_encounter_resource(self, encounter: dict, patient_ref: str) -> Dict[str, Any]:
        enc_id = encounter.get("id", str(uuid.uuid4()))
        return {
            "resourceType": "Encounter",
            "id": f"encounter-{enc_id}",
            "status": "finished" if encounter.get("status") == "VERIFIED" else "in-progress",
            "class": {
                "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                "code": "AMB",
                "display": "ambulatory",
            },
            "subject": {"reference": patient_ref},
            "period": {
                "start": encounter.get("created_at", datetime.now(timezone.utc).isoformat()),
                "end": encounter.get("updated_at", datetime.now(timezone.utc).isoformat()),
            },
        }

    def create_condition_resource(
        self, fact_name: str, fact_val: str, patient_ref: str, enc_ref: str
    ) -> Dict[str, Any]:
        cond_id = str(uuid.uuid4())
        return {
            "resourceType": "Condition",
            "id": f"condition-{cond_id}",
            "clinicalStatus": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                        "code": "active",
                    }
                ]
            },
            "verificationStatus": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
                        "code": "confirmed",
                    }
                ]
            },
            "category": [
                {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/condition-category",
                            "code": "encounter-diagnosis",
                            "display": "Encounter Diagnosis",
                        }
                    ]
                }
            ],
            "code": {"text": f"{fact_name}: {fact_val}"},
            "subject": {"reference": patient_ref},
            "encounter": {"reference": enc_ref},
        }

    def create_observation_resource(
        self, fact: Any, patient_ref: str, enc_ref: str
    ) -> Dict[str, Any]:
        obs_id = str(uuid.uuid4())
        return {
            "resourceType": "Observation",
            "id": f"observation-{obs_id}",
            "status": "final",
            "category": [
                {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                            "code": "exam",
                            "display": "Exam",
                        }
                    ]
                }
            ],
            "code": {"text": fact.name},
            "subject": {"reference": patient_ref},
            "encounter": {"reference": enc_ref},
            "valueString": str(fact.value),
        }

    def create_medication_request_resource(
        self, med_fact: Any, patient_ref: str, enc_ref: str
    ) -> Dict[str, Any]:
        req_id = str(uuid.uuid4())
        return {
            "resourceType": "MedicationRequest",
            "id": f"medreq-{req_id}",
            "status": "active",
            "intent": "order",
            "medicationCodeableConcept": {"text": med_fact.name},
            "subject": {"reference": patient_ref},
            "encounter": {"reference": enc_ref},
            "dosageInstruction": [{"text": str(med_fact.value)}],
        }

    def create_allergy_resource(
        self, allergy_fact: Any, patient_ref: str
    ) -> Dict[str, Any]:
        all_id = str(uuid.uuid4())
        return {
            "resourceType": "AllergyIntolerance",
            "id": f"allergy-{all_id}",
            "clinicalStatus": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
                        "code": "active",
                    }
                ]
            },
            "verificationStatus": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
                        "code": "confirmed",
                    }
                ]
            },
            "code": {"text": allergy_fact.name},
            "patient": {"reference": patient_ref},
        }

    def create_provenance_resource(
        self, target_refs: List[str], verifying_doc: Optional[str] = None
    ) -> Dict[str, Any]:
        prov_id = str(uuid.uuid4())
        return {
            "resourceType": "Provenance",
            "id": f"provenance-{prov_id}",
            "target": [{"reference": ref} for ref in target_refs],
            "recorded": datetime.now(timezone.utc).isoformat(),
            "activity": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/v3-DocumentCompletion",
                        "code": "LA",
                        "display": "legally authenticated",
                    }
                ]
            },
            "agent": [
                {
                    "type": {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
                                "code": "verifier",
                            }
                        ]
                    },
                    "who": {"display": verifying_doc or "Attending Clinician"},
                }
            ],
        }

    async def generate_encounter_bundle(self, encounter_id: str) -> FHIRBundleResponse:
        encounter = await encounter_repo.get_by_id(encounter_id)
        if not encounter:
            raise ValueError(f"Encounter '{encounter_id}' not found")

        patient = await patient_repo.get_by_id(encounter["patient_id"]) or {
            "id": encounter["patient_id"],
            "name": "Patient",
        }
        state = await clinical_state_service.get_or_create_state(encounter_id)

        entries: List[FHIRBundleEntry] = []
        target_refs: List[str] = []

        # 1. Patient Resource
        p_res = self.create_patient_resource(patient)
        p_ref = f"Patient/{p_res['id']}"
        entries.append(FHIRBundleEntry(fullUrl=f"urn:uuid:{p_res['id']}", resource=p_res))

        # 2. Encounter Resource
        enc_res = self.create_encounter_resource(encounter, p_ref)
        enc_ref = f"Encounter/{enc_res['id']}"
        entries.append(FHIRBundleEntry(fullUrl=f"urn:uuid:{enc_res['id']}", resource=enc_res))
        target_refs.append(enc_ref)

        # 3. Chief Complaint (Condition)
        if state.chief_complaint:
            c_res = self.create_condition_resource(
                state.chief_complaint.name, str(state.chief_complaint.value), p_ref, enc_ref
            )
            entries.append(FHIRBundleEntry(fullUrl=f"urn:uuid:{c_res['id']}", resource=c_res))
            target_refs.append(f"Condition/{c_res['id']}")

        # 4. Medications (MedicationRequest)
        for med in state.medications:
            m_res = self.create_medication_request_resource(med, p_ref, enc_ref)
            entries.append(FHIRBundleEntry(fullUrl=f"urn:uuid:{m_res['id']}", resource=m_res))
            target_refs.append(f"MedicationRequest/{m_res['id']}")

        # 5. Allergies (AllergyIntolerance)
        for alg in state.allergies:
            a_res = self.create_allergy_resource(alg, p_ref)
            entries.append(FHIRBundleEntry(fullUrl=f"urn:uuid:{a_res['id']}", resource=a_res))
            target_refs.append(f"AllergyIntolerance/{a_res['id']}")

        # 6. Observations (Associated Symptoms & HPI)
        for symp in state.associated_symptoms:
            o_res = self.create_observation_resource(symp, p_ref, enc_ref)
            entries.append(FHIRBundleEntry(fullUrl=f"urn:uuid:{o_res['id']}", resource=o_res))
            target_refs.append(f"Observation/{o_res['id']}")

        # 7. Provenance Resource
        prov_res = self.create_provenance_resource(target_refs, verifying_doc="Dr. MediKiosk Intake Verifier")
        entries.append(FHIRBundleEntry(fullUrl=f"urn:uuid:{prov_res['id']}", resource=prov_res))

        now = datetime.now(timezone.utc).isoformat()
        return FHIRBundleResponse(
            id=f"bundle-{encounter_id}",
            timestamp=now,
            total=len(entries),
            entry=entries,
        )


fhir_service = FHIRService()
