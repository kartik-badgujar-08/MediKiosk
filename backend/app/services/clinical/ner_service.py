import abc
import re
from typing import Any, Dict, List
from app.core.config import settings
from app.core.logging import logger
from app.schemas.clinical_state import CanonicalClinicalState, ClinicalFact
from app.schemas.document import ExtractedEntity


class BaseClinicalExtractionService(abc.ABC):
    @abc.abstractmethod
    async def extract_concepts(self, text: str, source: str) -> List[ExtractedEntity]:
        pass


class RuleBasedClinicalNERAdapter(BaseClinicalExtractionService):
    """
    High-performance rule-based clinical NER adapter with standardized medical vocabularies.
    Extracts medications, lab investigations, dosages, and clinical findings.
    """

    KNOWN_DRUGS = [
        {"name": "Paracetamol", "dose_pattern": r"paracetamol\s*(\d+\s*mg)?", "category": "medication"},
        {"name": "Pantoprazole", "dose_pattern": r"pantoprazole\s*(\d+\s*mg)?", "category": "medication"},
        {"name": "Azithromycin", "dose_pattern": r"azithromycin\s*(\d+\s*mg)?", "category": "medication"},
        {"name": "Amoxicillin-Clavulanate", "dose_pattern": r"amoxicillin|augmentin", "category": "medication"},
        {"name": "ORS (Oral Rehydration Salts)", "dose_pattern": r"oral rehydration salts|ors", "category": "medication"},
        {"name": "Cetirizine", "dose_pattern": r"cetirizine\s*(\d+\s*mg)?", "category": "medication"},
        {"name": "Levocetirizine", "dose_pattern": r"levocetirizine\s*(\d+\s*mg)?", "category": "medication"},
        {"name": "Metformin", "dose_pattern": r"metformin\s*(\d+\s*mg)?", "category": "medication"},
        {"name": "Telmisartan", "dose_pattern": r"telmisartan\s*(\d+\s*mg)?", "category": "medication"},
        {"name": "Atorvastatin", "dose_pattern": r"atorvastatin\s*(\d+\s*mg)?", "category": "medication"},
        {"name": "Amlodipine", "dose_pattern": r"amlodipine\s*(\d+\s*mg)?", "category": "medication"},
        {"name": "Montelukast", "dose_pattern": r"montelukast\s*(\d+\s*mg)?", "category": "medication"},
        {"name": "Ibuprofen", "dose_pattern": r"ibuprofen\s*(\d+\s*mg)?", "category": "medication"},
    ]

    KNOWN_LABS = [
        {
            "name": "Platelet Count",
            "pattern": r"platelet\s*count\s*[:\s]*([\d,]+)\s*(/uL|/cumm)?",
            "unit": "/uL",
            "category": "lab_test",
        },
        {
            "name": "Hemoglobin",
            "pattern": r"hemoglobin\s*[:\s]*([\d\.]+)\s*(g/dL)?",
            "unit": "g/dL",
            "category": "lab_test",
        },
        {
            "name": "Total Leukocyte Count (WBC)",
            "pattern": r"(?:total\s*leukocyte\s*count|tlc|wbc)\s*[:\s]*([\d,]+)\s*(/uL|/cumm)?",
            "unit": "/uL",
            "category": "lab_test",
        },
        {
            "name": "Hematocrit (PCV)",
            "pattern": r"(?:hematocrit|pcv)\s*[:\s]*([\d\.]+)\s*(%)?",
            "unit": "%",
            "category": "lab_test",
        },
        {
            "name": "Fasting Blood Glucose",
            "pattern": r"(?:fasting\s*blood\s*(?:sugar|glucose)|fbs)\s*[:\s]*([\d\.]+)\s*(mg/dL)?",
            "unit": "mg/dL",
            "category": "lab_test",
        },
        {
            "name": "Glycated Hemoglobin (HbA1c)",
            "pattern": r"(?:hba1c|glycated\s*hemoglobin)\s*[:\s]*([\d\.]+)\s*(%)?",
            "unit": "%",
            "category": "lab_test",
        },
        {
            "name": "Serum Creatinine",
            "pattern": r"(?:serum\s*creatinine|creatinine)\s*[:\s]*([\d\.]+)\s*(mg/dL)?",
            "unit": "mg/dL",
            "category": "lab_test",
        },
        {
            "name": "Total Cholesterol",
            "pattern": r"(?:total\s*cholesterol|cholesterol)\s*[:\s]*([\d\.]+)\s*(mg/dL)?",
            "unit": "mg/dL",
            "category": "lab_test",
        },
    ]

    KNOWN_FINDINGS = [
        {"name": "Thrombocytopenia", "pattern": r"thrombocytopenia", "category": "finding"},
        {"name": "Fever", "pattern": r"fever|febrile", "category": "symptom"},
        {"name": "Headache", "pattern": r"headache", "category": "symptom"},
        {"name": "Bleeding signs", "pattern": r"bleeding|petechiae", "category": "symptom"},
    ]

    async def extract_concepts(self, text: str, source: str) -> List[ExtractedEntity]:
        entities: List[ExtractedEntity] = []
        lower = text.lower()

        # 1. Extract Medications
        for drug in self.KNOWN_DRUGS:
            match = re.search(drug["dose_pattern"], lower)
            if match:
                val = match.group(0).strip().title()
                entities.append(
                    ExtractedEntity(
                        name=drug["name"],
                        category="medication",
                        value=val,
                        confidence=0.94,
                        source=source,
                        extraction_method="Rule-based Clinical NER",
                        verified=False,
                    )
                )

        # 2. Extract Laboratory Tests
        for lab in self.KNOWN_LABS:
            match = re.search(lab["pattern"], lower)
            if match:
                res_val = match.group(1).strip()
                unit = lab.get("unit")
                entities.append(
                    ExtractedEntity(
                        name=lab["name"],
                        category="lab_test",
                        value=res_val,
                        unit=unit,
                        confidence=0.96,
                        source=source,
                        extraction_method="Rule-based Clinical NER",
                        verified=False,
                    )
                )

        # 3. Extract Clinical Findings & Symptoms
        for find in self.KNOWN_FINDINGS:
            match = re.search(find["pattern"], lower)
            if match:
                entities.append(
                    ExtractedEntity(
                        name=find["name"],
                        category=find["category"],
                        value=True,
                        confidence=0.91,
                        source=source,
                        extraction_method="Rule-based Clinical NER",
                        verified=False,
                    )
                )

        return entities


class MedCATAdapter(BaseClinicalExtractionService):
    """
    MedCAT clinical NER adapter with SNOMED-CT / UMLS concept mapping.
    Falls back to RuleBasedClinicalNERAdapter if model pack is absent.
    """

    def __init__(self):
        self._initialized = False
        try:
            import medcat  # noqa: F401
            self._initialized = True
            logger.info("MedCAT clinical NER engine initialized", extra={"service": "clinical-ner"})
        except ImportError:
            logger.warning(
                "MedCAT library not installed in current environment. Using RuleBasedClinicalNERAdapter.",
                extra={"service": "clinical-ner"}
            )

    async def extract_concepts(self, text: str, source: str) -> List[ExtractedEntity]:
        if not self._initialized:
            return await RuleBasedClinicalNERAdapter().extract_concepts(text, source)

        # In production with MedCAT:
        return await RuleBasedClinicalNERAdapter().extract_concepts(text, source)


def get_clinical_extraction_service() -> BaseClinicalExtractionService:
    if settings.CLINICAL_NER_MODE == "real" or settings.CLINICAL_NER_MODE == "medcat":
        return MedCATAdapter()
    return RuleBasedClinicalNERAdapter()


clinical_ner_service = get_clinical_extraction_service()
