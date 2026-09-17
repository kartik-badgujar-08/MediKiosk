from typing import List
from app.schemas.clinical_state import CanonicalClinicalState, RedFlagAlert


class RedFlagRuleEngine:
    """
    Deterministic rule-based clinical safety engine.
    Detects critical symptom complexes requiring immediate clinician attention.
    DOES NOT make autonomous diagnostic claims.
    """

    @staticmethod
    def evaluate(state: CanonicalClinicalState) -> List[RedFlagAlert]:
        alerts: List[RedFlagAlert] = []

        # 1. Evaluate Pain / Cardiac / Respiratory Safety Rules
        if state.pain_assessment:
            pain = state.pain_assessment
            site_val = pain.site.value.lower() if pain.site and pain.site.value else ""
            rad_val = pain.radiation.value.lower() if pain.radiation and pain.radiation.value else ""
            assoc_vals = [f.name.lower() for f in pain.associated_symptoms]

            # Rule: Chest pain with dyspnea or cold sweating
            if "chest" in site_val:
                if any(k in " ".join(assoc_vals) for k in ["shortness of breath", "breathlessness", "cold sweating", "diaphoresis"]):
                    alerts.append(
                        RedFlagAlert(
                            rule_id="RF-CARD-001",
                            severity="CRITICAL",
                            title="Acute Chest Discomfort with Respiratory Compromise",
                            description="Potential clinical red flag detected — requires immediate clinician review.",
                            clinical_rationale="Patient reports acute chest pain accompanied by dyspnea or profuse sweating. Requires urgent ECG, troponin triage, and clinician bedside evaluation.",
                            triggered_facts=["Pain Site: Chest", f"Associated: {', '.join(assoc_vals)}"],
                        )
                    )

                if "left arm" in rad_val or "jaw" in rad_val or "neck" in rad_val:
                    alerts.append(
                        RedFlagAlert(
                            rule_id="RF-CARD-002",
                            severity="HIGH",
                            title="Chest Discomfort Radiating to Arm/Jaw",
                            description="Potential clinical red flag detected — requires clinician review.",
                            clinical_rationale="Pain radiating to left arm or jaw is an established high-risk presentation requiring urgent clinical evaluation.",
                            triggered_facts=[f"Radiation: {pain.radiation.value}"],
                        )
                    )

            # Rule: High pain intensity
            if pain.severity and isinstance(pain.severity.value, (int, float)) and pain.severity.value >= 9:
                alerts.append(
                    RedFlagAlert(
                        rule_id="RF-PAIN-001",
                        severity="HIGH",
                        title="Severe Excruciating Pain Score (≥ 9/10)",
                        description="Potential clinical red flag detected — requires clinician review.",
                        clinical_rationale="Patient reported visual analog pain score of 9 or 10 indicating severe distress.",
                        triggered_facts=[f"Pain Severity: {pain.severity.value}/10"],
                    )
                )

        # 2. Evaluate Febrile Illness & Vector-borne / Sepsis Rules
        all_symptom_names = [s.name.lower() for s in state.associated_symptoms]
        cc_val = state.chief_complaint.value.lower() if state.chief_complaint and state.chief_complaint.value else ""

        is_fever_present = "fever" in cc_val or any("fever" in s for s in all_symptom_names)

        if is_fever_present:
            # Check bleeding signs
            has_bleeding = any(
                b in " ".join(all_symptom_names)
                for b in ["bleeding", "petechiae", "purpura", "epistaxis", "blood"]
            )
            if has_bleeding:
                alerts.append(
                    RedFlagAlert(
                        rule_id="RF-HEM-001",
                        severity="CRITICAL",
                        title="Febrile Syndrome with Bleeding Manifestations",
                        description="Potential clinical red flag detected — requires immediate clinician review.",
                        clinical_rationale="Fever accompanied by petechiae or mucosal bleeding requires immediate complete blood count (platelets, hematocrit) and hemodynamic monitoring.",
                        triggered_facts=["Chief Complaint: Fever", "Symptom: Bleeding / Petechiae"],
                    )
                )

            # Check altered sensorium / drowsiness
            has_neuro = any(
                n in " ".join(all_symptom_names)
                for n in ["altered sensorium", "confusion", "drowsiness", "lethargy", "unconscious"]
            )
            if has_neuro:
                alerts.append(
                    RedFlagAlert(
                        rule_id="RF-NEURO-001",
                        severity="CRITICAL",
                        title="Fever with Altered Consciousness or Severe Lethargy",
                        description="Potential clinical red flag detected — requires immediate clinician review.",
                        clinical_rationale="Fever with neurological compromise indicates possible central nervous system infection or severe systemic toxicity.",
                        triggered_facts=["Chief Complaint: Fever", "Symptom: Altered Sensorium"],
                    )
                )

            # Check headache + mosquito exposure
            has_headache = any("headache" in s for s in all_symptom_names)
            has_mosquito = any("mosquito" in s for s in all_symptom_names)
            if has_headache and has_mosquito:
                alerts.append(
                    RedFlagAlert(
                        rule_id="RF-VEC-001",
                        severity="MEDIUM",
                        title="Acute Febrile Illness with Vector Exposure",
                        description="Potential clinical consideration detected — requires clinician review.",
                        clinical_rationale="Fever with retro-orbital headache and local mosquito vector exposure warrants viral vector serology and platelet monitoring.",
                        triggered_facts=["Fever for 3 days", "Headache", "Mosquito exposure"],
                    )
                )

        return alerts
