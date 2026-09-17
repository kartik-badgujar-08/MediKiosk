# MediKiosk (SIH26047)
### First-Mile Multimodal Multilingual Clinical Intake & Case-Taking System

[![MediKiosk CI](https://github.com/kartik-badgujar-08/MediKiosk/actions/workflows/ci.yml/badge.svg)](https://github.com/kartik-badgujar-08/MediKiosk/actions)
![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)
![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.14-emerald.svg)
![Node](https://img.shields.io/badge/Node.js-20%20%7C%2024-sky.svg)
![FHIR](https://img.shields.io/badge/Interoperability-HL7%20FHIR%20R4-indigo.svg)
![ABDM](https://img.shields.io/badge/National%20Standards-ABDM%20M1%2FM2%2FM3-orange.svg)

MediKiosk is an intelligent, multimodal digital clinical case-taking assistant engineered for outpatient departments (OPDs), community healthcare centers, and rural health kiosks. It digitizes first-mile patient medical intake through Speech, Touch, Indian Sign Language (ISL), and Document OCR into a structured, FHIR-ready **Canonical Clinical State**, applies deterministic safety rules, generates physician draft summaries, supports full traceability with patient & clinician verification (Accept / Amend / Reject), and integrates with ABDM and hospital EHRs.

---

## 📌 Executive Problem Statement
In high-volume public hospitals and primary clinics, physicians face extreme time constraints (often 2–3 minutes per patient), leading to incomplete history taking, missed drug allergies, and unrecorded physical prescriptions. Low-literacy, elderly, and deaf patients face severe accessibility barriers. MediKiosk bridges this gap at the first mile before consultation begins, transforming unstructured patient responses and physical records into structured, doctor-ready clinical insights.

---

## 🏗️ High-Level System Architecture

```
PATIENT
   │
   ▼
+──────────────────────────────────────────────────────────────+
|                     INPUT CHANNELS                           |
|  Touchscreen Kiosk │ Multilingual Voice │ ISL │ Document OCR |
+──────────────────────────────────────────────────────────────+
   │
   ▼
+──────────────────────────────────────────────────────────────+
|                 INPUT PROCESSING LAYER                       |
|   IndicConformer ASR │ PaddleOCR / PP-StructureV3 │ ISLRTC   |
+──────────────────────────────────────────────────────────────+
   │
   ▼
+──────────────────────────────────────────────────────────────+
|                CLINICAL EXTRACTION LAYER                     |
|           MedCAT Adapter │ Rule-Based Clinical NER           |
+──────────────────────────────────────────────────────────────+
   │
   ▼
+──────────────────────────────────────────────────────────────+
|                CANONICAL CLINICAL STATE                      |
|         Single Structured Source of Truth with               |
|            Granular Fact-Level Provenance                    |
+──────────────────────────────────────────────────────────────+
   │                                             │
   ▼                                             ▼
DETERMINISTIC RED FLAGS             STATEFUL DIALOGUE MANAGER
(Zero-autonomous diagnosis safety)  (Adaptive SOCRATES Questioning)
   │                                             │
   └──────────────────────┬──────────────────────┘
                          ▼
            LLM PHYSICIAN SUMMARY GENERATOR
         (Qwen / Llama / Provider Abstraction)
                          │
                          ▼
            PATIENT VERIFICATION REVIEW
          (Confirm & Correct OCR Transcriptions)
                          │
                          ▼
            DOCTOR CLINICAL DASHBOARD
         (Accept / Amend / Reject Workflow)
                          │
                          ▼
               VERIFIED CLINICAL DATA
                          │
                          ▼
                  HL7 FHIR R4 ADAPTER
               ┌──────────┴──────────┐
               ▼                     ▼
         ABDM ADAPTER           HIS ADAPTER
         (M1/M2/M3 Sandbox)    (EHR Webhook)
               │
               ▼
      LONGITUDINAL PATIENT TIMELINE
```

---

## 🌟 Core Pillars & Key Capabilities

1. **Multimodal Clinical Intake**:
   - **Touchscreen Kiosk**: Clean healthcare design system (Sky Blue `#0EA5E9`, Teal `#14B8A6`), large accessible touch targets, high contrast, low cognitive load.
   - **Multilingual Voice (ASR)**: Native support for English, Hindi (`हिंदी`), and Marathi (`मराठी`) using AI4Bharat IndicConformer ASR abstraction.
   - **Sign Language Accessibility (ISL)**: Dedicated Indian Sign Language mode referencing the official **ISLRTC Indian Sign Language Dictionary** with controlled medical vocabulary and visual sign animations.
   - **Medical Document Digitization (OCR)**: Ingestion of prescriptions and haematology lab reports (CBC, Platelet Count) using PaddleOCR & PP-StructureV3.

2. **Stateful Dialogue Manager (Adaptive Questioning)**:
   - Dynamic questioning based on chief complaint.
   - Clinical **SOCRATES** pain mapping framework:
     - **S**ite, **O**nset, **C**haracter, **R**adiation, **A**ssociated symptoms, **T**iming, **E**xacerbating factors, **S**everity (Visual Analog Scale 1–10).
   - Core clinical history sections: Chief Complaint (CC), History of Present Illness (HPI), Past Medical History (PMH), Medications, Allergies (NKDA), and AYUSH-aware herbal decoction/remedy history.

3. **Canonical Clinical State (Single Source of Truth)**:
   - Structured JSON schema acting as the canonical truth. LLM prose is never stored blindly as verified clinical facts.
   - Fact-level data provenance tracking: `source` (voice, touch, text, sign, ocr, doctor), `confidence`, `timestamp`, and `verification_status`.

4. **Deterministic Red Flag Safety Engine**:
   - Strict medical ethics: **The AI never makes autonomous diagnoses** (e.g. never outputs "You have dengue" or "You have myocardial infarction").
   - Rule-based safety triggers:
     - Acute chest discomfort with respiratory compromise or cold diaphoresis.
     - Chest pain radiating to left arm, neck, or jaw.
     - Febrile illness with petechial rash or mucosal bleeding.
     - Prolonged high-grade fever with rigors and local mosquito vector exposure.
     - Excruciating pain score ($\ge 9/10$).
   - Output message: *"Potential clinical red flag detected — clinician review required."*

5. **Physician Verification Layer**:
   - Physician-oriented structured draft summary.
   - Patient review screen to verify and correct OCR typos before doctor queue submission.
   - Granular **Accept / Amend / Reject** controls for every clinical item.
   - Full audit trail logging who verified, timestamp, original value, and amended value.

6. **Interoperability Standards (FHIR R4 & ABDM)**:
   - Verified clinical facts mapped to HL7 FHIR R4 resources:
     `Patient`, `Encounter`, `Condition`, `Observation`, `MedicationRequest`, `AllergyIntolerance`, `DocumentReference`, `Provenance`.
   - ABDM integration adapter simulating Ayushman Bharat Health Account (ABHA) linking and health record push (M1, M2, M3).
   - Hospital Information System (HIS) synchronization adapter.

7. **Dual Mode Architecture (Real vs. Mock)**:
   - Seamless switching via environment variables (`ASR_MODE`, `OCR_MODE`, `LLM_MODE`, `ABDM_MODE`, `HIS_MODE`).
   - Mock adapters provide zero-crash high-fidelity simulated responses for offline testing and developer environments, with transparent UI badging.

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Python**: 3.10+ (tested on Python 3.14)
- **Node.js**: 20+ (tested on Node 24)
- **Git**

### 1. Clone Repository & Setup Environment
```bash
git clone <repository-url>
cd Project
cp .env.example .env
cp frontend/.env.example frontend/.env
```

### 2. Backend Setup
```bash
# Activate virtual environment
backend\venv\Scripts\activate  # Windows
# source backend/venv/bin/activate  # Linux / macOS

# Install backend dependencies
pip install -r backend/requirements.txt

# Run full backend test suite (16 test suites)
pytest backend/tests -v

# Start FastAPI backend (port 8000)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive API Swagger Docs: `http://localhost:8000/docs`  
Health Check Endpoint: `http://localhost:8000/health`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run build   # Production compile check
npm run dev     # Starts Vite dev server (port 5173)
```
Patient Kiosk & Doctor Dashboard: `http://localhost:5173`

---

## 🧪 Test Suite & Validation

The repository includes comprehensive automated test suites covering all modules:

```bash
pytest backend/tests
```

| Test File | Focus Area | Status |
| :--- | :--- | :--- |
| `test_health.py` | Root and API v1 system health endpoints | ✅ Passed |
| `test_auth_and_encounters.py` | JWT authentication, RBAC, Patient & Encounter lifecycle | ✅ Passed |
| `test_interview.py` | Adaptive dialogue manager, SOCRATES pain mapping, red flag triggers | ✅ Passed |
| `test_clinical_state.py` | Canonical Clinical State, typed facts, provenance tracking | ✅ Passed |
| `test_documents_and_ocr.py` | Document upload, PaddleOCR processing, MedCAT/NER concept extraction | ✅ Passed |
| `test_asr.py` | Multilingual speech-to-text (English, Hindi, Marathi) | ✅ Passed |
| `test_summaries.py` | LLM physician draft intake note synthesis | ✅ Passed |
| `test_verification.py` | Patient review, OCR typo correction, Doctor Accept/Amend/Reject | ✅ Passed |
| `test_timeline.py` | Longitudinal patient timeline across historical encounters | ✅ Passed |
| `test_fhir.py` | FHIR R4 Bundle conversion (Patient, Condition, MedReq, Obs, Provenance) | ✅ Passed |
| `test_integrations.py` | ABDM ABHA care context linking & HIS EHR synchronization | ✅ Passed |
| `test_sign.py` | Controlled Indian Sign Language (ISLRTC) gesture recognition | ✅ Passed |
| `test_demo_e2e.py` | End-to-end integration validation for Rahul Sharma & Sunita Patil | ✅ Passed |

---

## 🩺 Demo Scenarios

### Scenario 1: Rahul Sharma (Multilingual Voice + Document OCR)
- **Patient**: Rahul Sharma, 35, Male
- **Intake Modality**: Multilingual Voice (Hindi) + Touch
- **Chief Complaint**: Acute Fever for 3 days, severe throbbing headache, generalized myalgia, active mosquito exposure in locality.
- **Uploaded Document**: Physical Prescription & CBC Report (`Sample_CBC_Report.pdf`).
- **Pipeline**: PaddleOCR reads CBC report $\rightarrow$ MedCAT extracts Platelet Count (130,000 /uL, mild thrombocytopenia) and Paracetamol 650mg TDS $\rightarrow$ Merged into Canonical Clinical State with OCR provenance $\rightarrow$ Red flag engine detects fever + mosquito exposure vector consideration $\rightarrow$ LLM synthesizes structured draft $\rightarrow$ Patient reviews and corrects OCR typo $\rightarrow$ Doctor reviews, accepts facts, and finalizes encounter $\rightarrow$ FHIR R4 bundle generated.

### Scenario 2: Sunita Patil (Deaf Patient ISL Accessibility)
- **Patient**: Sunita Patil, 28, Female
- **Intake Modality**: Indian Sign Language (ISL Mode)
- **Flow**: ISL avatar presents question $\rightarrow$ Patient responds using supported sign `PAIN_STOMACH` (ISLRTC-MED-0341) $\rightarrow$ Sign recognition maps intent to "Abdominal Pain" $\rightarrow$ SOCRATES pain questionnaire guides onset, character, and severity $\rightarrow$ Enters identical Canonical Clinical State $\rightarrow$ Doctor reviews in clinical dashboard.

To seed both demo scenarios with 1-click, click **"Seed Demo Scenarios"** on the home page or invoke:
```bash
curl -X POST http://localhost:8000/api/v1/demo/seed
```

---

## 🌐 Production Deployment Architecture

See [Deployment Guide](docs/deployment.md) for full instructions:
- **Frontend Hosting**: Vercel (`frontend/vercel.json`)
- **Backend Hosting**: Render / Cloud Container (`backend/Dockerfile`, `render.yaml`)
- **Database**: MongoDB Atlas cloud cluster (`MONGODB_URI`)
- **CI/CD**: GitHub Actions workflow (`.github/workflows/ci.yml`)

---

## 🔒 Security, Privacy & Medical Ethics

1. **No Autonomous Diagnosis**: MediKiosk assists physicians by structuring intake; clinical diagnosis remains the exclusive responsibility of licensed medical practitioners.
2. **Data Provenance**: Every clinical observation tracks its origin channel and verification history.
3. **Role-Based Access Control**: Strict segregation between Patient Kiosk and Physician Workstation.
4. **Zero Secrets Committed**: All API keys, tokens, and database credentials reside exclusively in `.env`.

---

## 📄 License
Licensed under the Apache License, Version 2.0.
