import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SocratesExtractedSlots(BaseModel):
    site: Optional[str] = None
    onset: Optional[str] = None
    character: Optional[str] = None
    radiation: Optional[str] = None
    associated: List[str] = Field(default_factory=list)
    timing: Optional[str] = None
    exacerbating: Optional[str] = None
    severity: Optional[int] = None


class AIAnalysisResult(BaseModel):
    chief_complaint: Optional[str] = None
    extracted_slots: SocratesExtractedSlots
    detected_red_flags: List[str] = Field(default_factory=list)
    suggested_follow_up: Optional[str] = None
    confidence_score: float = 0.85


def _matches_any(patterns: List[str], text: str) -> bool:
    t = text.lower()
    for p in patterns:
        if any(ord(c) > 127 for c in p):
            if p.lower() in t:
                return True
        else:
            if re.search(p, t):
                return True
    return False


class AIClinicalAnalyzer:
    """
    AI Clinical Analyzer for extracting structured SOCRATES symptom parameters
    from unstructured patient voice transcripts or free-text descriptions.
    Supports English, Hindi, and Marathi clinical terminology.
    """

    # Anatomical Site keywords
    SITE_PATTERNS = {
        "Chest": [
            r"\bchest\b", r"\bsternum\b", r"\bheart\b", "छाती", "सीना", "छातीत", "हार्ट"
        ],
        "Head": [
            r"\bhead\b", r"\btemple\b", r"\bforehead\b", "सिर", "माथा", "डोके", "डोकेदुखी"
        ],
        "Abdomen Upper": [
            r"\bupper abdomen\b", r"\bepigastr\w*", r"\bstomach\b", "पेट के ऊपर", "पोटाच्या वर", "जठर", "पेट"
        ],
        "Abdomen Lower": [
            r"\blower abdomen\b", r"\bpelvi\w*", r"\bbelly\b", "पेट के नीचे", "पोटाच्या खाली"
        ],
        "Lower Back": [
            r"\bback\b", r"\blower back\b", r"\bspine\b", "कमर", "पीठ", "कंबर", "पाठीत"
        ],
        "Joints": [
            r"\bjoint\b", r"\bknee\b", r"\bshoulder\b", "हाथ", "पैर", "जोड़", "गुडघा", "सांधे"
        ],
    }

    # Onset keywords
    ONSET_PATTERNS = {
        "Sudden acute": [
            r"\bsudden\b", r"\bacute\b", r"\ball of a sudden\b", "अचानक", "एकाएक", "झटक्यात"
        ],
        "Gradual": [
            r"\bgradual\b", r"\bslowly\b", r"\bworsen\w*\b", "धीरे-धीरे", "हळूहळू"
        ],
        "Chronic": [
            r"\bchronic\b", r"\blong time\b", r"\bmonths\b", "काफी समय से", "बऱ्याच दिवसांपासून", "पुराना"
        ],
    }

    # Character keywords
    CHARACTER_PATTERNS = {
        "Sharp stabbing": [
            r"\bsharp\b", r"\bstabbing\b", r"\bpiercing\b", "चुभने", "तेज चुभन", "टोचल्यासारखे"
        ],
        "Dull ache": [
            r"\bdull\b", r"\bheavy\b", r"\baching\b", "लगातार भारीपन", "हलका", "सतत दुखणे"
        ],
        "Burning": [
            r"\bburning\b", r"\bheartburn\b", r"\bacidity\b", "जलन", "एसिडिटी", "जळजळ"
        ],
        "Throbbing": [
            r"\bthrobbing\b", r"\bpulsing\b", r"\bpounding\b", "धड़कने", "धडधड", "ठसठस"
        ],
        "Colicky cramping": [
            r"\bcramp\w*\b", r"\bspasm\b", r"\bcolic\b", "ऐंठन", "मरोड़", "मुरडा", "पेटके"
        ],
    }

    # Radiation keywords
    RADIATION_PATTERNS = {
        "Left arm / jaw": [
            r"\bleft arm\b", r"\bjaw\b", r"\bneck\b", "बाएं हाथ", "गर्दन", "जबड़े", "डावा हात", "मान", "जबडा"
        ],
        "Back": [
            r"\bradiat\w* to back\b", r"\bspreads to back\b", "पीठ की तरफ", "पाठीच्या दिशेने"
        ],
        "Groin": [
            r"\bgroin\b", r"\bthigh\b", "जांघ", "मांडी"
        ],
    }

    # Associated symptoms
    ASSOCIATED_PATTERNS = {
        "Shortness of breath": [
            r"\bbreathless\w*\b", r"\bshortness of breath\b", r"\bdyspnea\b",
            "सांस फूलना", "सांस लेने में कठिनाई", "सांस फूल", "दम लागणे", "श्वास घेण्यास त्रास"
        ],
        "Cold sweating": [
            r"\bsweat\w*\b", r"\bdiaphoresis\b", r"\bcold sweat\b",
            "पसीना", "ठंडा पसीना", "घाम"
        ],
        "Nausea / Vomiting": [
            r"\bnausea\b", r"\bvomit\w*\b", "उल्टी", "मिचली", "मळमळ"
        ],
        "Dizziness": [
            r"\bdizz\w*\b", r"\bgiddiness\b", r"\bfainting\b", "चक्कर", "बेहोशी"
        ],
    }

    # Timing patterns
    TIMING_PATTERNS = {
        "Continuous": [
            r"\bcontinuous\b", r"\bconstant\b", r"\ball day\b", "लगातार", "सतत"
        ],
        "Intermittent": [
            r"\bintermittent\b", r"\bcomes and goes\b", r"\bwaves\b", "रुक-रुक कर", "अधूनमधून"
        ],
        "Worse after meals": [
            r"\bafter food\b", r"\bafter eating\b", r"\bpostprandial\b", "खाना खाने के बाद", "जेवणानंतर"
        ],
        "Worse at night": [
            r"\bat night\b", r"\bnocturnal\b", r"\bnight\b", "रात में", "रात्री"
        ],
    }

    # Exacerbating patterns
    EXACERBATING_PATTERNS = {
        "Worse with exertion": [
            r"\bwalking\b", r"\bexertion\b", r"\bclimbing\b", r"\bstairs\b",
            "चलने पर", "मेहनत करने पर", "चालताना"
        ],
        "Worse with deep breath": [
            r"\bdeep breath\b", r"\bcough\w*\b", r"\binspiration\b",
            "गहरी सांस", "खांसने पर", "दीर्घ श्वास"
        ],
        "Relieved by rest": [
            r"\brest\b", r"\bly\w* down\b", "आराम करने से", "विश्रांती"
        ],
        "Relieved by antacids": [
            r"\bantacid\b", r"\beno\b", r"\bdigene\b", "सिरप से आराम"
        ],
    }

    def analyze(self, text: str, language: str = "en") -> AIAnalysisResult:
        t = text.lower()

        # Extract Chief Complaint
        cc = None
        if _matches_any([r"\bpain\b", r"\bache\b", "दर्द", "दुखणे", "वेदना"], t):
            cc = "Pain"
        elif _matches_any([r"\bfever\b", r"\btemp\b", "बुखार", "ताप"], t):
            cc = "Fever"
        elif _matches_any([r"\bcough\b", r"\bcold\b", "खांसी", "खोकला"], t):
            cc = "Cough"

        slots = SocratesExtractedSlots()

        # Site
        for site_name, patterns in self.SITE_PATTERNS.items():
            if _matches_any(patterns, t):
                slots.site = site_name
                break

        # Onset
        for onset_name, patterns in self.ONSET_PATTERNS.items():
            if _matches_any(patterns, t):
                slots.onset = onset_name
                break

        # Character
        for char_name, patterns in self.CHARACTER_PATTERNS.items():
            if _matches_any(patterns, t):
                slots.character = char_name
                break

        # Radiation
        for rad_name, patterns in self.RADIATION_PATTERNS.items():
            if _matches_any(patterns, t):
                slots.radiation = rad_name
                break

        # Associations
        for assoc_name, patterns in self.ASSOCIATED_PATTERNS.items():
            if _matches_any(patterns, t):
                slots.associated.append(assoc_name)

        # Timing
        for timing_name, patterns in self.TIMING_PATTERNS.items():
            if _matches_any(patterns, t):
                slots.timing = timing_name
                break

        # Exacerbating
        for ex_name, patterns in self.EXACERBATING_PATTERNS.items():
            if _matches_any(patterns, t):
                slots.exacerbating = ex_name
                break

        # Severity number extraction
        sev_match = re.search(r"\b([1-9]|10)\s*(?:/|\s*out of\s*)\s*10\b", t)
        if sev_match:
            slots.severity = int(sev_match.group(1))
        elif any(w in t for w in ["severe", "बहुत तेज", "असहनीय", "तीव्र"]):
            slots.severity = 8
        elif any(w in t for w in ["mild", "हल्का", "हलका"]):
            slots.severity = 3
        elif any(w in t for w in ["moderate", "मध्यम"]):
            slots.severity = 5

        # Check Red Flags
        red_flags: List[str] = []
        if slots.site == "Chest":
            if slots.radiation == "Left arm / jaw":
                red_flags.append("Potential Acute Coronary Syndrome: Chest pain radiating to left arm/jaw")
            if any(a in slots.associated for a in ["Shortness of breath", "Cold sweating"]):
                red_flags.append("Critical Cardiac Warning: Chest discomfort with breathlessness or diaphoresis")
            if slots.exacerbating == "Worse with exertion":
                red_flags.append("Exertional Angina pattern detected")

        if slots.severity and slots.severity >= 9:
            red_flags.append(f"Severe excruciating pain rated {slots.severity}/10")

        # Generate intelligent follow-up question if ambiguity exists
        follow_up = None
        if slots.site == "Chest" and not slots.radiation:
            follow_up = "Does this chest pain spread or radiate to your left arm, neck, or jaw?"
        elif slots.site == "Abdomen Upper" and not slots.timing:
            follow_up = "Does this stomach pain worsen right after eating meals or during empty stomach?"
        elif not slots.severity:
            follow_up = "On a scale of 1 to 10, how intense is this pain right now?"

        return AIAnalysisResult(
            chief_complaint=cc or ("Pain" if slots.site else None),
            extracted_slots=slots,
            detected_red_flags=red_flags,
            suggested_follow_up=follow_up,
            confidence_score=0.92 if slots.site and slots.character else 0.80,
        )


ai_clinical_analyzer = AIClinicalAnalyzer()
