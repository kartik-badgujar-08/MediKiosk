# MediKiosk Deployment & Production Guide

This guide details how to deploy **MediKiosk** to production environments with independent frontend and backend hosting, cloud MongoDB, automated GitHub CI/CD, and environment configuration.

---

## 1. High-Level Production Architecture

```
                      GitHub Repository (Push to main/develop)
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
        Vercel (React Frontend)                Render / Cloud (FastAPI Backend)
     https://medikiosk.vercel.app               https://medikiosk-api.onrender.com
                    │                                       │
                    │ (VITE_API_BASE_URL)                   ▼
                    └──────────────────────────►   MongoDB Atlas (Cloud DB)
                                                            │
                                               ┌────────────┴────────────┐
                                               ▼                         ▼
                                       AI Microservices            HL7 FHIR / ABDM
                                      (IndicConformer/PaddleOCR)   (Sandbox Gateway)
```

---

## 2. Cloud Database Setup (MongoDB Atlas)

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user with read/write privileges.
3. In **Network Access**, allow access from `0.0.0.0/0` (any IP) or specify your backend hosting IPs.
4. Retrieve the connection URI:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/medikiosk?retryWrites=true&w=majority
   ```

---

## 3. Backend Deployment (Render / Railway / Cloud VM)

The backend is built with FastAPI, listens on `0.0.0.0`, dynamically binds to the `$PORT` environment variable, and exposes `/health` and `/docs`.

### Deploying to Render
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository.
3. Configure the service:
   - **Root Directory**: `backend` (or use root `render.yaml`)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`
4. Set **Environment Variables**:
   - `ENVIRONMENT`: `production`
   - `DEBUG`: `false`
   - `PORT`: `8000` (or leave default for Render)
   - `MONGODB_URI`: `<Your MongoDB Atlas connection string>`
   - `DB_NAME`: `medikiosk`
   - `JWT_SECRET`: `<Secure random 32+ character string>`
   - `FRONTEND_URL`: `https://your-medikiosk-app.vercel.app`
   - `CORS_ORIGINS`: `https://your-medikiosk-app.vercel.app`
   - `ASR_MODE`: `mock` (or `indicconformer`)
   - `OCR_MODE`: `mock` (or `paddleocr`)
   - `LLM_MODE`: `mock` (or `qwen` / `openai-compatible`)
   - `ABDM_MODE`: `mock`
   - `HIS_MODE`: `mock`

### Verify Backend Health
Once deployed, verify:
```bash
curl -f https://<YOUR_BACKEND_URL>/health
# Expected output: {"status":"ok","app":"MediKiosk","version":"1.0.0","environment":"production"}
```

---

## 4. Frontend Deployment (Vercel)

The React single-page application is built using Vite and Tailwind CSS.

### Deploying to Vercel
1. Import your GitHub repository in [Vercel](https://vercel.com).
2. Configure settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Set **Environment Variables**:
   - `VITE_API_BASE_URL`: `https://<YOUR_DEPLOYED_BACKEND_URL>`
4. Deploy. Vercel automatically deploys updates upon every `git push`.

---

## 5. Continuous Integration (GitHub Actions)

A pre-configured CI pipeline (`.github/workflows/ci.yml`) runs on every push and pull request:
1. Installs Python 3.11 and backend dependencies.
2. Executes all 16 backend unit, API, OCR, clinical state, and integration test suites.
3. Installs Node 20 and frontend dependencies.
4. Validates TypeScript strict types and compiles the production frontend bundle.

---

## 6. Dual Mode (Real vs. Mock) Configuration

MediKiosk features zero-crash architectural fallback for all AI and integration services:

| Service | Real Mode Setting | Mock Mode Setting | Notes |
| :--- | :--- | :--- | :--- |
| **ASR** | `ASR_MODE=indicconformer` | `ASR_MODE=mock` | Real connects to AI4Bharat Conformer API; Mock provides realistic Hindi/Marathi/English presets |
| **OCR** | `OCR_MODE=paddleocr` | `OCR_MODE=mock` | Real uses PaddleOCR + PP-StructureV3; Mock parses sample CBC and prescriptions |
| **Clinical NER** | `CLINICAL_NER_MODE=medcat` | `CLINICAL_NER_MODE=mock` | Real uses MedCAT SNOMED-CT model; Mock uses clinical regex & vocab |
| **LLM Summary** | `LLM_MODE=qwen` | `LLM_MODE=mock` | Real connects to Qwen/Llama API; Mock synthesizes typed Canonical Clinical State |
| **ABDM** | `ABDM_MODE=sandbox` | `ABDM_MODE=mock` | Simulates M1/M2/M3 ABHA linking and health record push |
| **HIS** | `HIS_MODE=webhook` | `HIS_MODE=mock` | Simulates hospital EHR synchronization |

---

## 7. Troubleshooting

- **CORS Errors**: Ensure `CORS_ORIGINS` on the backend includes the exact Vercel frontend URL (without trailing slash).
- **Backend Port**: Make sure your container or process listens on `0.0.0.0` and uses the `$PORT` environment variable provided by the cloud host.
- **MongoDB Auth Failed**: Double check URL encoding of special characters in database passwords within `MONGODB_URI`.
