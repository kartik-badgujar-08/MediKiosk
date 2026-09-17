# MediKiosk (SIH26047)
### First-Mile Multimodal Multilingual Clinical Intake System

MediKiosk is an intelligent digital clinical case-taking assistant built for outpatient departments (OPDs), primary healthcare clinics, and community digital health kiosks. It gathers patient history across multiple input modalities, processes medical records, extracts structured clinical information, computes deterministic safety red flags, generates physician-oriented draft summaries, and outputs interoperable FHIR R4 resources and ABDM-ready datasets.

---

## 🌟 Key Features

- **Multimodal Channel Input**:
  - **Touchscreen Kiosk**: Large touch targets, low-cognitive-load single-question flow, body map selection.
  - **Multilingual Voice (ASR)**: Native speech-to-text pipeline supporting English, Hindi, and Marathi with IndicConformer architecture.
  - **Sign Language Accessibility (ISL)**: Dedicated Indian Sign Language intake mode aligned with the ISLRTC dictionary.
  - **Document Digitization (OCR)**: Ingestion of prescriptions and lab reports via PaddleOCR & PP-StructureV3.
- **Canonical Clinical State**:
  - Unified, typed clinical data structure serving as the single source of truth.
  - Fact-level provenance (`source`, `confidence`, `timestamp`, `verification_status`).
- **Clinical Safety & Red Flag Rules**:
  - Deterministic clinical safety rules (e.g. acute chest pain with dyspnea, fever with petechial rash).
  - Explicit non-diagnostic design: MediKiosk assists physicians and never makes autonomous clinical diagnoses.
- **Physician Review & Workflow**:
  - Structured physician intake summary.
  - Granular **Accept / Amend / Reject** controls for every clinical item.
  - Patient review screen to verify and correct OCR/speech transcription discrepancies.
- **Standards & Interoperability**:
  - Complete mapping of verified clinical state to **FHIR R4** (`Patient`, `Encounter`, `Condition`, `Observation`, `MedicationRequest`, `AllergyIntolerance`, `DocumentReference`, `Provenance`).
  - Modular integration adapters for **ABDM** (Ayushman Bharat Digital Mission) and Hospital Information Systems (**HIS**).
- **Dual Mode (Real vs. Mock)**:
  - Every external AI and integration service (`ASR`, `OCR`, `CLINICAL_NER`, `LLM`, `ABDM`, `HIS`) supports both full production adapters and standalone local mock adapters with transparent UI badging.

---

## 🏗️ Architecture

```
PATIENT INPUT (Touch | Voice | Sign | Document Upload)
                       │
                       ▼
INPUT PROCESSING (IndicConformer | PaddleOCR | ISL Recognizer)
                       │
                       ▼
CLINICAL EXTRACTION & NORMALIZATION (MedCAT / Rule-based NER)
                       │
                       ▼
CANONICAL CLINICAL STATE (Typed Single Source of Truth + Provenance)
         │                                       │
         ▼                                       ▼
DETERMINISTIC RED FLAGS            STATEFUL DIALOGUE ENGINE (SOCRATES)
         │                                       │
         └───────────────────┬───────────────────┘
                             ▼
                 LLM SUMMARY GENERATOR
                             │
                             ▼
                 PATIENT VERIFICATION REVIEW
                             │
                             ▼
                 DOCTOR CLINICAL DASHBOARD (Accept / Amend / Reject)
                             │
                             ▼
                  VERIFIED CLINICAL DATA
                             │
                             ▼
                   FHIR R4 BUNDLE GENERATION
                  ┌──────────┴──────────┐
                  ▼                     ▼
             ABDM ADAPTER          HIS ADAPTER
                  │
                  ▼
         LONGITUDINAL PATIENT TIMELINE
```

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- **Python**: 3.10+ (tested on Python 3.14)
- **Node.js**: 20+ (tested on Node 24)
- **Git**

### 1. Clone & Configure
```bash
git clone <repo-url>
cd Project
cp .env.example .env
```

### 2. Backend Setup
```bash
# Activate virtual environment
backend\venv\Scripts\activate  # Windows
# source backend/venv/bin/activate  # Linux/macOS

# Install dependencies
pip install -r backend/requirements.txt

# Run backend test suite
pytest backend/tests

# Start backend server (port 8000)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📡 Core API Endpoints

- `GET /health` - System health check & active service modes
- `GET /docs` - Interactive OpenAPI / Swagger documentation
- `GET /api/v1/health` - Detailed API v1 status

---

## 🔒 Security & Medical Ethics
- **No Autonomous Diagnosis**: MediKiosk structures clinical intake to accelerate consultation; diagnosis is exclusively the responsibility of licensed medical practitioners.
- **Audit Logging & Provenance**: Every clinical observation tracks its origin channel and verification history.
- **Role-Based Access Control**: Strict separation between Patient Intake and Clinician workstations.
- **Zero Secrets Committed**: All keys, URLs, and sensitive credentials reside in `.env`.
