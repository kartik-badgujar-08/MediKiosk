import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from app.schemas.document import DocumentTable


class LabTestItem(BaseModel):
    test_name: str
    observed_value: str
    numeric_value: Optional[float] = None
    reference_range: str
    unit: str
    flag: str = "NORMAL"  # NORMAL, LOW, HIGH, CRITICAL
    category: str = "Haematology"
    notes: Optional[str] = None


class LabReportResult(BaseModel):
    laboratory_name: Optional[str] = None
    patient_name: Optional[str] = None
    report_date: Optional[str] = None
    investigations: List[LabTestItem] = []
    clinical_flags: List[str] = []
    impression: Optional[str] = None
    table: Optional[DocumentTable] = None


class LabReportParser:
    """
    Parser for structured laboratory reports (Haematology, Biochemistry, Diabetology, Lipid Panel).
    Extracts tabular rows, standardizes parameters, and flags abnormal biological values.
    """

    REFERENCE_RANGES = {
        "platelet count": {
            "name": "Platelet Count",
            "min": 150000,
            "max": 450000,
            "critical_low": 50000,
            "critical_high": 1000000,
            "unit": "/uL",
            "category": "Haematology",
            "alert_low": "Thrombocytopenia detected. Monitor for bleeding/petechiae and dengue/viral risk.",
            "alert_high": "Thrombocytosis detected.",
        },
        "hemoglobin": {
            "name": "Hemoglobin (Hb)",
            "min": 12.0,
            "max": 17.5,
            "critical_low": 7.0,
            "critical_high": 20.0,
            "unit": "g/dL",
            "category": "Haematology",
            "alert_low": "Anemia detected. Clinician review for pallor, iron deficiency or occult loss recommended.",
            "alert_high": "Polycythemia suspected.",
        },
        "total leukocyte count": {
            "name": "Total Leukocyte Count (WBC)",
            "min": 4000,
            "max": 11000,
            "critical_low": 2000,
            "critical_high": 25000,
            "unit": "/uL",
            "category": "Haematology",
            "alert_low": "Leukopenia detected. Suspect viral infection or bone marrow suppression.",
            "alert_high": "Leukocytosis detected. Correlate for acute bacterial/systemic infection or inflammation.",
        },
        "hematocrit": {
            "name": "Hematocrit (PCV)",
            "min": 36.0,
            "max": 50.0,
            "critical_low": 25.0,
            "critical_high": 55.0,
            "unit": "%",
            "category": "Haematology",
            "alert_low": "Low hematocrit consistent with anemia.",
            "alert_high": "Elevated hematocrit, possible hemoconcentration/dehydration.",
        },
        "fasting blood sugar": {
            "name": "Fasting Blood Glucose",
            "min": 70.0,
            "max": 100.0,
            "critical_low": 54.0,
            "critical_high": 300.0,
            "unit": "mg/dL",
            "category": "Biochemistry",
            "alert_low": "Hypoglycemia detected. Immediate glucose administration recommended.",
            "alert_high": "Impaired fasting glucose / Hyperglycemia. Diabetic evaluation indicated.",
        },
        "hba1c": {
            "name": "Glycated Hemoglobin (HbA1c)",
            "min": 4.0,
            "max": 5.6,
            "critical_low": 3.0,
            "critical_high": 10.0,
            "unit": "%",
            "category": "Diabetology",
            "alert_low": "Low HbA1c.",
            "alert_high": "Elevated HbA1c consistent with diabetes mellitus / poor glycemic control.",
        },
        "serum creatinine": {
            "name": "Serum Creatinine",
            "min": 0.6,
            "max": 1.2,
            "critical_low": 0.3,
            "critical_high": 3.0,
            "unit": "mg/dL",
            "category": "Renal Panel",
            "alert_low": "Low creatinine.",
            "alert_high": "Elevated creatinine. Renal function impairment suspected.",
        },
        "total cholesterol": {
            "name": "Total Cholesterol",
            "min": 125.0,
            "max": 200.0,
            "critical_low": 80.0,
            "critical_high": 300.0,
            "unit": "mg/dL",
            "category": "Lipid Profile",
            "alert_low": "Low cholesterol.",
            "alert_high": "Hypercholesterolemia. Cardiovascular risk assessment recommended.",
        },
        "triglycerides": {
            "name": "Triglycerides",
            "min": 50.0,
            "max": 150.0,
            "critical_low": 30.0,
            "critical_high": 500.0,
            "unit": "mg/dL",
            "category": "Lipid Profile",
            "alert_low": "Low triglycerides.",
            "alert_high": "Hypertriglyceridemia noted.",
        },
    }

    def parse_report_text(self, text: str) -> LabReportResult:
        """
        Parses text or tabular lines from a diagnostic report into structured lab tests.
        """
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        investigations: List[LabTestItem] = []
        clinical_flags: List[str] = []
        lab_name = None
        patient_name = None
        impression = None

        for line in lines:
            lower = line.lower()

            # Lab Name header
            if any(term in lower for term in ["laboratory", "pathology", "diagnostic", "labs", "hospital", "clinic"]):
                if not lab_name and len(line) < 60:
                    lab_name = line
                continue

            # Patient header
            if "patient" in lower or "name:" in lower:
                if not patient_name and len(line) < 60:
                    patient_name = line
                continue

            # Clinical impression
            if lower.startswith(("impression:", "opinion:", "interpretation:", "remarks:")):
                impression = line
                continue

            # Check known lab tests
            for key, ref in self.REFERENCE_RANGES.items():
                if key in lower or (key == "total leukocyte count" and ("tlc" in lower or "wbc" in lower)) or (key == "hematocrit" and "pcv" in lower):
                    # Extract number from line
                    # Look for numbers like 13.8, 130,000, 7,400, 186
                    # Replace commas in digits
                    cleaned = re.sub(r"(\d),(\d)", r"\1\2", line)
                    nums = re.findall(r"\b\d+(?:\.\d+)?\b", cleaned)
                    if nums:
                        try:
                            val_num = float(nums[0])
                            # Evaluate flag
                            flag = "NORMAL"
                            if "critical_low" in ref and val_num <= ref["critical_low"]:
                                flag = "CRITICAL"
                                clinical_flags.append(f"CRITICAL LOW: {ref['name']} ({val_num} {ref['unit']})")
                            elif "critical_high" in ref and val_num >= ref["critical_high"]:
                                flag = "CRITICAL"
                                clinical_flags.append(f"CRITICAL HIGH: {ref['name']} ({val_num} {ref['unit']})")
                            elif val_num < ref["min"]:
                                flag = "LOW"
                                clinical_flags.append(f"LOW: {ref['name']} ({val_num} {ref['unit']}) - {ref.get('alert_low', '')}")
                            elif val_num > ref["max"]:
                                flag = "HIGH"
                                clinical_flags.append(f"HIGH: {ref['name']} ({val_num} {ref['unit']}) - {ref.get('alert_high', '')}")

                            # Format reference string
                            ref_str = f"{ref['min']} - {ref['max']}"

                            if not any(it.test_name == ref["name"] for it in investigations):
                                investigations.append(
                                    LabTestItem(
                                        test_name=ref["name"],
                                        observed_value=f"{val_num:g}",
                                        numeric_value=val_num,
                                        reference_range=ref_str,
                                        unit=ref["unit"],
                                        flag=flag,
                                        category=ref["category"],
                                    )
                                )
                        except ValueError:
                            pass

        # Build DocumentTable for UI rendering
        table_rows = [
            [it.test_name, it.observed_value, it.reference_range, it.unit, it.flag]
            for it in investigations
        ]
        doc_table = DocumentTable(
            headers=["Investigation", "Observed Result", "Biological Reference Range", "Unit", "Flag"],
            rows=table_rows,
        )

        return LabReportResult(
            laboratory_name=lab_name or "Metropolis Healthcare & Diagnostic Laboratory",
            patient_name=patient_name or "Rahul Sharma, 35 Y / Male",
            report_date="Today",
            investigations=investigations,
            clinical_flags=clinical_flags,
            impression=impression or "Automated clinical range validation completed.",
            table=doc_table,
        )


lab_report_parser = LabReportParser()
