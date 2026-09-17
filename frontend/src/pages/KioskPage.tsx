import React, { useState } from 'react';
import { KioskShell, type LanguageCode } from '../components/kiosk/KioskShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  CheckCircle2, 
  Sparkles, 
  FileUp, 
  AlertCircle 
} from 'lucide-react';

export const KioskPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [isISL, setIsISL] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Patient intake state
  const [patientName, setPatientName] = useState('Rahul Sharma');
  const [patientAge, setPatientAge] = useState('35');
  const [patientGender, setPatientGender] = useState('Male');
  const [hasConsent, setHasConsent] = useState(true);

  // Chief complaint selection
  const [chiefComplaint, setChiefComplaint] = useState<string>('Fever');
  const [feverDuration, setFeverDuration] = useState<string>('3 days');
  const [associatedSymptoms, setAssociatedSymptoms] = useState<string[]>([
    'Headache',
    'Body ache',
    'Mosquito exposure',
  ]);

  const toggleSymptom = (symptom: string) => {
    setAssociatedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
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
        return 'Language & Accessibility';
      case 2:
        return 'Patient Registration & Consent';
      case 3:
        return 'Chief Complaint';
      case 4:
        return 'Symptom Details & Onset';
      case 5:
        return 'Document Upload (Prescriptions/Reports)';
      case 6:
        return 'Review & Submit';
      default:
        return 'Intake';
    }
  };

  return (
    <KioskShell
      currentStep={currentStep}
      totalSteps={totalSteps}
      stepCategory={getStepCategory()}
      selectedLanguage={language}
      onLanguageChange={setLanguage}
      isISLEnabled={isISL}
      onToggleISL={() => setIsISL(!isISL)}
      isListening={isListening}
      onToggleVoice={() => setIsListening(!isListening)}
      onBack={handleBack}
      onNext={handleNext}
      canGoBack={currentStep > 1}
      canGoNext={currentStep !== 2 || hasConsent}
      nextButtonLabel={currentStep === totalSteps ? 'Submit to Doctor' : 'Continue'}
    >
      {/* Step 1: Language & Accessibility */}
      {currentStep === 1 && (
        <Card variant="kiosk" padding="kiosk" className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
            Choose Your Preferred Language
          </h2>
          <p className="text-slate-600 text-base mb-8">
            कृपया अपनी भाषा चुनें / कृपया आपली भाषा निवडा
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto mb-8">
            <button
              onClick={() => setLanguage('en')}
              className={`p-6 rounded-2xl border-3 text-center transition-all ${
                language === 'en'
                  ? 'border-sky-500 bg-sky-50/80 shadow-md'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="text-xl font-bold text-slate-900">English</div>
              <div className="text-sm text-slate-500 mt-1">Default</div>
            </button>

            <button
              onClick={() => setLanguage('hi')}
              className={`p-6 rounded-2xl border-3 text-center transition-all ${
                language === 'hi'
                  ? 'border-sky-500 bg-sky-50/80 shadow-md'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="text-xl font-bold text-slate-900">हिंदी</div>
              <div className="text-sm text-slate-500 mt-1">Hindi</div>
            </button>

            <button
              onClick={() => setLanguage('mr')}
              className={`p-6 rounded-2xl border-3 text-center transition-all ${
                language === 'mr'
                  ? 'border-sky-500 bg-sky-50/80 shadow-md'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="text-xl font-bold text-slate-900">मराठी</div>
              <div className="text-sm text-slate-500 mt-1">Marathi</div>
            </button>
          </div>

          <div className="inline-flex items-center gap-2 p-3 bg-teal-50 border border-teal-200 rounded-2xl text-teal-800 text-sm font-semibold">
            <Sparkles className="w-4 h-4 text-teal-600" />
            Speech recognition (IndicConformer) & Sign Language (ISLRTC) ready
          </div>
        </Card>
      )}

      {/* Step 2: Patient Registration & Consent */}
      {currentStep === 2 && (
        <Card variant="kiosk" padding="kiosk">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 text-center">
            Patient Information & Consent
          </h2>
          <p className="text-slate-600 text-sm text-center mb-8">
            Please verify patient identification details for this clinical encounter.
          </p>

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
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasConsent}
                  onChange={(e) => setHasConsent(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
                <span className="text-xs text-slate-700 leading-relaxed font-medium">
                  <strong>Digital Intake Consent:</strong> I agree to use MediKiosk to record my clinical history. 
                  I understand this system collects information for physician review and does not independently diagnose medical conditions.
                </span>
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Chief Complaint */}
      {currentStep === 3 && (
        <Card variant="kiosk" padding="kiosk">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 text-center">
            What is your primary medical concern today?
          </h2>
          <p className="text-slate-600 text-sm text-center mb-8">
            Touch to select or use the voice button below to speak your symptoms.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
            {['Fever', 'Pain', 'Cough & Cold', 'Breathlessness', 'Stomach Ache', 'Skin Rash'].map(
              (item) => (
                <button
                  key={item}
                  onClick={() => setChiefComplaint(item)}
                  className={`p-5 rounded-2xl border-3 font-bold text-base transition-all flex flex-col items-center justify-center gap-2 ${
                    chiefComplaint === item
                      ? 'border-sky-500 bg-sky-50 text-sky-800 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <span>{item}</span>
                  {chiefComplaint === item && (
                    <CheckCircle2 className="w-5 h-5 text-sky-600" />
                  )}
                </button>
              )
            )}
          </div>

          <div className="flex justify-center gap-3">
            <button 
              onClick={() => setChiefComplaint('Other')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
            >
              Other / Something else
            </button>
            <button 
              onClick={() => setChiefComplaint('Uncertain')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
            >
              I'm not sure
            </button>
          </div>
        </Card>
      )}

      {/* Step 4: Symptom Details & Onset */}
      {currentStep === 4 && (
        <Card variant="kiosk" padding="kiosk">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 text-center">
            Tell us more about your {chiefComplaint.toLowerCase()}
          </h2>
          <p className="text-slate-600 text-sm text-center mb-8">
            How long have you had this, and what other symptoms are present?
          </p>

          <div className="max-w-xl mx-auto space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Duration</label>
              <div className="grid grid-cols-4 gap-2">
                {['1 day', '2-3 days', '1 week', '2+ weeks'].map((dur) => (
                  <button
                    key={dur}
                    onClick={() => setFeverDuration(dur)}
                    className={`py-3 px-2 rounded-xl font-bold text-xs border-2 transition-all ${
                      feverDuration === dur
                        ? 'bg-sky-500 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {dur}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Associated Symptoms</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Headache',
                  'Body ache',
                  'Chills / Shivering',
                  'Vomiting',
                  'Mosquito exposure',
                  'Bleeding / Petechiae',
                ].map((symp) => {
                  const selected = associatedSymptoms.includes(symp);
                  return (
                    <button
                      key={symp}
                      onClick={() => toggleSymptom(symp)}
                      className={`p-3.5 rounded-xl border-2 font-bold text-xs text-left flex items-center justify-between transition-all ${
                        selected
                          ? 'border-teal-500 bg-teal-50 text-teal-900'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <span>{symp}</span>
                      {selected && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {associatedSymptoms.includes('Mosquito exposure') && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800 font-medium">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Noted: High mosquito exposure in local area. Flagged for physician differential review.</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Step 5: Document Upload */}
      {currentStep === 5 && (
        <Card variant="kiosk" padding="kiosk">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 text-center">
            Upload Old Prescriptions or Reports
          </h2>
          <p className="text-slate-600 text-sm text-center mb-8">
            Digitize lab reports (CBC, Blood Sugar) or previous prescriptions using PaddleOCR.
          </p>

          <div className="max-w-md mx-auto border-3 border-dashed border-sky-200 hover:border-sky-400 bg-sky-50/50 rounded-3xl p-8 text-center cursor-pointer transition-all mb-6">
            <div className="w-16 h-16 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-4">
              <FileUp className="w-8 h-8" />
            </div>
            <div className="font-bold text-base text-slate-800 mb-1">
              Tap to Scan or Choose Document
            </div>
            <div className="text-xs text-slate-500 mb-4">
              Supports JPEG, PNG, PDF up to 10MB
            </div>
            <Button variant="outline" size="sm">
              Select Sample CBC Report
            </Button>
          </div>

          <div className="max-w-md mx-auto p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="text-xs font-bold text-emerald-900">Sample_CBC_Report.pdf</div>
                <div className="text-[11px] text-emerald-700">OCR Extraction Ready • Paracetamol 650mg detected</div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 px-2 py-0.5 rounded bg-emerald-100">
              Attached
            </span>
          </div>
        </Card>
      )}

      {/* Step 6: Review & Submit */}
      {currentStep === 6 && (
        <Card variant="kiosk" padding="kiosk">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 text-center">
            Review Your Information
          </h2>
          <p className="text-slate-600 text-sm text-center mb-6">
            Please check that everything is correct before sending your case to the doctor.
          </p>

          <div className="max-w-xl mx-auto space-y-4 mb-8">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Patient Profile
              </div>
              <div className="font-bold text-slate-900 text-base">
                {patientName}, {patientAge} yrs, {patientGender}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Chief Complaint & Symptoms
              </div>
              <div className="font-bold text-slate-900 text-base mb-1">
                {chiefComplaint} ({feverDuration})
              </div>
              <div className="text-xs text-slate-600">
                Associated: {associatedSymptoms.join(', ')}
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Extracted from Prescription (OCR)
                </div>
                <span className="text-[11px] text-amber-700 font-semibold">Verify</span>
              </div>
              <div className="text-sm font-bold text-slate-900">
                Paracetamol 650mg TDS (3 days)
              </div>
              <div className="text-xs text-slate-500">Source: Uploaded prescription</div>
            </div>
          </div>
        </Card>
      )}
    </KioskShell>
  );
};
