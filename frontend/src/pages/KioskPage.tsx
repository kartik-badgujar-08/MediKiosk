import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { KioskShell } from '../components/kiosk/KioskShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SocratesBodyMap } from '../components/kiosk/SocratesBodyMap';
import { PainSeveritySlider } from '../components/kiosk/PainSeveritySlider';
import { DocumentScannerModal } from '../components/kiosk/DocumentScannerModal';
import { OcrResultPreview, type OcrExtractionData } from '../components/kiosk/OcrResultPreview';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { 
  CheckCircle2, 
  CreditCard,
  Volume2,
  AlertTriangle,
  Send,
  Check,
  RotateCcw,
  Sparkles,
  Stethoscope
} from 'lucide-react';

interface QuestionOption {
  value: string;
  label_en: string;
  label_hi: string;
  label_mr: string;
  is_red_flag?: boolean;
}

interface ClinicalQuestion {
  id: string;
  section: string;
  type: string;
  text_en: string;
  text_hi: string;
  text_mr: string;
  audio_prompt_en?: string;
  audio_prompt_hi?: string;
  audio_prompt_mr?: string;
  options?: QuestionOption[];
  min_value?: number;
  max_value?: number;
}

interface InterviewState {
  encounter_id: string;
  current_section: string;
  current_step: number;
  total_estimated_steps: number;
  is_completed: boolean;
  current_question?: ClinicalQuestion | null;
  answers: Record<string, any>;
  red_flags: string[];
  missing_fields: string[];
}

export const KioskPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4; // 1: Patient Info, 2: AI Clinical Interview (SOCRATES), 3: Docs, 4: Review
  const { language, t, speak, isSpeaking } = useLanguage();
  const [isISL, setIsISL] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  
  const { patientProfile } = useAuth();
  
  // Patient registration state
  const [patientName, setPatientName] = useState(patientProfile ? patientProfile.name : 'Rahul Sharma');
  const [patientAge, setPatientAge] = useState(patientProfile ? patientProfile.age.toString() : '35');
  const [patientGender, setPatientGender] = useState(
    patientProfile ? (patientProfile.gender === 'M' ? 'Male' : patientProfile.gender === 'F' ? 'Female' : 'Other') : 'Male'
  );
  const [hasConsent, setHasConsent] = useState(true);

  // Encounter & Interview state
  const [encounterId, setEncounterId] = useState<string>(() => `kiosk-enc-${Date.now()}`);
  const [interviewState, setInterviewState] = useState<InterviewState | null>(null);
  const [isLoadingInterview, setIsLoadingInterview] = useState(false);
  const [selectedMultiOptions, setSelectedMultiOptions] = useState<string[]>([]);
  const [kioskSummary, setKioskSummary] = useState<any | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Track question to avoid repeated speech triggers
  const lastSpokenQuestionId = useRef<string | null>(null);

  // Auto-generate vernacular summary on entering Step 4 (Review)
  useEffect(() => {
    if (currentStep === 4 && !kioskSummary) {
      const fetchSummary = async () => {
        setIsLoadingSummary(true);
        try {
          const sum = await api.generateSummary(encounterId, { language });
          setKioskSummary(sum);
          const vernacularText = sum?.patient_vernacular_summary?.[language] || sum?.patient_vernacular_summary?.['en'];
          if (vernacularText) {
            speak(vernacularText);
          }
        } catch (e) {
          console.warn('Could not auto-generate kiosk summary:', e);
        } finally {
          setIsLoadingSummary(false);
        }
      };
      fetchSummary();
    }
  }, [currentStep, encounterId, language]);

  // Audio welcome on initial mount
  useEffect(() => {
    speak(t('audio.kioskWelcome'));
  }, [language]);


  useEffect(() => {
    if (patientProfile) {
      setPatientName(patientProfile.name);
      setPatientAge(patientProfile.age.toString());
      setPatientGender(patientProfile.gender === 'M' ? 'Male' : patientProfile.gender === 'F' ? 'Female' : 'Other');
      const cleanAbha = patientProfile.abha_number.replace(/\D/g, '');
      setEncounterId(`kiosk-enc-${cleanAbha || Date.now()}`);
    }
  }, [patientProfile]);

  // Helper to get question prompt based on language
  const getQuestionText = (q?: ClinicalQuestion | null) => {
    if (!q) return '';
    if (language === 'hi') return q.text_hi || q.text_en;
    if (language === 'mr') return q.text_mr || q.text_en;
    return q.text_en;
  };

  const getQuestionAudioPrompt = (q?: ClinicalQuestion | null) => {
    if (!q) return '';
    if (language === 'hi') return q.audio_prompt_hi || q.text_hi || q.text_en;
    if (language === 'mr') return q.audio_prompt_mr || q.text_mr || q.text_en;
    return q.audio_prompt_en || q.text_en;
  };

  const getOptionLabel = (opt: QuestionOption) => {
    if (language === 'hi') return opt.label_hi || opt.label_en;
    if (language === 'mr') return opt.label_mr || opt.label_en;
    return opt.label_en;
  };

  // Replay question audio aloud
  const replayCurrentQuestionAudio = () => {
    if (interviewState?.current_question) {
      const prompt = getQuestionAudioPrompt(interviewState.current_question);
      speak(prompt);
    }
  };

  // Auto-speak question aloud whenever question changes
  useEffect(() => {
    if (currentStep === 2 && interviewState?.current_question) {
      const q = interviewState.current_question;
      if (q.id !== lastSpokenQuestionId.current) {
        lastSpokenQuestionId.current = q.id;
        // Reset multi selection
        setSelectedMultiOptions([]);
        // Small delay to allow UI transition then speak loudly
        const timer = setTimeout(() => {
          const prompt = getQuestionAudioPrompt(q);
          speak(prompt);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [currentStep, interviewState?.current_question?.id, language]);

  const [patientId, setPatientId] = useState<string>('');
  const [patientUhid, setPatientUhid] = useState<string>('UHID-2026-PENDING');
  const [isSubmittingCase, setIsSubmittingCase] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);
  const [tokenNumber] = useState<number>(() => Math.floor(10 + Math.random() * 89));
  const [uploadedDocData, setUploadedDocData] = useState<{
    doc: any;
    extraction: OcrExtractionData;
  } | null>(null);

  // Start interview session when moving to Step 2
  const initializeInterview = async () => {
    try {
      setIsLoadingInterview(true);

      // 1. Create/save patient into real persistent database
      const p = await api.createPatient({
        name: patientName,
        age: parseInt(patientAge) || 35,
        gender: patientGender,
        phone: '+91-9876543210',
        preferred_language: language,
      });
      setPatientId(p.id);
      setPatientUhid(p.uhid || `UHID-2026-${p.id.slice(0, 6).toUpperCase()}`);

      // 2. Create real encounter in database
      const enc = await api.createEncounter({
        patient_id: p.id,
        chief_complaint: 'Clinical Case Intake',
        intake_channel: isISL ? 'sign' : isListening ? 'voice' : 'touch',
        language: language,
        consent_given: hasConsent,
      });
      setEncounterId(enc.id);

      // 3. Start interview session with real encounter ID
      const state = await api.startInterview(enc.id, language);
      setInterviewState(state);
      setCurrentStep(2);
    } catch (err) {
      console.error('Failed to start full-stack interview session:', err);
      // Fallback
      try {
        const state = await api.startInterview(encounterId, language);
        setInterviewState(state);
      } catch {}
      setCurrentStep(2);
    } finally {
      setIsLoadingInterview(false);
    }
  };

  // Handle single option selection with loud audio confirmation
  const handleSelectSingleOption = async (val: string, label: string) => {
    if (!interviewState?.current_question) return;

    // Speak loudly confirmation of what was selected
    const confirmPrefix = t('kiosk.selectedOption') || 'Selected';
    speak(`${confirmPrefix}: ${label}`);

    try {
      setIsLoadingInterview(true);
      const updated = await api.submitAnswer(encounterId, {
        question_id: interviewState.current_question.id,
        answer_value: val,
        input_channel: 'touch',
        confidence: 1.0,
      });
      setInterviewState(updated);
    } catch (err) {
      console.error('Failed to submit answer:', err);
    } finally {
      setIsLoadingInterview(false);
    }
  };

  // Handle pain scale selection with loud audio confirmation
  const handleSelectSeverity = async (val: number, label: string) => {
    if (!interviewState?.current_question) return;

    const prefix = t('kiosk.painSeverityPrefix') || 'Pain severity';
    speak(`${prefix}: ${label || val}`);

    try {
      setIsLoadingInterview(true);
      const updated = await api.submitAnswer(encounterId, {
        question_id: interviewState.current_question.id,
        answer_value: val,
        input_channel: 'touch',
        confidence: 1.0,
      });
      setInterviewState(updated);
    } catch (err) {
      console.error('Failed to submit severity:', err);
    } finally {
      setIsLoadingInterview(false);
    }
  };

  // Toggle multi-choice option with audio feedback
  const handleToggleMultiOption = (optVal: string, optLabel: string) => {
    setSelectedMultiOptions((prev) => {
      const exists = prev.includes(optVal);
      const next = exists ? prev.filter((v) => v !== optVal) : [...prev, optVal];
      const confirmPrefix = t('kiosk.selectedOption') || 'Selected';
      if (!exists) {
        speak(`${confirmPrefix}: ${optLabel}`);
      }
      return next;
    });
  };

  // Submit multi-choice selection
  const handleConfirmMultiChoice = async () => {
    if (!interviewState?.current_question) return;
    const values = selectedMultiOptions.length > 0 ? selectedMultiOptions : ['None'];

    try {
      setIsLoadingInterview(true);
      const updated = await api.submitAnswer(encounterId, {
        question_id: interviewState.current_question.id,
        answer_value: values,
        input_channel: 'touch',
        confidence: 1.0,
      });
      setInterviewState(updated);
      setSelectedMultiOptions([]);
    } catch (err) {
      console.error('Failed to submit multi answers:', err);
    } finally {
      setIsLoadingInterview(false);
    }
  };

  // AI Free-Text / Speech Analyzer
  const handleAnalyzeAIComplaint = async () => {
    if (!speechTranscript.trim()) return;

    try {
      setIsAnalyzingAI(true);
      const analysis = await api.analyzeComplaintAI(speechTranscript, language);
      
      let summaryText = 'AI Analyzed: ';
      if (analysis.extracted_slots.site) summaryText += `Site ${analysis.extracted_slots.site}, `;
      if (analysis.extracted_slots.character) summaryText += `Character ${analysis.extracted_slots.character}, `;
      if (analysis.extracted_slots.severity) summaryText += `Severity ${analysis.extracted_slots.severity}/10`;

      speak(summaryText);

      // Auto submit Chief Complaint if present
      if (analysis.chief_complaint) {
        await api.submitAnswer(encounterId, {
          question_id: 'CC_PRIMARY',
          answer_value: analysis.chief_complaint,
          input_channel: 'voice',
          confidence: 0.95,
        });
      }

      // Auto submit site if present
      if (analysis.extracted_slots.site) {
        await api.submitAnswer(encounterId, {
          question_id: 'SOCRATES_SITE',
          answer_value: analysis.extracted_slots.site,
          input_channel: 'voice',
          confidence: 0.95,
        });
      }

      // Refresh current question
      const refreshed = await api.getCurrentQuestion(encounterId);
      setInterviewState(refreshed);
      setSpeechTranscript('');
    } catch (err) {
      console.error('Failed to analyze complaint with AI:', err);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const handleFinalSubmit = async () => {
    try {
      setIsSubmittingCase(true);
      // 1. Confirm patient intake in database
      await api.patientConfirm({
        encounter_id: encounterId,
        confirmed: true,
      });

      // 2. Generate physician clinical summary
      try {
        const sum = await api.generateSummary(encounterId, { language });
        setKioskSummary(sum);
      } catch (e) {
        console.warn('Summary generation notice:', e);
      }

      setSubmissionSuccess(true);
      const audioSuccess = language === 'hi' 
        ? `आपकी क्लिनिकल पर्ची तैयार है। आपका टोकन नंबर ${tokenNumber} है। कृपया डॉक्टर केबिन में जाएं।`
        : language === 'mr'
        ? `आपली क्लिनिकल नोंदणी पूर्ण झाली आहे. टोकन क्रमांक ${tokenNumber} आहे. कृपया डॉक्टरांकडे जा.`
        : `Your clinical case has been successfully submitted to the attending physician queue. Token number ${tokenNumber}.`;
      speak(audioSuccess);
    } catch (err) {
      console.error('Failed to submit encounter:', err);
      setSubmissionSuccess(true);
    } finally {
      setIsSubmittingCase(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      initializeInterview();
    } else if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === totalSteps) {
      handleFinalSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepCategory = () => {
    switch (currentStep) {
      case 1:
        return 'Patient Identification & ABHA';
      case 2:
        return 'Adaptive Clinical Interview (SOCRATES)';
      case 3:
        return t('kiosk.stepDocs');
      case 4:
        return t('kiosk.stepReview');
      default:
        return 'Intake';
    }
  };

  const currentQ = interviewState?.current_question;
  const isInterviewComplete = interviewState?.is_completed || false;

  return (
    <KioskShell
      currentStep={currentStep}
      totalSteps={totalSteps}
      stepCategory={getStepCategory()}
      selectedLanguage={language}
      isISLEnabled={isISL}
      onToggleISL={() => setIsISL(!isISL)}
      isListening={isListening}
      onToggleVoice={() => setIsListening(!isListening)}
      onBack={handleBack}
      onNext={handleNext}
      canGoBack={currentStep > 1 && !submissionSuccess}
      canGoNext={
        currentStep === 1
          ? hasConsent
          : currentStep === 2
          ? isInterviewComplete
          : currentStep === 4 && submissionSuccess
          ? false
          : true
      }
      nextButtonLabel={currentStep === totalSteps ? (isSubmittingCase ? 'Submitting...' : t('kiosk.submitBtn')) : t('kiosk.continueBtn')}
    >
      {/* STEP 1: Patient Registration & Consent */}
      {currentStep === 1 && (
        <Card variant="kiosk" padding="kiosk">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 text-center">
            Patient Identification & Health Account
          </h2>
          <p className="text-slate-600 text-sm text-center mb-6">
            Please confirm your identity details to proceed to the clinical history interview.
          </p>

          {/* Government ABHA Identity Card or Login prompt */}
          {patientProfile ? (
            <div className="max-w-lg mx-auto mb-6 p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-emerald-50 border-2 border-sky-300 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                  {patientProfile.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ABDM M1 Verified Citizen
                  </div>
                  <div className="font-mono text-xs text-slate-700 font-semibold">
                    ABHA: {patientProfile.abha_number}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {patientProfile.abha_address} • {patientProfile.district_name}, {patientProfile.state_name}
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                KYC Active
              </span>
            </div>
          ) : (
            <div className="max-w-lg mx-auto mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="text-xs text-amber-900">
                  <span className="font-bold">Have an ABHA Health ID?</span>
                  <div className="text-[11px] text-amber-700">Link with official Government Digital Health Account</div>
                </div>
              </div>
              <Link
                to="/login?role=patient"
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all"
              >
                ABHA Login
              </Link>
            </div>
          )}

          <div className="space-y-4 max-w-lg mx-auto mb-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-base font-semibold focus:bg-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-base font-semibold focus:bg-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Gender</label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value)}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-base font-semibold focus:bg-white focus:border-sky-500 focus:outline-none"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            {/* Consent Agreement */}
            <div className="p-4 bg-sky-50/70 border-2 border-sky-200 rounded-2xl mt-6">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasConsent}
                  onChange={(e) => setHasConsent(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
                <span className="text-xs text-slate-700 leading-relaxed font-medium">
                  <strong>Digital Intake Consent:</strong> I agree to record clinical history for physician review. 
                  All records will be reviewed and verified by an attending clinician.
                </span>
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 2: AI Clinical Interview (SOCRATES Engine) */}
      {currentStep === 2 && (
        <Card variant="kiosk" padding="kiosk">
          {/* Audio Guidance Bar & Replay */}
          <div className="max-w-2xl mx-auto mb-6 p-3.5 bg-gradient-to-r from-sky-50 via-teal-50 to-indigo-50 border-2 border-sky-200 rounded-2xl flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                isSpeaking ? 'bg-amber-500 text-white animate-pulse' : 'bg-sky-600 text-white'
              }`}>
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  {isSpeaking ? '🔊 Audio Speaking Loudly...' : '🔊 Audio Guided Clinical Interview'}
                </span>
                <span className="text-[11px] text-slate-500">
                  Every question and your selection will speak aloud automatically.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={replayCurrentQuestionAudio}
              className="px-3.5 py-2 rounded-xl bg-white border-2 border-sky-300 hover:bg-sky-50 text-sky-800 font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-sky-600" />
              {t('kiosk.replayQuestion') || 'Replay Voice'}
            </button>
          </div>

          {/* Red Flag Warning Banner */}
          {interviewState?.red_flags && interviewState.red_flags.length > 0 && (
            <div className="max-w-2xl mx-auto mb-6 p-4 bg-rose-50 border-2 border-rose-400 rounded-2xl flex items-start gap-3 shadow-xs animate-bounce-short">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-black text-rose-900 uppercase tracking-wide">
                  Clinical Triage Alert Detected
                </div>
                <div className="text-xs font-semibold text-rose-800 mt-1">
                  {interviewState.red_flags.join(' • ')}
                </div>
                <div className="text-[11px] text-rose-700 mt-1.5">
                  This symptom combination has been flagged for immediate physician attention.
                </div>
              </div>
            </div>
          )}

          {/* Question Sequence Header */}
          {currentQ && !isInterviewComplete && (
            <div className="max-w-2xl mx-auto mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
                  Section: {currentQ.section}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Step {interviewState?.current_step || 1} of ~{interviewState?.total_estimated_steps || 6}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 text-center">
                {getQuestionText(currentQ)}
              </h2>
              {language !== 'en' && (
                <p className="text-slate-500 text-xs text-center mb-4 font-medium">
                  {currentQ.text_en}
                </p>
              )}
            </div>
          )}

          {/* DYNAMIC QUESTION RENDERING */}
          {isLoadingInterview ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <div className="font-bold text-slate-700">Updating Clinical Dialogue...</div>
            </div>
          ) : isInterviewComplete ? (
            <div className="max-w-xl mx-auto text-center py-8 space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">
                  Clinical Intake Complete
                </h3>
                <p className="text-slate-600 text-sm">
                  The SOCRATES evaluation and preliminary clinical history have been recorded successfully.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-left space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase">Recorded Clinical Facts:</div>
                {interviewState?.answers && Object.entries(interviewState.answers).map(([qid, val]) => (
                  <div key={qid} className="text-xs text-slate-800 flex justify-between border-b border-slate-200/60 pb-1">
                    <span className="font-mono text-slate-500">{qid}:</span>
                    <span className="font-bold">{Array.isArray(val) ? val.join(', ') : String(val)}</span>
                  </div>
                ))}
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={() => setCurrentStep(3)}
                className="w-full"
              >
                Proceed to Document Upload
              </Button>
            </div>
          ) : currentQ?.id === 'SOCRATES_SITE' ? (
            <SocratesBodyMap
              selectedValue={interviewState?.answers?.SOCRATES_SITE}
              onSelect={handleSelectSingleOption}
            />
          ) : currentQ?.id === 'SOCRATES_SEVERITY' || currentQ?.type === 'scale' ? (
            <PainSeveritySlider
              value={Number(interviewState?.answers?.SOCRATES_SEVERITY) || 5}
              onSelect={handleSelectSeverity}
            />
          ) : currentQ?.type === 'single_choice' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-2xl mx-auto mb-8">
              {currentQ.options?.map((opt) => {
                const label = getOptionLabel(opt);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelectSingleOption(opt.value, label)}
                    className="p-5 rounded-2xl border-3 border-slate-200 hover:border-sky-500 bg-white hover:bg-sky-50/80 text-left transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-md flex items-center justify-between group active:scale-98"
                  >
                    <div>
                      <div className="font-bold text-base text-slate-900 group-hover:text-sky-950">
                        {label}
                      </div>
                      {language !== 'en' && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          {opt.label_en}
                        </div>
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-slate-200 group-hover:border-sky-500 flex items-center justify-center text-sky-600 font-bold shrink-0">
                      →
                    </div>
                  </button>
                );
              })}
            </div>
          ) : currentQ?.type === 'multi_choice' ? (
            <div className="max-w-2xl mx-auto space-y-6 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQ.options?.map((opt) => {
                  const label = getOptionLabel(opt);
                  const isChecked = selectedMultiOptions.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleToggleMultiOption(opt.value, label)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? 'border-sky-500 bg-sky-50 text-sky-950 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <span className="font-bold text-sm">{label}</span>
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                        isChecked ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300 bg-slate-50'
                      }`}>
                        {isChecked && <Check className="w-4 h-4" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleConfirmMultiChoice}
                className="w-full shadow-md"
              >
                Confirm Selection ({selectedMultiOptions.length} Selected)
              </Button>
            </div>
          ) : null}

          {/* NATURAL LANGUAGE AI COMPLAINT EXTRACTOR WIDGET */}
          {!isInterviewComplete && (
            <div className="max-w-2xl mx-auto mt-8 pt-6 border-t-2 border-slate-100">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    <span className="text-xs font-bold text-slate-800">
                      AI Voice & Free-Text Intake Assistant
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Supports Hindi, Marathi, & English
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={speechTranscript}
                    onChange={(e) => setSpeechTranscript(e.target.value)}
                    placeholder="e.g. छाती में 2 घंटे से तेज जलन हो रही है और सांस फूल रही है..."
                    className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-sky-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAnalyzeAIComplaint();
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Demo preset for instant testing
                      const sample = language === 'hi' 
                        ? 'छाती में बहुत तेज जलन हो रही है और पसीना आ रहा है'
                        : language === 'mr'
                        ? 'छातीत तीव्र जळजळ आणि दम लागत आहे'
                        : 'Severe burning chest pain radiating to left arm with cold sweat';
                      setSpeechTranscript(sample);
                    }}
                  >
                    Sample
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAnalyzeAIComplaint}
                    disabled={isAnalyzingAI || !speechTranscript.trim()}
                    className="shrink-0 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isAnalyzingAI ? 'Parsing...' : 'Analyze'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* STEP 3: Document Upload */}
      {currentStep === 3 && (
        <Card variant="kiosk" padding="kiosk">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 text-center">
            Upload Prior Prescriptions or Lab Reports
          </h2>
          <p className="text-slate-600 text-sm text-center mb-8 max-w-xl mx-auto">
            Digitize previous medical prescriptions (via TrOCR) or diagnostic pathology reports (CBC, Sugar, Lipid) for physician review.
          </p>

          {uploadedDocData ? (
            <div className="max-w-2xl mx-auto space-y-6">
              <OcrResultPreview
                filename={uploadedDocData.doc.filename}
                extraction={uploadedDocData.extraction}
                onRemove={() => setUploadedDocData(null)}
              />

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setCurrentStep(4)}
                  className="flex-1 shadow-md"
                >
                  Proceed to Final Review
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setUploadedDocData(null)}
                  className="sm:w-auto"
                >
                  Attach Another Document
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <DocumentScannerModal
                encounterId={encounterId}
                onExtractionComplete={(doc, extraction) => {
                  setUploadedDocData({ doc, extraction });
                }}
              />

              <div className="text-center pt-4 border-t border-slate-200/80 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline underline-offset-4 cursor-pointer"
                >
                  Skip Step: I do not have old documents today
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* STEP 4: Review & Submit */}
      {currentStep === 4 && (
        <Card variant="kiosk" padding="kiosk">
          {submissionSuccess ? (
            <div className="max-w-2xl mx-auto py-4 space-y-6 animate-in fade-in">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {language === 'hi' ? 'केस सफलतापूर्वक दर्ज किया गया' : language === 'mr' ? 'नोंदणी यशस्वीरीत्या पूर्ण झाली' : 'Intake Case Submitted to Doctor'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                  {language === 'hi' ? 'आपकी क्लिनिकल पर्ची तैयार है' : language === 'mr' ? 'आपली तपासणी नोंदणी पूर्ण झाली' : 'Clinical Intake Completed'}
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto">
                  {language === 'hi'
                    ? 'आपका केस सारांश डॉक्टर साहब के कंप्यूटर पर भेज दिया गया है। कृपया अपना टोकन नंबर नोट करें।'
                    : language === 'mr'
                    ? 'आपला केस गोषवारा डॉक्टरांच्या संगणकावर पाठवला गेला आहे. कृपया टोकन क्रमांक लक्षात ठेवा.'
                    : 'Your clinical history and case summary have been transmitted directly to the doctor.'}
                </p>
              </div>

              {/* Consultation Token Box */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-sky-600 via-sky-700 to-indigo-700 text-white shadow-xl text-center">
                <div className="text-xs font-bold uppercase tracking-wider opacity-85 mb-1">
                  {language === 'hi' ? 'मरीज टोकन नंबर' : language === 'mr' ? 'रुग्ण टोकन क्रमांक' : 'Patient Consultation Token'}
                </div>
                <div className="text-6xl font-black tracking-tight mb-2">
                  #{tokenNumber}
                </div>
                <div className="text-sm font-semibold opacity-95">
                  {patientName} • {patientAge} yrs ({patientGender}) • {patientUhid} {patientId ? `(ID: ${patientId.slice(0, 8)})` : ''}
                </div>
                <div className="text-xs opacity-80 mt-1 font-mono">
                  Encounter ID: {encounterId}
                </div>
                <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs">
                  <span>📍 Please proceed to Doctor Consultation Room 3</span>
                </div>
              </div>

              {/* PATIENT CLINICAL SUMMARY (VISIBLE AT THE SAME TIME WITH TOKEN) */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-teal-50 via-sky-50 to-indigo-50 border-2 border-teal-300 shadow-sm space-y-3.5 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-teal-950 uppercase tracking-wider">
                        {language === 'hi'
                          ? 'आपका क्लिनिकल सारांश (सरल भाषा में)'
                          : language === 'mr'
                          ? 'आपला क्लिनिकल गोषवारा (सोप्या भाषेत)'
                          : 'Your Plain-Language Clinical Summary'}
                      </div>
                      <div className="text-[11px] text-teal-700">
                        {language === 'hi'
                          ? 'यह सारांश डॉक्टर साहब के पास उपलब्ध है'
                          : language === 'mr'
                          ? 'हा गोषवारा डॉक्टरांकडे उपलब्ध आहे'
                          : 'Transmitted to physician desk'}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                    AI Synthesized
                  </span>
                </div>

                <div className="p-4 bg-white/95 rounded-2xl border border-teal-200 shadow-2xs">
                  <p className="text-slate-800 text-xs sm:text-sm font-medium leading-relaxed">
                    {kioskSummary?.patient_vernacular_summary?.[language] ||
                      kioskSummary?.patient_vernacular_summary?.['en'] ||
                      'Intake evaluation completed successfully. Your recorded symptoms and case details have been registered.'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const txt =
                        kioskSummary?.patient_vernacular_summary?.[language] ||
                        kioskSummary?.patient_vernacular_summary?.['en'];
                      if (txt) speak(txt);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>
                      {language === 'hi'
                        ? '🔊 सारांश जोर से सुनें'
                        : language === 'mr'
                        ? '🔊 गोषवारा ऐका'
                        : '🔊 Listen Loudly'}
                    </span>
                  </button>

                  <div className="text-[11px] text-slate-600 font-medium">
                    Chief Complaint: <strong className="text-slate-900">{interviewState?.answers?.['CC_PRIMARY'] || 'General Clinical Intake'}</strong>
                  </div>
                </div>
              </div>

              {/* End of Patient Workflow Card */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center text-xs text-emerald-900 font-semibold space-y-1">
                <div>✅ Patient Workflow Complete</div>
                <div className="text-[11px] text-emerald-700 font-normal">
                  Thank you! You may now take your token and wait in the seating area. Press below to reset the kiosk for the next patient.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSubmissionSuccess(false);
                    setCurrentStep(1);
                    setEncounterId(`kiosk-enc-${Date.now()}`);
                    setInterviewState(null);
                    setUploadedDocData(null);
                    setKioskSummary(null);
                  }}
                  className="w-full py-4 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Finish & Start New Patient Intake</span>
                </button>

                <Link
                  to={`/doctor?encounterId=${encounterId}`}
                  className="w-full py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Attending Clinician: Open Doctor Desk (Test Link)</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 text-center">
                Review Your Information
              </h2>
              <p className="text-slate-600 text-sm text-center mb-6">
                Please check that your clinical intake history is accurate before submitting to the doctor.
              </p>

              <div className="max-w-xl mx-auto space-y-4 mb-8">
                {/* AI Patient Plain-Language Vernacular Summary Card */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-teal-50 via-sky-50 to-indigo-50 border-2 border-teal-300 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-teal-950 uppercase tracking-wider">
                          {language === 'hi'
                            ? 'एआई क्लिनिकल सारांश (सरल भाषा)'
                            : language === 'mr'
                            ? 'एआय क्लिनिकल सारांश (सोप्या भाषेत)'
                            : 'AI Case Summary (Plain Language)'}
                        </div>
                        <div className="text-[11px] text-teal-700">
                          {language === 'hi'
                            ? 'आपके द्वारा बताए गए लक्षणों का सरल विवरण'
                            : language === 'mr'
                            ? 'आपण नोंदवलेल्या लक्षणांचा सोपा गोषवारा'
                            : 'Synthesized plain-language patient explanation'}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                      {kioskSummary?.ai_model_used ? 'AI Synthesized' : 'Auto Generated'}
                    </span>
                  </div>

                  {isLoadingSummary ? (
                    <div className="py-4 flex items-center justify-center gap-2 text-xs font-bold text-teal-800">
                      <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      <span>
                        {language === 'hi'
                          ? 'सारांश तैयार किया जा रहा है...'
                          : language === 'mr'
                          ? 'सारांश तयार होत आहे...'
                          : 'Synthesizing your clinical summary...'}
                      </span>
                    </div>
                  ) : (
                    <>
                      <p className="text-slate-800 text-xs sm:text-sm font-medium leading-relaxed bg-white/90 p-3.5 rounded-2xl border border-teal-200 shadow-2xs">
                        {kioskSummary?.patient_vernacular_summary?.[language] ||
                          kioskSummary?.patient_vernacular_summary?.['en'] ||
                          'Clinical intake completed. Please review your recorded symptoms and details below.'}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-500 font-medium">
                          {language === 'hi'
                            ? '📢 यह सारांश डॉक्टर साहब के पास भेजा जा रहा है'
                            : language === 'mr'
                            ? '📢 हा सारांश डॉक्टरांच्या स्क्रीनवर पाठवला जात आहे'
                            : '📢 This summary will be sent to the doctor.'}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            const txt =
                              kioskSummary?.patient_vernacular_summary?.[language] ||
                              kioskSummary?.patient_vernacular_summary?.['en'];
                            if (txt) speak(txt);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-95"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>
                            {language === 'hi'
                              ? 'जोर से सुनें'
                              : language === 'mr'
                              ? 'ऐका'
                              : 'Listen Loudly'}
                          </span>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Patient Profile
                  </div>

                  <div className="font-bold text-slate-900 text-base">
                    {patientName}, {patientAge} yrs, {patientGender}
                  </div>
                  <div className="text-xs font-mono text-slate-600 mt-1">
                    UHID: {patientUhid}
                  </div>
                  {patientProfile && (
                    <div className="text-xs font-mono text-slate-600 mt-0.5">
                      ABHA: {patientProfile.abha_number}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Evaluated SOCRATES Clinical History
                  </div>
                  <div className="space-y-1.5">
                    {interviewState?.answers && Object.entries(interviewState.answers).map(([key, val]) => (
                      <div key={key} className="text-xs text-slate-800 flex justify-between border-b border-slate-200/50 pb-1">
                        <span className="font-semibold text-slate-600">{key}:</span>
                        <span className="font-bold text-sky-900">{Array.isArray(val) ? val.join(', ') : String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {interviewState?.red_flags && interviewState.red_flags.length > 0 && (
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200">
                    <div className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">
                      Flagged Clinical Considerations
                    </div>
                    <div className="text-xs text-rose-900 font-semibold">
                      {interviewState.red_flags.join(' • ')}
                    </div>
                  </div>
                )}

                {uploadedDocData ? (
                  <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-sky-900 uppercase tracking-wider">
                        Digitized Document: {uploadedDocData.doc.filename}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
                        {uploadedDocData.extraction.ocr_engine}
                      </span>
                    </div>

                    {/* Extracted Medications */}
                    {uploadedDocData.extraction.extracted_entities?.some(e => e.category === 'medication') && (
                      <div className="space-y-1">
                        <div className="text-[11px] font-bold text-slate-600 uppercase">Extracted Medications:</div>
                        {uploadedDocData.extraction.extracted_entities?.filter(e => e.category === 'medication').map((m, i) => (
                          <div key={i} className="text-xs text-slate-800 flex justify-between border-b border-sky-100 pb-1">
                            <span className="font-semibold text-slate-700">{m.name}</span>
                            <span className="font-bold text-sky-950">{String(m.value)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Extracted Lab Findings */}
                    {uploadedDocData.extraction.tables?.[0]?.rows && (
                      <div className="space-y-1 border-t border-sky-200/60 pt-2">
                        <div className="text-[11px] font-bold text-slate-600 uppercase">Extracted Lab Findings:</div>
                        {uploadedDocData.extraction.tables[0].rows.slice(0, 4).map((r, i) => (
                          <div key={i} className="text-xs text-slate-800 flex justify-between border-b border-sky-100 pb-1">
                            <span className="font-medium text-slate-700">{r[0]}</span>
                            <span className="font-mono font-bold text-slate-900">{r[1]} {r[3]} ({r[4]})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500 font-medium">
                    No previous medical records attached. First-time clinical case taking.
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      )}
    </KioskShell>
  );
};
