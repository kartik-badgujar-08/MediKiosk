# MediKiosk - Architectural Overview

## 1. Executive Summary
**MediKiosk** is a multimodal, multilingual first-mile clinical case-taking system engineered for high-throughput healthcare centers, OPD clinics, and community healthcare kiosks. It serves as an intelligent intake assistant that gathers, digitizes, normalizes, and verifies patient medical information prior to physician consultation.

## 2. Core Pillars
1. **Multimodal Channels**: Touchscreen kiosk, Multilingual Voice (IndicConformer ASR for Hindi, Marathi, English), Indian Sign Language (ISL) controlled accessibility, and Physical Document Digitization (Prescriptions, Lab Reports).
2. **Dialogue Engine**: Dynamic, non-linear clinical interview engine using LangGraph / state machine architecture supporting SOCRATES for pain and standard clinical history (CC, HPI, PMH, PSH, Meds, Allergies, FH, PH, ROS, AYUSH).
3. **Canonical Clinical State**: Typed structured source of truth with granular data provenance (`source`, `confidence`, `timestamp`, `verification_status`). LLM text is never stored blindly as clinical truth.
4. **Deterministic Red Flag Engine**: Rule-based safety net that flags high-risk symptom complexes (e.g., chest pain + breathlessness, fever + bleeding) without ever making an autonomous diagnostic claim.
5. **Physician Verification Layer**: Structured summary with full traceability. Doctors review every item with individual **Accept / Amend / Reject** controls.
6. **Standards & Interoperability**: Automatic conversion of verified clinical records into **FHIR R4** bundles (`Patient`, `Encounter`, `Condition`, `Observation`, `MedicationRequest`, `AllergyIntolerance`, `DocumentReference`, `Provenance`), coupled with ABDM and HIS integration adapters.
7. **Architectural Separation**: Strict separation between REAL and MOCK service adapters (`ASR_MODE`, `OCR_MODE`, `LLM_MODE`, `ABDM_MODE`, `HIS_MODE`) with clear visual labeling in the UI.

## 3. Data Flow Diagram
```
Patient (Voice/Touch/Sign/Upload)
   │
   ▼
Input Processing (IndicConformer / PaddleOCR / ISL Recognizer)
   │
   ▼
Clinical NER & Concept Normalization (MedCAT / Rule-based)
   │
   ▼
Canonical Clinical State (Typed schema + Provenance)
   │               │
   ▼               ▼
Red Flag Rules    Stateful Dialogue Engine
   │               │
   └───────┬───────┘
           ▼
LLM Physician Summary Generator
           │
           ▼
Patient Verification Review (Review & Correct OCR errors)
           │
           ▼
Doctor Clinical Dashboard (Accept / Amend / Reject)
           │
           ▼
Verified Clinical Data
           │
           ▼
FHIR R4 Adapter ──► ABDM / HIS Integration Adapters
           │
           ▼
Longitudinal Patient Timeline
```
