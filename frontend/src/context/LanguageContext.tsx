import React, { createContext, useContext, useState } from 'react';

export type LanguageCode = 'en' | 'hi' | 'mr';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  native: string;
  speechLocale: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', native: 'English', speechLocale: 'en-IN' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी', speechLocale: 'hi-IN' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', speechLocale: 'mr-IN' },
];

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Header & Navigation
    'app.title': 'MediKiosk',
    'app.subtitle': 'First-Mile Clinical Intake System',
    'nav.kiosk': 'Patient Kiosk',
    'nav.doctor': 'Doctor Dashboard',
    'nav.login': 'Gov ID Login',
    'nav.logout': 'Logout',
    'nav.connected': 'Live',
    'nav.disconnected': 'Offline',

    // Home Page
    'home.heroBadge': 'Ayushman Bharat Digital Health Intake',
    'home.heroTitle': 'Intelligent Clinical Case-Taking with Multimodal Accessibility',
    'home.heroSubtitle': 'MediKiosk captures patient medical history through Touch, Multilingual Voice, Indian Sign Language (ISL), and Document Digitization into a structured, clinician-verified health record.',
    'home.btnGovLogin': 'Government Health ID Login (ABHA / HPR)',
    'home.btnSeedDemo': 'Load Clinical Demo Encounters',
    'home.kioskCardTitle': 'Patient Intake Kiosk',
    'home.kioskCardDesc': 'Designed for accessible case taking with audio guidance, symptom severity mapping, sign language support, and document digitization.',
    'home.kioskCardBtn': 'Launch Patient Kiosk',
    'home.doctorCardTitle': 'Doctor Clinical Dashboard',
    'home.doctorCardDesc': 'Clinical decision workspace with red-flag detection, field-by-field verification, longitudinal history, and digital health export.',
    'home.doctorCardBtn': 'Open Doctor Dashboard',
    'home.voiceFeature': 'Multilingual Voice Dictation',
    'home.signFeature': 'Sign Language Assistance',
    'home.ocrFeature': 'Medical Document Digitization',
    'home.fhirFeature': 'Digital Health Record Standards',

    // Login Page
    'login.title': 'Government Digital Health Identity Portal',
    'login.subtitle': 'Secure authentication for Citizens via ABHA and Clinicians via National Medical Commission (NMC).',
    'login.tabPatient': 'Citizen / Patient (ABHA)',
    'login.tabDoctor': 'Doctor / Clinician (HPR / NMC)',
    'login.abhaHeading': 'Ayushman Bharat Health Account (ABHA) Login',
    'login.abhaSubheading': 'Official Citizen Identification & Consent Verification',
    'login.abhaInputLabel': 'Enter 14-Digit ABHA Number or ABHA Address',
    'login.requestOtpBtn': 'Request OTP via ABDM Gateway',
    'login.consentHeading': 'Mandatory Patient Health Data Consent (ABDM & DPDP Act 2023)',
    'login.consentSub': 'Please review and accept official health information sharing terms to proceed.',
    'login.consent1': '1. Clinical Purpose: Information is collected solely for triage and examination by licensed medical practitioners.',
    'login.consent2': '2. ABHA Health Linking: Encounters and prescriptions will be linked securely to your ABHA health record.',
    'login.consent3': '3. Privacy & Non-Commercial Use: Data is encrypted and will never be shared with third parties for marketing.',
    'login.consent4': '4. Patient Rights: You can view, download, or revoke data access at any time through your PHR app under the DPDP Act 2023.',
    'login.consentCheckbox': 'I have read and give my explicit consent for clinical intake and ABHA health data linking.',
    'login.consentRequiredWarning': 'Consent is mandatory. Please check the consent box to proceed.',
    'login.audioGuideBtn': 'Listen to Consent in Audio',
    'login.audioPlaying': 'Speaking Consent...',
    'login.otpHeading': 'Enter ABDM Verification OTP',
    'login.otpSub': 'A 6-digit verification code was dispatched to your registered mobile.',
    'login.otpSandboxHint': 'Sandbox Test OTP: 123456',
    'login.verifyOtpBtn': 'Verify & Complete Patient Login',
    'login.doctorHeading': 'Doctor Credential Verification (HPR / NMC)',
    'login.doctorSubheading': 'National Medical Commission Practitioner Registry',
    'login.hprInputLabel': 'Healthcare Professional ID (HPR ID)',
    'login.councilLabel': 'State Medical Council',
    'login.regNoLabel': 'Council Registration Number',
    'login.verifyDoctorBtn': 'Lookup & Dispatch Doctor OTP',

    // Kiosk
    'kiosk.stepChiefComplaint': 'Chief Complaint',
    'kiosk.stepDetails': 'Symptom Breakdown',
    'kiosk.stepDocs': 'Prescription & Report Upload',
    'kiosk.stepReview': 'Review & Confirmation',
    'kiosk.continueBtn': 'Continue',
    'kiosk.backBtn': 'Back',
    'kiosk.submitBtn': 'Submit to Doctor Queue',
    'kiosk.emergencyNotice': 'In case of severe difficulty breathing, chest pain, or trauma, contact hospital staff immediately.',
    'kiosk.selectedOption': 'Selected',
    'kiosk.painSeverityPrefix': 'Pain severity',
    'kiosk.audioGuidance': 'Voice Guidance',
    'kiosk.replayQuestion': 'Listen to question again',

    // Audio Guide Prompts
    'audio.consentSpeech': 'Under the Ayushman Bharat Digital Mission, please provide your consent to share your clinical intake history for physician review and digital health record linking. Consent is mandatory to proceed.',
    'audio.kioskWelcome': 'Welcome to MediKiosk. Please speak or select your chief symptoms.',
  },

  hi: {
    // Header & Navigation
    'app.title': 'मेडीकिओस्क',
    'app.subtitle': 'प्राथमिक क्लिनिकल केस-टेकिंग सिस्टम',
    'nav.kiosk': 'मरीज किओस्क',
    'nav.doctor': 'डॉक्टर डैशबोर्ड',
    'nav.login': 'सरकारी आईडी लॉगिन',
    'nav.logout': 'लॉगआउट',
    'nav.connected': 'सक्रिय',
    'nav.disconnected': 'ऑफलाइन',

    // Home Page
    'home.heroBadge': 'आयुष्मान भारत डिजिटल स्वास्थ्य केस-टेकिंग',
    'home.heroTitle': 'बहुभाषी व सुलभ केस-टेकिंग प्रणाली',
    'home.heroSubtitle': 'मेडीकिओस्क स्पर्श, बहुभाषी आवाज, सांकेतिक भाषा (ISL) और मेडिकल पर्ची स्कैनिंग के माध्यम से मरीज का संपूर्ण स्वास्थ्य इतिहास रिकॉर्ड करता है।',
    'home.btnGovLogin': 'सरकारी स्वास्थ्य आईडी लॉगिन (ABHA / HPR)',
    'home.btnSeedDemo': 'नमूना केस लोड करें',
    'home.kioskCardTitle': 'मरीज किओस्क (Patient Kiosk)',
    'home.kioskCardDesc': 'आवाज मार्गदर्शन, दर्द व लक्षण विश्लेषण, सांकेतिक भाषा और पर्ची स्कैनिंग के साथ सहज डिजिटल इतिहास दर्ज करें।',
    'home.kioskCardBtn': 'मरीज किओस्क शुरू करें',
    'home.doctorCardTitle': 'डॉक्टर क्लिनिकल डैशबोर्ड',
    'home.doctorCardDesc': 'सुरक्षा चेतावनियां, लक्षण सत्यापन (स्वीकार/संशोधन/अस्वीकार), पूर्व इतिहास और डिजिटल स्वास्थ्य रिकॉर्ड।',
    'home.doctorCardBtn': 'डॉक्टर डैशबोर्ड खोलें',
    'home.voiceFeature': 'बहुभाषी आवाज इनपुट',
    'home.signFeature': 'भारतीय सांकेतिक भाषा सहायता',
    'home.ocrFeature': 'मेडिकल रिपोर्ट व पर्ची डिजिटलीकरण',
    'home.fhirFeature': 'डिजिटल स्वास्थ्य रिकॉर्ड मानक',

    // Login Page
    'login.title': 'सरकारी डिजिटल स्वास्थ्य पहचान पोर्टल',
    'login.subtitle': 'नागरिकों हेतु ABHA और चिकित्सकों हेतु राष्ट्रीय चिकित्सा आयोग (NMC) द्वारा प्रमाणित लॉगिन।',
    'login.tabPatient': 'नागरिक / मरीज (ABHA)',
    'login.tabDoctor': 'डॉक्टर / चिकित्सक (HPR / NMC)',
    'login.abhaHeading': 'आयुष्मान भारत हेल्थ अकाउंट (ABHA) लॉगिन',
    'login.abhaSubheading': 'आधिकारिक नागरिक पहचान एवं सहमति सत्यापन',
    'login.abhaInputLabel': '14-अंकों का आभा (ABHA) नंबर या आभा एड्रेस दर्ज करें',
    'login.requestOtpBtn': 'ABDM गेटवे से ओटीपी भेजें',
    'login.consentHeading': 'मरीज स्वास्थ्य डेटा सहमति (ABDM एवं DPDP अधिनियम 2023)',
    'login.consentSub': 'कृपया आगे बढ़ने हेतु आधिकारिक स्वास्थ्य सूचना साझाकरण की शर्तें पढ़ें और सहमति दें।',
    'login.consent1': '1. चिकित्सीय उद्देश्य: यह जानकारी केवल अस्पताल के अधिकृत डॉक्टरों द्वारा परामर्श व जांच हेतु एकत्र की जा रही है।',
    'login.consent2': '2. आभा से जोड़ना: आपकी यह बीमारी और डॉक्टर की पर्ची आपके आभा (ABHA) स्वास्थ्य खाते से सुरक्षित जोड़ी जाएगी।',
    'login.consent3': '3. गोपनीयता: आपका डेटा पूरी तरह एन्क्रिप्टेड है और किसी भी व्यावसायिक उपयोग के लिए साझा नहीं किया जाएगा।',
    'login.consent4': '4. मरीज के अधिकार: DPDP कानून 2023 के तहत आप अपने फोन ऐप से कभी भी यह सहमति वापस ले सकते हैं।',
    'login.consentCheckbox': 'मैंने सभी शर्तें पढ़ ली हैं और क्लिनिकल जांच तथा ABHA से जोड़ने हेतु अपनी स्पष्ट सहमति देता/देती हूँ।',
    'login.consentRequiredWarning': 'आगे बढ़ने के लिए सहमति देना अनिवार्य है। कृपया चेकबॉक्स चुनें।',
    'login.audioGuideBtn': 'सहमति बोलकर सुनें (ऑडियो गाइड)',
    'login.audioPlaying': 'सहमति सुनाई जा रही है...',
    'login.otpHeading': 'ABDM सत्यापन ओटीपी दर्ज करें',
    'login.otpSub': 'आपके पंजीकृत मोबाइल नंबर पर 6-अंकों का ओटीपी भेजा गया है।',
    'login.otpSandboxHint': 'टेस्ट ओटीपी: 123456',
    'login.verifyOtpBtn': 'सत्यापित करें और लॉगिन पूरा करें',
    'login.doctorHeading': 'डॉक्टर क्रेडेंशियल सत्यापन (HPR / NMC)',
    'login.doctorSubheading': 'राष्ट्रीय चिकित्सा आयोग (NMC) डॉक्टर रजिस्ट्री',
    'login.hprInputLabel': 'हेल्थकेयर प्रोफेशनल आईडी (HPR ID)',
    'login.councilLabel': 'स्टेट मेडिकल काउंसिल',
    'login.regNoLabel': 'काउंसिल पंजीकरण संख्या',
    'login.verifyDoctorBtn': 'डॉक्टर रिकॉर्ड खोजें और ओटीपी भेजें',

    // Kiosk
    'kiosk.stepChiefComplaint': 'मुख्य बीमारी / शिकायत',
    'kiosk.stepDetails': 'लक्षणों का विवरण व अवधि',
    'kiosk.stepDocs': 'पुरानी पर्ची या टेस्ट रिपोर्ट अपलोड',
    'kiosk.stepReview': 'समीक्षा एवं पुष्टि',
    'kiosk.continueBtn': 'आगे बढ़ें',
    'kiosk.backBtn': 'पीछे जाएं',
    'kiosk.submitBtn': 'डॉक्टर को सबमिट करें',
    'kiosk.emergencyNotice': 'यदि सांस लेने में गंभीर कठिनाई, सीने में तेज दर्द या दुर्घटना हो, तो तुरंत अस्पताल कर्मियों से संपर्क करें।',
    'kiosk.selectedOption': 'चुना गया',
    'kiosk.painSeverityPrefix': 'दर्द की तीव्रता',
    'kiosk.audioGuidance': 'ध्वनि सहायता',
    'kiosk.replayQuestion': 'प्रश्न पुनः सुनें',

    // Audio Guide Prompts
    'audio.consentSpeech': 'आयुष्मान भारत डिजिटल मिशन के तहत, कृपया अपने स्वास्थ्य डेटा को डॉक्टर के साथ साझा करने की सहमति दें। सहमति के बिना आप आगे नहीं बढ़ सकते।',
    'audio.kioskWelcome': 'मेडीकिओस्क में आपका स्वागत है। कृपया अपनी मुख्य बीमारी बोलकर बताएं या चुनें।',
  },

  mr: {
    // Header & Navigation
    'app.title': 'मेडीकिओस्क',
    'app.subtitle': 'प्राथमिक क्लिनिकल केस-टेकिंग प्रणाली',
    'nav.kiosk': 'रुग्ण किओस्क',
    'nav.doctor': 'डॉक्टर डॅशबोर्ड',
    'nav.login': 'शासकीय आयडी लॉगिन',
    'nav.logout': 'लॉगआउट',
    'nav.connected': 'सक्रिय',
    'nav.disconnected': 'ऑफलाइन',

    // Home Page
    'home.heroBadge': 'आयुष्मान भारत डिजिटल आरोग्य केस-टेकिंग',
    'home.heroTitle': 'अत्याधुनिक बहुभाषिक क्लिनिकल केस-टेकिंग प्रणाली',
    'home.heroSubtitle': 'मेडीकिओस्क स्पर्श, बहुभाषिक आवाज, भारतीय सांकेतिक भाषा (ISL) आणि वैद्यकीय कागदपत्र स्कॅनिंगद्वारे रुग्णाचा संपूर्ण इतिहास नोंदवते.',
    'home.btnGovLogin': 'शासकीय आरोग्य आयडी लॉगिन (ABHA / HPR)',
    'home.btnSeedDemo': 'डेमो रुग्ण माहिती लोड करा',
    'home.kioskCardTitle': 'रुग्ण किओस्क (Patient Kiosk)',
    'home.kioskCardDesc': 'आवाज मार्गदर्शन, लक्षण विश्लेषण, सांकेतिक भाषा आणि प्रिस्क्रिप्शन स्कॅनिंगसह सोपे डिजिटल केस-टेकिंग.',
    'home.kioskCardBtn': 'रुग्ण किओस्क सुरू करा',
    'home.doctorCardTitle': 'डॉक्टर क्लिनिकल डॅशबोर्ड',
    'home.doctorCardDesc': 'धोकादायक लक्षणे अलर्ट, घटक पडताळणी (स्वीकार/बदल/नाकार), रुग्ण इतिहास आणि डिजिटल रेकॉर्ड.',
    'home.doctorCardBtn': 'डॉक्टर डॅशबोर्ड उघडा',
    'home.voiceFeature': 'बहुभाषिक आवाज इनपुट',
    'home.signFeature': 'सांकेतिक भाषा सहाय्य',
    'home.ocrFeature': 'वैद्यकीय अहवाल स्कॅनिंग',
    'home.fhirFeature': 'डिजिटल आरोग्य रेकॉर्ड मानके',

    // Login Page
    'login.title': 'शासकीय डिजिटल आरोग्य ओळख पोर्टल',
    'login.subtitle': 'नागरिकांसाठी ABHA आणि डॉक्टरांसाठी राष्ट्रीय वैद्यकीय आयोग (NMC) द्वारे प्रमाणित लॉगिन.',
    'login.tabPatient': 'नागरिक / रुग्ण (ABHA)',
    'login.tabDoctor': 'डॉक्टर / वैद्यकीय व्यावसायिक (HPR / NMC)',
    'login.abhaHeading': 'आयुष्मान भारत हेल्थ अकाउंट (ABHA) लॉगिन',
    'login.abhaSubheading': 'अधिकृत नागरिक ओळख आणि संमती पडताळणी',
    'login.abhaInputLabel': '14-अंकी आभा (ABHA) क्रमांक किंवा आभा पत्ता प्रविष्ट करा',
    'login.requestOtpBtn': 'ABDM गेटवेवरून ओटीपी पाठवा',
    'login.consentHeading': 'रुग्ण आरोग्य माहिती संमती (ABDM व DPDP कायदा 2023)',
    'login.consentSub': 'कृपया पुढे जाण्यापूर्वी अधिकृत आरोग्य माहिती सामायिक करण्याच्या अटी वाचा आणि संमती द्या.',
    'login.consent1': '1. वैद्यकीय उद्देश: ही माहिती केवळ उपस्थित अधिकृत डॉक्टरांच्या तपासणी आणि उपचारासाठी गोळा केली जात आहे.',
    'login.consent2': '2. आभा संलग्नता: तुमची ही तपासणी आणि प्रिस्क्रिप्शन तुमच्या आभा (ABHA) खात्याशी सुरक्षित जोडले जाईल.',
    'login.consent3': '3. गोपनीयता: तुमचा डेटा सुरक्षित असून कोणत्याही व्यावसायिक वापरासाठी दिला जाणार नाही.',
    'login.consent4': '4. रुग्णांचे हक्क: DPDP कायदा 2023 अंतर्गत आपण फोन ॲपद्वारे कधीही ही संमती मागे घेऊ शकता.',
    'login.consentCheckbox': 'मी सर्व अटी वाचल्या असून वैद्यकीय तपासणी आणि आभा संलग्नतेसाठी माझी स्पष्ट संमती देतो/देते.',
    'login.consentRequiredWarning': 'पुढे जाण्यासाठी संमती देणे बंधनकारक आहे. कृपया संमती बॉक्स निवडा.',
    'login.audioGuideBtn': 'संमती आवाजात ऐका (ऑडिओ गाईड)',
    'login.audioPlaying': 'संमती ऐकवली जात आहे...',
    'login.otpHeading': 'ABDM पडताळणी ओटीपी प्रविष्ट करा',
    'login.otpSub': 'आपल्या नोंदणीकृत मोबाइलवर 6-अंकी ओटीपी पाठवला आहे.',
    'login.otpSandboxHint': 'चाचणी ओटीपी: 123456',
    'login.verifyOtpBtn': 'पडताळणी करा आणि लॉगिन पूर्ण करा',
    'login.doctorHeading': 'डॉक्टर प्रमाणपत्र पडताळणी (HPR / NMC)',
    'login.doctorSubheading': 'राष्ट्रीय वैद्यकीय आयोग (NMC) डॉक्टर नोंदणी',
    'login.hprInputLabel': 'हेल्थकेअर प्रोफेशनल आयडी (HPR ID)',
    'login.councilLabel': 'राज्य वैद्यकीय परिषद (State Council)',
    'login.regNoLabel': 'नोंदणी क्रमांक (Registration Number)',
    'login.verifyDoctorBtn': 'डॉक्टर रेकॉर्ड शोधा आणि ओटीपी पाठवा',

    // Kiosk
    'kiosk.stepChiefComplaint': 'मुख्य आजार / तक्रार',
    'kiosk.stepDetails': 'लक्षणांचा तपशील',
    'kiosk.stepDocs': 'जुनी चिठ्ठी किंवा रिपोर्ट अपलोड',
    'kiosk.stepReview': 'तपासणी व पुष्टी',
    'kiosk.continueBtn': 'पुढे जा',
    'kiosk.backBtn': 'मागे या',
    'kiosk.submitBtn': 'डॉक्टरांकडे पाठवा',
    'kiosk.emergencyNotice': 'श्वास घेण्यास तीव्र त्रास, छातीत तीव्र वेदना किंवा अपघात असल्यास त्वरित रुग्णालयातील कर्मचाऱ्यांशी संपर्क साधा.',
    'kiosk.selectedOption': 'निवडले',
    'kiosk.painSeverityPrefix': 'वेदनेची तीव्रता',
    'kiosk.audioGuidance': 'ध्वनी मार्गदर्शन',
    'kiosk.replayQuestion': 'प्रश्न पुन्हा ऐका',

    // Audio Guide Prompts
    'audio.consentSpeech': 'आयुष्मान भारत डिजिटल मिशन अंतर्गत, कृपया आपल्या आरोग्य माहिती डॉक्टरांसोबत सामायिक करण्यास संमती द्या. संमतीशिवाय आपण पुढे जाऊ शकत नाही.',
    'audio.kioskWelcome': 'मेडीकिओस्कमध्ये आपले स्वागत आहे. कृपया आपला मुख्य आजार बोलून सांगा किंवा निवडा.',
  },
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  speak: (text: string) => void;
  stopSpeech: () => void;
  isSpeaking: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'medikiosk_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode;
      if (saved && ['en', 'hi', 'mr'].includes(saved)) return saved;
    }
    return 'hi'; // Default Hindi for accessible clinical kiosk
  });

  const [isSpeaking, setIsSpeaking] = useState(false);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      // Cancel any ongoing speech when language switches
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    }
  };

  const t = (key: string): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (langDict[key]) return langDict[key];
    return TRANSLATIONS.en[key] || key;
  };

  const speak = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis is not supported in this environment');
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const currentOpt = SUPPORTED_LANGUAGES.find((l) => l.code === language);
      utterance.lang = currentOpt ? currentOpt.speechLocale : 'en-IN';
      utterance.rate = 0.95; // Clear and accessible cadence
      utterance.pitch = 1.0;
      utterance.volume = 1.0; // Maximum loudness for kiosk environment

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Failed to speak text:', err);
      setIsSpeaking(false);
    }
  };

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        speak,
        stopSpeech,
        isSpeaking,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
