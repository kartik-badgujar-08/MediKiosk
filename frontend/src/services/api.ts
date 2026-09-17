/**
 * MediKiosk API Service Client
 * Supports dynamic configuration via VITE_API_BASE_URL.
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
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

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
        // use raw body if not JSON
        if (errorBody) errorDetail = errorBody;
      }
      throw new Error(`API Error [${response.status}]: ${errorDetail}`);
    }

    return response.json() as Promise<T>;
  }

  // Health Checks
  async checkRootHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  async checkApiV1Health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/api/v1/health');
  }
}

export const api = new ApiClient();
