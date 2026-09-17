from typing import Any, Dict, List, Optional
from app.schemas.interview import ClinicalQuestion, QuestionOption, InterviewStateResponse


QUESTION_REGISTRY: Dict[str, ClinicalQuestion] = {
    # -------------------------------------------------------------
    # 1. Chief Complaint (CC)
    # -------------------------------------------------------------
    "CC_PRIMARY": ClinicalQuestion(
        id="CC_PRIMARY",
        section="CC",
        type="single_choice",
        text_en="What is your primary medical concern or symptom today?",
        text_hi="आज आपकी मुख्य स्वास्थ्य समस्या या लक्षण क्या है?",
        text_mr="आज तुमची मुख्य वैद्यकीय अडचण किंवा लक्षण काय आहे?",
        audio_prompt_en="Please tell us what is troubling you the most today.",
        audio_prompt_hi="कृपया बताएं कि आज आपको सबसे ज्यादा क्या परेशानी हो रही है।",
        audio_prompt_mr="कृपया सांगा की आज तुम्हाला सर्वात जास्त काय त्रास होत आहे.",
        isl_gloss="CHIEF COMPLAINT PROBLEM WHAT",
        isl_video_url="/assets/isl/questions/chief_complaint.mp4",
        options=[
            QuestionOption(value="Fever", label_en="Fever", label_hi="बुखार (ताप)", label_mr="ताप"),
            QuestionOption(value="Pain", label_en="Pain / Ache", label_hi="दर्द / पीड़ा", label_mr="वेदना / दुखणे"),
            QuestionOption(value="Cough", label_en="Cough & Cold", label_hi="खांसी और जुकाम", label_mr="खोकला आणि सर्दी"),
            QuestionOption(value="Breathlessness", label_en="Difficulty Breathing", label_hi="सांस लेने में तकलीफ", label_mr="श्वास घेण्यास त्रास", is_red_flag=True),
            QuestionOption(value="Abdominal", label_en="Stomach / Abdominal Ache", label_hi="पेट में दर्द", label_mr="पोटदुखी"),
            QuestionOption(value="Rash", label_en="Skin Rash / Itching", label_hi="त्वचा पर चकत्ते / खुजली", label_mr="त्वचेवर पुरळ / खाज"),
            QuestionOption(value="Other", label_en="Other Concern", label_hi="अन्य लक्षण", label_mr="इतर लक्षण"),
        ],
        can_skip=False,
    ),

    # -------------------------------------------------------------
    # 2. Fever Branch (HPI)
    # -------------------------------------------------------------
    "FEVER_DURATION": ClinicalQuestion(
        id="FEVER_DURATION",
        section="HPI",
        type="single_choice",
        text_en="How long have you had this fever?",
        text_hi="आपको यह बुखार कितने दिनों से है?",
        text_mr="हा ताप तुम्हाला किती दिवसांपासून आहे?",
        audio_prompt_en="How many days have you been running a fever?",
        audio_prompt_hi="बुखार कितने दिनों से आ रहा है?",
        audio_prompt_mr="ताप किती दिवसांपासून येत आहे?",
        isl_gloss="FEVER HOW MANY DAYS",
        isl_video_url="/assets/isl/questions/fever_duration.mp4",
        options=[
            QuestionOption(value="1 day", label_en="1 day or less", label_hi="1 दिन या कम", label_mr="1 दिवस किंवा कमी"),
            QuestionOption(value="3 days", label_en="2 to 3 days", label_hi="2 से 3 दिन", label_mr="2 ते 3 दिवस"),
            QuestionOption(value="1 week", label_en="4 to 7 days (1 week)", label_hi="4 से 7 दिन", label_mr="4 ते 7 दिवस"),
            QuestionOption(value="> 1 week", label_en="More than 1 week", label_hi="1 सप्ताह से अधिक", label_mr="1 आठवड्यापेक्षा जास्त", is_red_flag=True),
        ],
    ),
    "FEVER_GRADE": ClinicalQuestion(
        id="FEVER_GRADE",
        section="HPI",
        type="single_choice",
        text_en="How intense is the fever, and do you experience chills or shivering?",
        text_hi="बुखार कितना तेज है, और क्या ठंड या कंपकंपी लगती है?",
        text_mr="ताप किती जास्त आहे, आणि थंडी किंवा हुडहुडी भरते का?",
        isl_gloss="FEVER HIGH SHIVERING YES NO",
        options=[
            QuestionOption(value="Mild", label_en="Low-grade mild fever", label_hi="हल्का बुखार", label_mr="हलका ताप"),
            QuestionOption(value="High with chills", label_en="High fever with chills/rigors", label_hi="तेज बुखार के साथ कंपकंपी", label_mr="जास्त ताप आणि थंडी", is_red_flag=True),
            QuestionOption(value="Intermittent", label_en="Comes and goes intermittently", label_hi="रुक-रुक कर आता है", label_mr="अधूनमधून येतो"),
        ],
    ),
    "FEVER_ASSOCIATED": ClinicalQuestion(
        id="FEVER_ASSOCIATED",
        section="HPI",
        type="multi_choice",
        text_en="Do you have any of these associated symptoms along with the fever?",
        text_hi="बुखार के साथ इनमें से कौन-से अन्य लक्षण हैं?",
        text_mr="तापाबरोबर खालीलपैकी कोणती लक्षणे आहेत?",
        audio_prompt_en="Select any other symptoms that accompany the fever.",
        isl_gloss="FEVER HEADACHE BODYACHE VOMIT BLEEDING MOSQUITO",
        options=[
            QuestionOption(value="Headache", label_en="Severe Headache", label_hi="सिरदर्द", label_mr="डोकेदुखी"),
            QuestionOption(value="Body ache", label_en="Severe Body/Muscle Ache", label_hi="बदन दर्द / मांसपेशियों में दर्द", label_mr="अंगदुखी / स्नायू दुखणे"),
            QuestionOption(value="Mosquito exposure", label_en="Mosquito bites / exposure in area", label_hi="मच्छर काटने का इतिहास", label_mr="डासांचा प्रादुर्भाव"),
            QuestionOption(value="Vomiting", label_en="Persistent Nausea / Vomiting", label_hi="उल्टी या मिचली", label_mr="उलटी किंवा मळमळ"),
            QuestionOption(value="Bleeding / Petechiae", label_en="Bleeding gums, nose, or red spots", label_hi="मसूड़ों या नाक से खून / लाल चकत्ते", label_mr="हिरड्यांतून रक्त किंवा लाल पुरळ", is_red_flag=True),
            QuestionOption(value="Altered sensorium", label_en="Confusion or excessive drowsiness", label_hi="बेहोशी या अत्यधिक सुस्ती", label_mr="गोंधळ किंवा सुस्ती", is_red_flag=True),
            QuestionOption(value="None", label_en="None of the above", label_hi="इनमें से कोई नहीं", label_mr="यापैकी काही नाही"),
        ],
    ),

    # -------------------------------------------------------------
    # 3. Pain Branch (SOCRATES)
    # -------------------------------------------------------------
    "SOCRATES_SITE": ClinicalQuestion(
        id="SOCRATES_SITE",
        section="SOCRATES",
        type="single_choice",
        text_en="[Site] Where exactly is your pain located?",
        text_hi="[स्थान] दर्द मुख्य रूप से शरीर के किस हिस्से में है?",
        text_mr="[स्थान] वेदना नेमकी शरीराच्या कोणत्या भागात आहे?",
        audio_prompt_en="Please select or point to the exact location of your pain.",
        audio_prompt_hi="कृपया बताएं कि दर्द शरीर के किस हिस्से में हो रहा है।",
        audio_prompt_mr="कृपया सांगा की वेदना शरीराच्या कोणत्या भागात होत आहे.",
        isl_gloss="PAIN WHERE BODY PART",
        isl_video_url="/assets/isl/questions/pain_site.mp4",
        options=[
            QuestionOption(value="Chest", label_en="Chest / Sternum", label_hi="छाती में", label_mr="छातीत", is_red_flag=True),
            QuestionOption(value="Head", label_en="Head / Temples", label_hi="सिर / माथा", label_mr="डोके"),
            QuestionOption(value="Abdomen Upper", label_en="Upper Abdomen / Epigastric", label_hi="पेट के ऊपरी भाग में", label_mr="पोटाच्या वरच्या भागात"),
            QuestionOption(value="Abdomen Lower", label_en="Lower Abdomen / Pelvic", label_hi="पेट के निचले भाग में", label_mr="पोटाच्या खालच्या भागात"),
            QuestionOption(value="Lower Back", label_en="Lower Back / Spine", label_hi="कमर / पीठ", label_mr="कंबर / पाठीत"),
            QuestionOption(value="Joints", label_en="Joints (Knees/Hands)", label_hi="जोड़ों में", label_mr="सांध्यांमध्ये"),
            QuestionOption(value="Other", label_en="Other area", label_hi="अन्य स्थान", label_mr="इतर भाग"),
        ],
    ),
    "SOCRATES_ONSET": ClinicalQuestion(
        id="SOCRATES_ONSET",
        section="SOCRATES",
        type="single_choice",
        text_en="[Onset] Did the pain start suddenly or develop gradually?",
        text_hi="[शुरुआत] क्या दर्द अचानक शुरू हुआ या धीरे-धीरे बढ़ा?",
        text_mr="[सुरुवात] वेदना अचानक सुरू झाली की हळूहळू वाढली?",
        audio_prompt_en="Did this pain come on suddenly out of nowhere, or did it build up gradually?",
        audio_prompt_hi="क्या यह दर्द अचानक शुरू हुआ या धीरे-धीरे बढ़ा?",
        audio_prompt_mr="वेदना अचानक सुरू झाली की हळूहळू वाढली?",
        options=[
            QuestionOption(value="Sudden acute", label_en="Sudden (acute onset)", label_hi="अचानक तेज शुरुआत", label_mr="अचानक तीव्र सुरुवात"),
            QuestionOption(value="Gradual", label_en="Gradual / slowly worsening", label_hi="धीरे-धीरे बढ़ा", label_mr="हळूहळू वाढणारी"),
            QuestionOption(value="Chronic", label_en="Long-standing / recurring", label_hi="काफी समय से पुराना", label_mr="बऱ्याच दिवसांपासून जुनाट"),
        ],
    ),
    "SOCRATES_CHARACTER": ClinicalQuestion(
        id="SOCRATES_CHARACTER",
        section="SOCRATES",
        type="single_choice",
        text_en="[Character] What does the pain feel like?",
        text_hi="[प्रकृति] दर्द किस प्रकार का महसूस होता है?",
        text_mr="[स्वरूप] वेदनेचे स्वरूप कसे वाटते?",
        audio_prompt_en="How does the pain feel? Is it sharp, dull, burning, throbbing, or cramping?",
        audio_prompt_hi="दर्द कैसा महसूस होता है? क्या यह तेज चुभने जैसा, भारीपन, जलन जैसा, या मरोड़ जैसा है?",
        audio_prompt_mr="वेदना कशी जाणवते? तीक्ष्ण टोचल्यासारखी, सतत दुखणारी, जळजळल्यासारखी, की पेटके आल्यासारखी?",
        options=[
            QuestionOption(value="Sharp stabbing", label_en="Sharp / Stabbing / Piercing", label_hi="तेज चुभने जैसा", label_mr="तीक्ष्ण टोचल्यासारखे"),
            QuestionOption(value="Dull ache", label_en="Dull continuous ache", label_hi="हल्का लगातार भारीपन/दर्द", label_mr="सतत जाणवणारे दुखणे"),
            QuestionOption(value="Burning", label_en="Burning / Heat sensation", label_hi="जलन जैसा", label_mr="जळजळल्यासारखे"),
            QuestionOption(value="Throbbing", label_en="Throbbing / Pulsing", label_hi="धड़कने जैसा / स्पंदन", label_mr="धडधडणारे"),
            QuestionOption(value="Colicky cramping", label_en="Cramping / Colicky spasms", label_hi="ऐंठन या मरोड़ जैसा", label_mr="मुरडा / पेटके"),
        ],
    ),
    "SOCRATES_RADIATION": ClinicalQuestion(
        id="SOCRATES_RADIATION",
        section="SOCRATES",
        type="single_choice",
        text_en="[Radiation] Does the pain spread or radiate to any other body part?",
        text_hi="[फैलाव] क्या यह दर्द किसी अन्य हिस्से में फैलता है?",
        text_mr="[प्रसार] ही वेदना इतर कोणत्याही भागात पसरते का?",
        audio_prompt_en="Does this pain spread or travel anywhere else, such as to your left arm, neck, or back?",
        audio_prompt_hi="क्या यह दर्द कहीं और फैलता है, जैसे बाएं हाथ, गर्दन या पीठ में?",
        audio_prompt_mr="ही वेदना इतर कुठे पसरते का, जसे की डावा हात, मान किंवा पाठीत?",
        options=[
            QuestionOption(value="Left arm / jaw", label_en="Spreads to left arm, neck, or jaw", label_hi="बाएं हाथ, गर्दन या जबड़े में", label_mr="डावा हात, मान किंवा जबड्यात", is_red_flag=True),
            QuestionOption(value="Back", label_en="Spreads through to the back", label_hi="पीठ की तरफ फैलता है", label_mr="पाठीच्या दिशेने"),
            QuestionOption(value="Groin", label_en="Radiates down to groin", label_hi="जांघ या पेडू की ओर", label_mr="मांडी किंवा जांघेकडे"),
            QuestionOption(value="None", label_en="Does not radiate / stays in one spot", label_hi="कहीं नहीं फैलता, एक ही जगह है", label_mr="पसरत नाही, एकाच जागी राहते"),
        ],
    ),
    "SOCRATES_ASSOCIATED": ClinicalQuestion(
        id="SOCRATES_ASSOCIATED",
        section="SOCRATES",
        type="multi_choice",
        text_en="[Associated Symptoms] Are you experiencing any other symptoms with this pain?",
        text_hi="[संबंधित लक्षण] क्या इस दर्द के साथ इनमें से कोई अन्य लक्षण भी हैं?",
        text_mr="[संबंधित लक्षणे] या वेदनेबरोबर खालीलपैकी कोणती इतर लक्षणे जाणवतात?",
        audio_prompt_en="Select any other symptoms that accompany this pain, such as shortness of breath or cold sweat.",
        audio_prompt_hi="क्या इस दर्द के साथ सांस फूलना, ठंडा पसीना, या उल्टी जैसे अन्य लक्षण भी हैं?",
        audio_prompt_mr="या वेदनेसोबत श्वास घेण्यास त्रास, थंड घाम, किंवा मळमळ यांसारखी इतर लक्षणे आहेत का?",
        options=[
            QuestionOption(value="Shortness of breath", label_en="Difficulty breathing / Shortness of breath", label_hi="सांस फूलना या सांस लेने में कठिनाई", label_mr="दम लागणे किंवा श्वास घेण्यास त्रास", is_red_flag=True),
            QuestionOption(value="Cold sweating", label_en="Profuse cold sweating (diaphoresis)", label_hi="ठंडा पसीना आना", label_mr="थंड घाम येणे", is_red_flag=True),
            QuestionOption(value="Nausea / Vomiting", label_en="Nausea or vomiting", label_hi="उल्टी या मिचली", label_mr="मळमळ किंवा उलटी"),
            QuestionOption(value="Dizziness", label_en="Dizziness / Lightheadedness", label_hi="चक्कर आना", label_mr="चक्कर येणे"),
            QuestionOption(value="None", label_en="No other associated symptoms", label_hi="कोई अन्य लक्षण नहीं", label_mr="इतर कोणतेही लक्षण नाही"),
        ],
    ),
    "SOCRATES_TIMING": ClinicalQuestion(
        id="SOCRATES_TIMING",
        section="SOCRATES",
        type="single_choice",
        text_en="[Timing] How does the pain behave over time?",
        text_hi="[समय और स्वरूप] यह दर्द समय के साथ कैसा रहता है?",
        text_mr="[वेळ आणि स्वरूप] ही वेदना वेळेनुसार कशी जाणवते?",
        audio_prompt_en="Does this pain stay continuously, come in waves, or occur mostly after meals or at night?",
        audio_prompt_hi="क्या यह दर्द लगातार बना रहता है, रुक-रुक कर लहरों की तरह आता है, या खाना खाने के बाद होता है?",
        audio_prompt_mr="ही वेदना सतत राहते, लाटांसारखी अधूनमधून येते, की जेवणानंतर किंवा रात्री जास्त होते?",
        isl_gloss="PAIN TIMING CONTINUOUS OR WAVES",
        options=[
            QuestionOption(value="Continuous", label_en="Continuous / Constant pain", label_hi="लगातार बना रहता है", label_mr="सतत जाणवणारी वेदना"),
            QuestionOption(value="Intermittent", label_en="Intermittent / Comes in waves", label_hi="रुक-रुक कर आता है (लहरों जैसा)", label_mr="अधूनमधून लाटांसारखे येते"),
            QuestionOption(value="Worse after meals", label_en="Worse after eating / meals", label_hi="खाना खाने के बाद अधिक", label_mr="जेवणानंतर जास्त होते"),
            QuestionOption(value="Worse at night", label_en="Worse at night or early morning", label_hi="रात में या सुबह अधिक", label_mr="रात्री किंवा पहाटे जास्त"),
        ],
    ),
    "SOCRATES_EXACERBATING": ClinicalQuestion(
        id="SOCRATES_EXACERBATING",
        section="SOCRATES",
        type="single_choice",
        text_en="[Factors] What makes the pain worse or better?",
        text_hi="[प्रभावित करने वाले कारक] किस गतिविधि से दर्द बढ़ता है या आराम मिलता है?",
        text_mr="[प्रभावित करणारे घटक] कशामुळे वेदना वाढते किंवा आराम मिळतो?",
        audio_prompt_en="Please tell us what makes the pain worse or what gives you relief.",
        audio_prompt_hi="कृपया बताएं कि क्या करने से दर्द बढ़ता है या आराम मिलता है।",
        audio_prompt_mr="कृपया सांगा की कशामुळे वेदना वाढते किंवा आराम मिळतो.",
        isl_gloss="PAIN BETTER OR WORSE WHAT",
        options=[
            QuestionOption(value="Worse with exertion", label_en="Worsens with walking or physical exertion", label_hi="चलने या मेहनत करने पर बढ़ता है", label_mr="चालण्याने किंवा श्रमाने वाढते", is_red_flag=True),
            QuestionOption(value="Worse with deep breath", label_en="Worsens with deep breathing or coughing", label_hi="गहरी सांस लेने या खांसने पर बढ़ता है", label_mr="दीर्घ श्वास किंवा खोकल्याने वाढते"),
            QuestionOption(value="Relieved by rest", label_en="Relieved by lying down or resting", label_hi="आराम करने या लेटने से घटता है", label_mr="विश्रांती घेतल्याने आराम मिळतो"),
            QuestionOption(value="Relieved by antacids", label_en="Relieved by antacids, food, or water", label_hi="एंटासिड दवा या पानी से आराम", label_mr="अँटासिड किंवा पाण्याने आराम"),
            QuestionOption(value="No specific trigger", label_en="No specific trigger / Unchanged", label_hi="कोई विशेष बदलाव नहीं", label_mr="कोणताही विशेष बदल नाही"),
        ],
    ),
    "SOCRATES_SEVERITY": ClinicalQuestion(
        id="SOCRATES_SEVERITY",
        section="SOCRATES",
        type="scale",
        min_value=1,
        max_value=10,
        text_en="[Severity] On a scale of 1 to 10, how severe is your pain? (1 = Mild, 10 = Worst imaginable)",
        text_hi="[तीव्रता] 1 से 10 के पैमाने पर दर्द कितना गंभीर है? (1 = हल्का, 10 = असहनीय)",
        text_mr="[तीव्रता] 1 ते 10 च्या प्रमाणात वेदना किती तीव्र आहे? (1 = हलकी, 10 = असह्य)",
        audio_prompt_en="On a scale of 1 to 10, how severe is your pain right now?",
        audio_prompt_hi="1 से 10 के पैमाने पर आपका दर्द अभी कितना तेज है?",
        audio_prompt_mr="1 ते 10 च्या प्रमाणात तुमची वेदना सध्या किती तीव्र आहे?",
        isl_gloss="PAIN SEVERITY NUMBER 1 TO 10",
    ),

    # -------------------------------------------------------------
    # 4. Past Medical & Surgical History (PMH / PSH)
    # -------------------------------------------------------------
    "PMH_CONDITIONS": ClinicalQuestion(
        id="PMH_CONDITIONS",
        section="PMH",
        type="multi_choice",
        text_en="Do you have any existing long-term medical conditions?",
        text_hi="क्या आपको पहले से इनमें से कोई बीमारी है?",
        text_mr="तुम्हाला आधीपासून खालीलपैकी कोणताही आजार आहे का?",
        audio_prompt_en="Do you have any existing chronic illnesses like diabetes, high blood pressure, or asthma?",
        audio_prompt_hi="क्या आपको पहले से शुगर, बीपी, या दमे जैसी कोई पुरानी बीमारी है?",
        audio_prompt_mr="तुम्हाला आधीपासून मधुमेह, उच्च रक्तदाब किंवा दमा यांसारखा कोणताही जुनाट आजार आहे का?",
        options=[
            QuestionOption(value="Diabetes", label_en="Diabetes / High Blood Sugar", label_hi="मधुमेह (डायबिटीज)", label_mr="मधुमेह"),
            QuestionOption(value="Hypertension", label_en="Hypertension / High BP", label_hi="उच्च रक्तचाप (हाई बीपी)", label_mr="उच्च रक्तदाब (बीपी)"),
            QuestionOption(value="Heart Disease", label_en="Heart Disease / Prior Attack", label_hi="हृदय रोग", label_mr="हृदयरोग"),
            QuestionOption(value="Asthma", label_en="Asthma / Respiratory issues", label_hi="अस्थमा / दमा", label_mr="दमा"),
            QuestionOption(value="None", label_en="No chronic illnesses", label_hi="कोई पुरानी बीमारी नहीं", label_mr="कोणताही जुनाट आजार नाही"),
        ],
    ),

    # -------------------------------------------------------------
    # 5. Medications & Allergies
    # -------------------------------------------------------------
    "MEDICATIONS_CURRENT": ClinicalQuestion(
        id="MEDICATIONS_CURRENT",
        section="MEDS",
        type="multi_choice",
        text_en="Are you taking any daily medicines or recently taken fever/pain relievers?",
        text_hi="क्या आप नियमित रूप से कोई दवाई ले रहे हैं या हाल ही में कोई दवा ली है?",
        text_mr="तुम्ही सध्या कोणती नियमित औषधे घेत आहात का किंवा नुकतेच काही औषध घेतले आहे का?",
        audio_prompt_en="Are you currently taking any regular medications or have you taken paracetamol recently?",
        audio_prompt_hi="क्या आप नियमित रूप से कोई दवाई लेते हैं या हाल ही में कोई गोली ली है?",
        audio_prompt_mr="तुम्ही सध्या कोणती नियमित औषधे घेता किंवा नुकतीच काही गोळी घेतली आहे का?",
        options=[
            QuestionOption(value="Paracetamol", label_en="Paracetamol / Fever tablet", label_hi="पैरासिटामोल (बुखार की दवा)", label_mr="पॅरासिटामॉल (तापाची गोळी)"),
            QuestionOption(value="BP medication", label_en="Blood Pressure medication", label_hi="बीपी की दवा", label_mr="बीपीचे औषध"),
            QuestionOption(value="Diabetes medication", label_en="Sugar / Diabetes pills or insulin", label_hi="शुगर / इंसुलिन", label_mr="मधुमेहाची गोळी किंवा इन्सुलिन"),
            QuestionOption(value="Antibiotics", label_en="Antibiotics course", label_hi="एंटीबायोटिक", label_mr="अँटिबायोटिक"),
            QuestionOption(value="None", label_en="None / Not taking any medicines", label_hi="कोई दवा नहीं", label_mr="कोणतेही औषध नाही"),
        ],
    ),
    "ALLERGIES_KNOWN": ClinicalQuestion(
        id="ALLERGIES_KNOWN",
        section="ALLERGIES",
        type="single_choice",
        text_en="Do you have any known allergies to medicines, foods, or injections?",
        text_hi="क्या आपको किसी दवा, खाने या इंजेक्शन से कोई एलर्जी है?",
        text_mr="तुम्हाला कोणत्याही औषधाची, अन्नाची किंवा इंजेक्शनची ॲलर्जी आहे का?",
        audio_prompt_en="Do you have any known allergies to medicines like penicillin, foods, or injections?",
        audio_prompt_hi="क्या आपको किसी दवा, भोजन या इंजेक्शन से कोई ज्ञात एलर्जी है?",
        audio_prompt_mr="तुम्हाला कोणत्याही औषधाची, अन्नाची किंवा इंजेक्शनची ॲलर्जी आहे का?",
        options=[
            QuestionOption(value="None", label_en="No known allergies (NKDA)", label_hi="कोई ज्ञात एलर्जी नहीं", label_mr="कोणतीही ॲलर्जी नाही"),
            QuestionOption(value="Penicillin", label_en="Penicillin / Antibiotic allergy", label_hi="पेनिसिलिन से एलर्जी", label_mr="पेनिसिलिन ॲलर्जी", is_red_flag=True),
            QuestionOption(value="Sulfa", label_en="Sulfa drugs", label_hi="सल्फा दवाएं", label_mr="सल्फा औषधे"),
            QuestionOption(value="Other", label_en="Other drug or food allergy", label_hi="अन्य किसी दवा या भोजन से", label_mr="इतर ॲलर्जी"),
        ],
    ),

    # -------------------------------------------------------------
    # 6. AYUSH-Aware History
    # -------------------------------------------------------------
    "AYUSH_REMEDIES": ClinicalQuestion(
        id="AYUSH_REMEDIES",
        section="AYUSH",
        type="multi_choice",
        text_en="Have you consumed any Ayurvedic, Homeopathic, or traditional herbal remedies for this condition?",
        text_hi="क्या आपने इस बीमारी के लिए कोई आयुर्वेदिक, होम्योपैथिक या काढ़ा/घरेलू उपाय लिया है?",
        text_mr="या त्रासासाठी तुम्ही कोणतेही आयुर्वेदिक, होमिओपॅथिक किंवा काढा/घरगुती उपाय घेतले आहेत का?",
        audio_prompt_en="Have you taken any Ayurvedic kadha, homeopathic pills, or traditional herbal remedies?",
        audio_prompt_hi="क्या आपने इस बीमारी के लिए कोई आयुर्वेदिक काढ़ा, गिलोय, या होम्योपैथिक दवा ली है?",
        audio_prompt_mr="तुम्ही या त्रासासाठी कोणताही आयुर्वेदिक काढा, गुळवेल किंवा होमिओपॅथिक औषध घेतले आहे का?",
        options=[
            QuestionOption(value="Herbal kadha", label_en="Herbal decoction (Kadha / Giloy)", label_hi="काढ़ा या गिलोय स्वरस", label_mr="काढा किंवा गुळवेल"),
            QuestionOption(value="Ayurvedic churna", label_en="Ayurvedic churna / tablets", label_hi="आयुर्वेदिक चूर्ण या गोलियां", label_mr="आयुर्वेदिक चूर्ण"),
            QuestionOption(value="Homeopathy", label_en="Homeopathic pills", label_hi="होम्योपैथिक गोलियां", label_mr="होमिओपॅथिक गोळ्या"),
            QuestionOption(value="None", label_en="None", label_hi="कोई पारंपरिक उपाय नहीं", label_mr="काहीही नाही"),
        ],
    ),
}


class DialogueManager:
    """
    Stateful clinical dialogue manager directing adaptive question sequences
    based on chief complaint, symptom progression, and deterministic safety checks.
    """

    def __init__(self):
        self.sessions: Dict[str, Dict[str, Any]] = {}

    def get_or_create_session(self, encounter_id: str, language: str = "en") -> Dict[str, Any]:
        if encounter_id not in self.sessions:
            self.sessions[encounter_id] = {
                "encounter_id": encounter_id,
                "language": language,
                "current_section": "CC",
                "current_question_id": "CC_PRIMARY",
                "answers": {},
                "red_flags": [],
                "history": [],
                "is_completed": False,
            }
        return self.sessions[encounter_id]

    def _determine_next_question(self, session: Dict[str, Any]) -> Optional[str]:
        answers = session.get("answers", {})

        # If CC not answered yet
        if "CC_PRIMARY" not in answers:
            return "CC_PRIMARY"

        cc = answers.get("CC_PRIMARY")

        # Fever Branch
        if cc == "Fever":
            if "FEVER_DURATION" not in answers:
                return "FEVER_DURATION"
            if "FEVER_GRADE" not in answers:
                return "FEVER_GRADE"
            if "FEVER_ASSOCIATED" not in answers:
                return "FEVER_ASSOCIATED"

        # Pain Branch (SOCRATES)
        elif cc in ("Pain", "Abdominal", "Chest", "Headache"):
            if "SOCRATES_SITE" not in answers:
                return "SOCRATES_SITE"
            if "SOCRATES_ONSET" not in answers:
                return "SOCRATES_ONSET"
            if "SOCRATES_CHARACTER" not in answers:
                return "SOCRATES_CHARACTER"
            if "SOCRATES_RADIATION" not in answers:
                return "SOCRATES_RADIATION"
            if "SOCRATES_ASSOCIATED" not in answers:
                return "SOCRATES_ASSOCIATED"
            if "SOCRATES_TIMING" not in answers:
                return "SOCRATES_TIMING"
            if "SOCRATES_EXACERBATING" not in answers:
                return "SOCRATES_EXACERBATING"
            if "SOCRATES_SEVERITY" not in answers:
                return "SOCRATES_SEVERITY"

        # Common clinical history sections
        if "PMH_CONDITIONS" not in answers:
            return "PMH_CONDITIONS"

        if "MEDICATIONS_CURRENT" not in answers:
            return "MEDICATIONS_CURRENT"

        if "ALLERGIES_KNOWN" not in answers:
            return "ALLERGIES_KNOWN"

        if "AYUSH_REMEDIES" not in answers:
            return "AYUSH_REMEDIES"

        # All questions completed
        return None

    def _check_red_flags(self, session: Dict[str, Any]) -> List[str]:
        answers = session.get("answers", {})
        red_flags: List[str] = []

        # Rule 1: Chest pain with dyspnea, radiation, or exertion
        pain_site = answers.get("SOCRATES_SITE")
        pain_rad = answers.get("SOCRATES_RADIATION")
        pain_assoc = answers.get("SOCRATES_ASSOCIATED", [])
        pain_exac = answers.get("SOCRATES_EXACERBATING")

        if pain_site == "Chest":
            if any(item in pain_assoc for item in ["Shortness of breath", "Cold sweating"]):
                red_flags.append("Acute chest discomfort with respiratory compromise or cold diaphoresis")
            if pain_rad == "Left arm / jaw":
                red_flags.append("Chest pain radiating to left arm, neck, or jaw")
            if pain_exac == "Worse with exertion":
                red_flags.append("Exertional chest discomfort concerning for myocardial ischemia")

        # Rule 2: Fever with bleeding or altered sensorium
        fever_assoc = answers.get("FEVER_ASSOCIATED", [])
        if "Bleeding / Petechiae" in fever_assoc:
            red_flags.append("Febrile illness accompanied by active bleeding signs or petechial rash")
        if "Altered sensorium" in fever_assoc:
            red_flags.append("Fever with altered sensorium or excessive lethargy")

        # Rule 3: High pain severity
        severity = answers.get("SOCRATES_SEVERITY")
        if isinstance(severity, (int, float)) and severity >= 9:
            red_flags.append(f"Severe excruciating pain intensity ({severity}/10)")

        # Rule 4: Prolonged fever with high rigors
        if answers.get("FEVER_DURATION") == "> 1 week" and answers.get("FEVER_GRADE") == "High with chills":
            red_flags.append("Prolonged high-grade fever exceeding 7 days with rigors")

        return red_flags

    def submit_answer(
        self,
        encounter_id: str,
        question_id: str,
        answer_value: Any,
        input_channel: str = "touch",
        confidence: float = 1.0,
    ) -> InterviewStateResponse:
        session = self.get_or_create_session(encounter_id)
        session["answers"][question_id] = answer_value

        # Record audit item
        session["history"].append({
            "question_id": question_id,
            "value": answer_value,
            "input_channel": input_channel,
            "confidence": confidence,
        })

        # Evaluate deterministic safety red flags
        session["red_flags"] = self._check_red_flags(session)

        # Determine next question
        next_qid = self._determine_next_question(session)
        session["current_question_id"] = next_qid

        if next_qid is None:
            session["is_completed"] = True
            session["current_section"] = "COMPLETE"
            current_q = None
        else:
            session["is_completed"] = False
            current_q = QUESTION_REGISTRY.get(next_qid)
            if current_q:
                session["current_section"] = current_q.section

        return self.get_state(encounter_id)

    def get_state(self, encounter_id: str) -> InterviewStateResponse:
        session = self.get_or_create_session(encounter_id)
        current_qid = session.get("current_question_id")
        current_q = QUESTION_REGISTRY.get(current_qid) if current_qid else None

        answers = session.get("answers", {})
        answered_count = len(answers)
        total_steps = max(answered_count + (1 if current_q else 0), 6)

        missing_fields = []
        if "CC_PRIMARY" not in answers:
            missing_fields.append("chief_complaint")
        if "MEDICATIONS_CURRENT" not in answers:
            missing_fields.append("medications")
        if "ALLERGIES_KNOWN" not in answers:
            missing_fields.append("allergies")

        return InterviewStateResponse(
            encounter_id=encounter_id,
            current_section=session.get("current_section", "CC"),
            current_step=answered_count + 1 if current_q else answered_count,
            total_estimated_steps=total_steps,
            is_completed=session.get("is_completed", False),
            current_question=current_q,
            answers=answers,
            red_flags=session.get("red_flags", []),
            missing_fields=missing_fields,
        )


dialogue_manager = DialogueManager()
