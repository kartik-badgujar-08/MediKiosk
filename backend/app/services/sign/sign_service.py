import abc
import time
from typing import Dict, List, Optional
from app.core.config import settings
from app.core.logging import logger
from app.schemas.sign import ISLVocabularyItem, SignRecognitionRequest, SignRecognitionResponse


class BaseSignRecognitionService(abc.ABC):
    @abc.abstractmethod
    async def recognize(self, request: SignRecognitionRequest) -> SignRecognitionResponse:
        pass

    @abc.abstractmethod
    def get_vocabulary(self) -> List[ISLVocabularyItem]:
        pass


class ControlledMedicalISLService(BaseSignRecognitionService):
    """
    Indian Sign Language recognition and question presentation service.
    Vocabulary strictly references the official ISLRTC Indian Sign Language Dictionary.
    """

    ISLRTC_DICTIONARY: Dict[str, ISLVocabularyItem] = {
        "FEVER": ISLVocabularyItem(
            sign_code="FEVER",
            islrtc_ref_id="ISLRTC-MED-0104",
            gloss="FEVER / HIGH TEMPERATURE",
            english_meaning="Fever",
            hindi_meaning="बुखार",
            marathi_meaning="ताप",
            clinical_category="symptom",
            mapped_question_id="CC_PRIMARY",
            mapped_answer_value="Fever",
            video_url="/assets/isl/signs/fever.mp4",
        ),
        "PAIN_STOMACH": ISLVocabularyItem(
            sign_code="PAIN_STOMACH",
            islrtc_ref_id="ISLRTC-MED-0341",
            gloss="STOMACH / ABDOMEN PAIN",
            english_meaning="Stomach Ache",
            hindi_meaning="पेट में दर्द",
            marathi_meaning="पोटदुखी",
            clinical_category="symptom",
            mapped_question_id="CC_PRIMARY",
            mapped_answer_value="Abdominal",
            video_url="/assets/isl/signs/stomach_pain.mp4",
        ),
        "PAIN_HEAD": ISLVocabularyItem(
            sign_code="PAIN_HEAD",
            islrtc_ref_id="ISLRTC-MED-0210",
            gloss="HEADACHE / HEAD PAIN",
            english_meaning="Severe Headache",
            hindi_meaning="सिरदर्द",
            marathi_meaning="डोकेदुखी",
            clinical_category="symptom",
            mapped_question_id="FEVER_ASSOCIATED",
            mapped_answer_value="Headache",
            video_url="/assets/isl/signs/headache.mp4",
        ),
        "PAIN_CHEST": ISLVocabularyItem(
            sign_code="PAIN_CHEST",
            islrtc_ref_id="ISLRTC-MED-0418",
            gloss="CHEST PAIN / HEAVY CHEST",
            english_meaning="Chest Pain",
            hindi_meaning="छाती में दर्द",
            marathi_meaning="छातीत वेदना",
            clinical_category="symptom",
            mapped_question_id="SOCRATES_SITE",
            mapped_answer_value="Chest",
            video_url="/assets/isl/signs/chest_pain.mp4",
        ),
        "YES": ISLVocabularyItem(
            sign_code="YES",
            islrtc_ref_id="ISLRTC-GEN-0012",
            gloss="YES / AFFIRMATIVE",
            english_meaning="Yes",
            hindi_meaning="हाँ",
            marathi_meaning="होय",
            clinical_category="response",
            mapped_answer_value="True",
            video_url="/assets/isl/signs/yes.mp4",
        ),
        "NO": ISLVocabularyItem(
            sign_code="NO",
            islrtc_ref_id="ISLRTC-GEN-0013",
            gloss="NO / NEGATIVE",
            english_meaning="No",
            hindi_meaning="नहीं",
            marathi_meaning="नाही",
            clinical_category="response",
            mapped_answer_value="False",
            video_url="/assets/isl/signs/no.mp4",
        ),
        "COUGH": ISLVocabularyItem(
            sign_code="COUGH",
            islrtc_ref_id="ISLRTC-MED-0122",
            gloss="COUGH / COLD",
            english_meaning="Cough & Cold",
            hindi_meaning="खांसी और जुकाम",
            marathi_meaning="खोकला आणि सर्दी",
            clinical_category="symptom",
            mapped_question_id="CC_PRIMARY",
            mapped_answer_value="Cough",
            video_url="/assets/isl/signs/cough.mp4",
        ),
        "BREATHLESSNESS": ISLVocabularyItem(
            sign_code="BREATHLESSNESS",
            islrtc_ref_id="ISLRTC-MED-0512",
            gloss="DIFFICULTY BREATHING",
            english_meaning="Difficulty Breathing",
            hindi_meaning="सांस लेने में तकलीफ",
            marathi_meaning="श्वास घेण्यास त्रास",
            clinical_category="symptom",
            mapped_question_id="CC_PRIMARY",
            mapped_answer_value="Breathlessness",
            video_url="/assets/isl/signs/breathlessness.mp4",
        ),
        "RASH": ISLVocabularyItem(
            sign_code="RASH",
            islrtc_ref_id="ISLRTC-MED-0288",
            gloss="SKIN RASH / ITCHING",
            english_meaning="Skin Rash / Itching",
            hindi_meaning="त्वचा पर चकत्ते / खुजली",
            marathi_meaning="त्वचेवर पुरळ / खाज",
            clinical_category="symptom",
            mapped_question_id="CC_PRIMARY",
            mapped_answer_value="Rash",
            video_url="/assets/isl/signs/rash.mp4",
        ),
        "PAIN_BACK": ISLVocabularyItem(
            sign_code="PAIN_BACK",
            islrtc_ref_id="ISLRTC-MED-0391",
            gloss="LOWER BACK PAIN / SPINE",
            english_meaning="Lower Back / Spine",
            hindi_meaning="कमर / पीठ दर्द",
            marathi_meaning="कंबर / पाठीत वेदना",
            clinical_category="symptom",
            mapped_question_id="SOCRATES_SITE",
            mapped_answer_value="Lower Back",
            video_url="/assets/isl/signs/back_pain.mp4",
        ),
        "DURATION_1DAY": ISLVocabularyItem(
            sign_code="DURATION_1DAY",
            islrtc_ref_id="ISLRTC-GEN-0401",
            gloss="1 DAY DURATION",
            english_meaning="1 day or less",
            hindi_meaning="1 दिन या कम",
            marathi_meaning="1 दिवस किंवा कमी",
            clinical_category="duration",
            mapped_question_id="FEVER_DURATION",
            mapped_answer_value="1 day",
            video_url="/assets/isl/signs/1day.mp4",
        ),
        "DURATION_3DAYS": ISLVocabularyItem(
            sign_code="DURATION_3DAYS",
            islrtc_ref_id="ISLRTC-GEN-0402",
            gloss="2 TO 3 DAYS DURATION",
            english_meaning="2 to 3 days",
            hindi_meaning="2 से 3 दिन",
            marathi_meaning="2 ते 3 दिवस",
            clinical_category="duration",
            mapped_question_id="FEVER_DURATION",
            mapped_answer_value="3 days",
            video_url="/assets/isl/signs/3days.mp4",
        ),
        "DURATION_1WEEK": ISLVocabularyItem(
            sign_code="DURATION_1WEEK",
            islrtc_ref_id="ISLRTC-GEN-0403",
            gloss="1 WEEK DURATION",
            english_meaning="4 to 7 days (1 week)",
            hindi_meaning="4 से 7 दिन",
            marathi_meaning="4 ते 7 दिवस",
            clinical_category="duration",
            mapped_question_id="FEVER_DURATION",
            mapped_answer_value="1 week",
            video_url="/assets/isl/signs/1week.mp4",
        ),
    }

    def get_vocabulary(self) -> List[ISLVocabularyItem]:
        return list(self.ISLRTC_DICTIONARY.values())

    async def recognize(self, request: SignRecognitionRequest) -> SignRecognitionResponse:
        start_time = time.time()
        sign_key = request.simulated_sign or "FEVER"
        sign_key = sign_key.upper().strip()

        if sign_key in self.ISLRTC_DICTIONARY:
            item = self.ISLRTC_DICTIONARY[sign_key]
            duration_ms = round((time.time() - start_time) * 1000, 2)
            return SignRecognitionResponse(
                recognized_sign=item.sign_code,
                islrtc_ref_id=item.islrtc_ref_id,
                confidence=0.94,
                clinical_meaning=item.english_meaning,
                mapped_answer_value=item.mapped_answer_value or item.english_meaning,
                is_supported=True,
                input_channel="sign_language",
                processing_time_ms=duration_ms,
            )

        duration_ms = round((time.time() - start_time) * 1000, 2)
        return SignRecognitionResponse(
            recognized_sign="UNKNOWN_SIGN",
            islrtc_ref_id="N/A",
            confidence=0.35,
            clinical_meaning="Unsupported sign gesture — please use touch controls to answer.",
            mapped_answer_value="Uncertain",
            is_supported=False,
            input_channel="sign_language",
            processing_time_ms=duration_ms,
        )


sign_recognition_service = ControlledMedicalISLService()
