/**
 * MediKiosk API Service Client
 * Full-stack integration client supporting all clinical intake services.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface HealthResponse {
  status: string;
  app: string;
  version: string;
  environment: string;
  modes?: {
    asr_mode: string;
    ocr_mode: string;
    clinical_ner_mode: string;
    llm_mode: string;
    abdm_mode: string;
    his_mode: string;
    sign_recognition_mode: string;
  };
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    const token = typeof window !== 'undefined' ? localStorage.getItem('medikiosk_token') : null;
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorDetail = response.statusText;
      try {
        const parsed = JSON.parse(errorBody);
        errorDetail = parsed.detail || parsed.message || errorDetail;
      } catch {
        if (errorBody) errorDetail = errorBody;
      }
      throw new Error(`API Error [${response.status}]: ${errorDetail}`);
    }

    return response.json() as Promise<T>;
  }

  // Health
  async checkRootHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  async checkApiV1Health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/api/v1/health');
  }

  // Demo Seed
  async seedDemoData(): Promise<any> {
    return this.request<any>('/api/v1/demo/seed', { method: 'POST' });
  }

  // Patients
  async createPatient(data: { name: string; age: number; gender: string; phone?: string; preferred_language?: string }): Promise<any> {
    return this.request<any>('/api/v1/patients/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPatients(): Promise<any[]> {
    return this.request<any[]>('/api/v1/patients/');
  }

  async getPatient(patientId: string): Promise<any> {
    return this.request<any>(`/api/v1/patients/${patientId}`);
  }

  // Encounters
  async createEncounter(data: { patient_id: string; chief_complaint?: string; intake_channel?: string; language?: string; consent_given?: boolean }): Promise<any> {
    return this.request<any>('/api/v1/encounters/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getEncounters(patientId?: string): Promise<any[]> {
    const query = patientId ? `?patient_id=${patientId}` : '';
    return this.request<any[]>(`/api/v1/encounters/${query}`);
  }

  // Interview Engine
  async startInterview(encounterId: string, language: string = 'en'): Promise<any> {
    return this.request<any>(`/api/v1/interview/start?encounter_id=${encounterId}&language=${language}`, {
      method: 'POST',
    });
  }

  async getCurrentQuestion(encounterId: string): Promise<any> {
    return this.request<any>(`/api/v1/interview/${encounterId}/current`);
  }

  async submitAnswer(encounterId: string, data: { question_id: string; answer_value: any; input_channel?: string; confidence?: number }): Promise<any> {
    return this.request<any>(`/api/v1/interview/${encounterId}/answer`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async analyzeComplaintAI(text: string, language: string = 'en'): Promise<any> {
    return this.request<any>('/api/v1/interview/ai-analyze', {
      method: 'POST',
      body: JSON.stringify({ text, language }),
    });
  }

  // Clinical State
  async getClinicalState(encounterId: string): Promise<any> {
    return this.request<any>(`/api/v1/clinical-state/${encounterId}`);
  }

  // Documents & OCR
  async uploadDocument(encounterId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('encounter_id', encounterId);
    formData.append('file', file);
    return this.request<any>('/api/v1/documents/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async processDocument(documentId: string): Promise<any> {
    return this.request<any>(`/api/v1/documents/${documentId}/process`, {
      method: 'POST',
    });
  }

  async listSampleDocuments(): Promise<any[]> {
    return this.request<any[]>('/api/v1/documents/samples/list');
  }

  async attachSampleDocument(encounterId: string, sampleId: string): Promise<any> {
    return this.request<any>('/api/v1/documents/sample/attach', {
      method: 'POST',
      body: JSON.stringify({ encounter_id: encounterId, sample_id: sampleId }),
    });
  }

  async getEncounterDocuments(encounterId: string): Promise<any[]> {
    return this.request<any[]>(`/api/v1/documents/encounter/${encounterId}`);
  }

  // Summaries
  async getSummary(encounterId: string): Promise<any> {
    return this.request<any>(`/api/v1/summaries/${encounterId}`);
  }

  async getSummaryProviders(): Promise<{ active_provider: string; providers: any[] }> {
    return this.request<{ active_provider: string; providers: any[] }>('/api/v1/summaries/providers');
  }

  async generateSummary(encounterId: string, options?: { provider?: string; language?: string }): Promise<any> {
    const params = new URLSearchParams();
    if (options?.provider) params.append('provider', options.provider);
    if (options?.language) params.append('language', options.language);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<any>(`/api/v1/summaries/generate/${encounterId}${queryString}`, {
      method: 'POST',
    });
  }


  // Verification
  async patientConfirm(data: { encounter_id: string; confirmed: boolean; corrections?: any[] }): Promise<any> {
    return this.request<any>('/api/v1/verification/patient-confirm', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async doctorVerify(data: { encounter_id: string; doctor_id: string; doctor_name: string; actions: any[]; overall_assessment?: string; finalize_encounter?: boolean }): Promise<any> {
    return this.request<any>('/api/v1/verification/doctor-verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getVerificationHistory(encounterId: string): Promise<any[]> {
    return this.request<any[]>(`/api/v1/verification/history/${encounterId}`);
  }

  // Timeline
  async getPatientTimeline(patientId: string): Promise<any> {
    return this.request<any>(`/api/v1/timeline/${patientId}`);
  }

  // FHIR
  async getFHIRBundle(encounterId: string): Promise<any> {
    return this.request<any>(`/api/v1/fhir/bundle/${encounterId}`);
  }

  async pushFHIRBundle(encounterId: string): Promise<any> {
    return this.request<any>(`/api/v1/fhir/push/${encounterId}`, {
      method: 'POST',
    });
  }

  // ISL Recognition
  async getISLVocabulary(): Promise<any[]> {
    return this.request<any[]>('/api/v1/sign/vocabulary');
  }

  async recognizeSign(data: { encounter_id: string; question_id: string; simulated_sign?: string }): Promise<any> {
    return this.request<any>('/api/v1/sign/recognize', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ASR
  async transcribeAudio(file: Blob, language: string = 'en'): Promise<any> {
    const formData = new FormData();
    formData.append('file', file, 'speech.wav');
    formData.append('language', language);
    return this.request<any>('/api/v1/asr/transcribe', {
      method: 'POST',
      body: formData,
    });
  }

  // ==========================================
  // Government Identity Auth (ABHA & HPR / NMC)
  // ==========================================

  async initAbhaAuth(abhaId: string, authMode: string = 'MOBILE_OTP'): Promise<ABHAInitResponse> {
    return this.request<ABHAInitResponse>('/api/v1/auth/gov/patient/abha/init', {
      method: 'POST',
      body: JSON.stringify({ abha_id: abhaId, auth_mode: authMode }),
    });
  }

  async verifyAbhaOtp(txnId: string, otp: string): Promise<ABHAProfileResponse> {
    return this.request<ABHAProfileResponse>('/api/v1/auth/gov/patient/abha/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ txn_id: txnId, otp: otp }),
    });
  }

  async scanAbhaQr(qrPayload: string): Promise<ABHAProfileResponse> {
    return this.request<ABHAProfileResponse>('/api/v1/auth/gov/patient/abha/qr-scan', {
      method: 'POST',
      body: JSON.stringify({ qr_payload: qrPayload }),
    });
  }

  async initHprAuth(params: { hprId?: string; registrationNumber?: string; stateMedicalCouncil?: string }): Promise<HPRInitResponse> {
    return this.request<HPRInitResponse>('/api/v1/auth/gov/doctor/hpr/init', {
      method: 'POST',
      body: JSON.stringify({
        hpr_id: params.hprId || undefined,
        registration_number: params.registrationNumber || undefined,
        state_medical_council: params.stateMedicalCouncil || undefined,
      }),
    });
  }

  async verifyHprOtp(txnId: string, otp: string): Promise<HPRProfileResponse> {
    return this.request<HPRProfileResponse>('/api/v1/auth/gov/doctor/hpr/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ txn_id: txnId, otp: otp }),
    });
  }

  async getMedicalCouncils(): Promise<MedicalCouncilItem[]> {
    return this.request<MedicalCouncilItem[]>('/api/v1/auth/gov/councils');
  }

  async getGovSession(): Promise<any> {
    return this.request<any>('/api/v1/auth/gov/me');
  }

  async logoutGov(): Promise<any> {
    return this.request<any>('/api/v1/auth/gov/logout', {
      method: 'POST',
    });
  }
}

export interface ABHAInitResponse {
  status: string;
  txn_id: string;
  auth_mode: string;
  masked_recipient: string;
  gateway_mode: string;
  message: string;
}

export interface ABHAProfile {
  abha_number: string;
  abha_address: string;
  name: string;
  gender: string;
  date_of_birth: string;
  age: number;
  mobile: string;
  address?: string;
  district_name?: string;
  state_name?: string;
  pincode?: string;
  kyc_verified: boolean;
  photo_url?: string;
}

export interface ABHAProfileResponse {
  status: string;
  access_token: string;
  token_type: string;
  role: string;
  profile: ABHAProfile;
  gateway_mode: string;
}

export interface HPRInitResponse {
  status: string;
  txn_id: string;
  doctor_name: string;
  council: string;
  registration_number: string;
  status_in_registry: string;
  masked_mobile: string;
  gateway_mode: string;
  message: string;
}

export interface HPRDoctorProfile {
  hpr_id: string;
  registration_number: string;
  state_medical_council: string;
  full_name: string;
  degrees: string;
  specialization: string;
  registry_status: string;
  hospital_affiliation?: string;
  nmc_verified: boolean;
}

export interface HPRProfileResponse {
  status: string;
  access_token: string;
  token_type: string;
  role: string;
  profile: HPRDoctorProfile;
  gateway_mode: string;
}

export interface MedicalCouncilItem {
  code: string;
  name: string;
  state: string;
}

export const api = new ApiClient();
