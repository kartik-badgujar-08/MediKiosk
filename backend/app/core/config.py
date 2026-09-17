from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    # Application
    PROJECT_NAME: str = "MediKiosk"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    API_V1_PREFIX: str = "/api/v1"

    # Security
    JWT_SECRET: str = "supersecret_dev_jwt_key_change_in_production_min32chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Database
    MONGODB_URI: str = "mongodb://localhost:27017/medikiosk"
    DB_NAME: str = "medikiosk"

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, tuple)):
            return list(v)
        return ["http://localhost:5173", "http://127.0.0.1:5173"]

    # Multilingual ASR
    ASR_MODE: str = "mock"  # mock | indicconformer | bhashini
    ASR_PROVIDER: str = "indicconformer"
    ASR_SERVICE_URL: str = ""

    # Document OCR
    OCR_MODE: str = "mock"  # mock | paddleocr | trocr
    OCR_PROVIDER: str = "paddleocr"

    # Clinical NER
    CLINICAL_NER_MODE: str = "mock"  # mock | medcat | rule_based
    MEDCAT_MODEL_PACK: str = ""

    # LLM Service
    LLM_MODE: str = "mock"  # mock | qwen | llama | ollama | openai-compatible
    LLM_PROVIDER: str = "qwen"
    LLM_API_KEY: str = ""
    LLM_BASE_URL: str = ""
    LLM_MODEL_NAME: str = "qwen2.5-7b-instruct"

    # Standards & Integrations
    FHIR_BASE_URL: str = "https://hapi.fhir.org/baseR4"
    ABDM_MODE: str = "mock"  # mock | sandbox | live
    ABDM_CLIENT_ID: str = ""
    ABDM_CLIENT_SECRET: str = ""
    ABDM_GATEWAY_URL: str = ""

    HIS_MODE: str = "mock"  # mock | webhook | rest
    HIS_ENDPOINT_URL: str = ""
    HIS_API_KEY: str = ""

    # Accessibility
    SIGN_RECOGNITION_MODE: str = "mock"  # mock | mediapipe | islrtc


settings = Settings()
