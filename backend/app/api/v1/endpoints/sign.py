from typing import List
from fastapi import APIRouter
from app.schemas.sign import ISLVocabularyItem, SignRecognitionRequest, SignRecognitionResponse
from app.services.sign.sign_service import sign_recognition_service

router = APIRouter()


@router.post("/recognize", response_model=SignRecognitionResponse)
async def recognize_sign_gesture(request: SignRecognitionRequest):
    return await sign_recognition_service.recognize(request)


@router.get("/vocabulary", response_model=List[ISLVocabularyItem])
def get_isl_vocabulary():
    return sign_recognition_service.get_vocabulary()
