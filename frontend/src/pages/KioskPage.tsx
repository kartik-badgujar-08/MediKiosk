import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { KioskShell } from '../components/kiosk/KioskShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  CheckCircle2, 
  FileUp, 
  CreditCard,
  Mic,
  Check
} from 'lucide-react';

export const KioskPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const { language, t, speak } = useLanguage();
  const [isISL, setIsISL] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const { patientProfile } = useAuth();
  
  // Patient intake state
  const [patientName, setPatientName] = useState(patientProfile ? patientProfile.name : 'Rahul Sharma');
  const [patientAge, setPatientAge] = useState(patientProfile ? patientProfile.age.toString() : '35');
  const [patientGender, setPatientGender] = useState(
    patientProfile ? (patientProfile.gender === 'M' ? 'Male' : patientProfile.gender === 'F' ? 'Female' : 'Other') : 'Male'
  );
  const [hasConsent, setHasConsent] = useState(true);

  // Audio welcome on initial mount
  useEffect(() => {
    speak(t('audio.kioskWelcome'));
  }, [language]);

  useEffect(() => {
    if (patientProfile) {
      setPatientName(patientProfile.name);
      setPatientAge(patientProfile.age.toString());
      setPatientGender(patientProfile.gender === 'M' ? 'Male' : patientProfile.gender === 'F' ? 'Female' : 'Other');
    }
  }, [patientProfile]);

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
        return 'Patient Identification & ABHA';
      case 2:
        return t('kiosk.stepChiefComplaint');
      case 3:
        return t('kiosk.stepDetails');
      case 4:
        return t('kiosk.stepDocs');
      case 5:
        return t('kiosk.stepReview');
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
      isISLEnabled={isISL}
      onToggleISL={() => setIsISL(!isISL)}
      isListening={isListening}
      onToggleVoice={() => setIsListening(!isListening)}
      onBack={handleBack}
      onNext={handleNext}
      canGoBack={currentStep > 1}
      canGoNext={currentStep !== 1 || hasConsent}
      nextButtonLabel={currentStep === totalSteps ? t('kiosk.submitBtn') : t('kiosk.continueBtn')}
    >
      {/* Step 1: Patient Registration & Consent */}
      {currentStep === 1 && (
        <Card variant="kiosk" padding="kiosk">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 text-center">
            Patient Information & Identification
          </h2>
          <p className="text-slate-600 text-sm text-center mb-6">
            Please verify patient identification details for this clinical encounter.
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

      {/* Step 2: Chief Complaint */}
      {currentStep === 2 && (
        <Card variant="kiosk" padding="kiosk">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 text-center">
            What brings you to the clinic today?
          </h2>
          <p className="text-slate-600 text-sm text-center mb-8">
            Select your main symptom or speak into the microphone.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-xl mx-auto mb-8">
            {[
              { id: 'Fever', label: 'Fever (बुखार / ताप)', icon: '🌡️' },
              { id: 'Cough', label: 'Cough (खांसी / खोकला)', icon: '🗣️' },
              { id: 'Stomach Pain', label: 'Stomach Pain (पेट दर्द)', icon: '⚡' },
              { id: 'Headache', label: 'Headache (सिरदर्द / डोकेदुखी)', icon: '🤕' },
              { id: 'Chest Pain', label: 'Chest Discomfort', icon: '🫀' },
              { id: 'Other', label: 'Other Symptoms', icon: '📋' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setChiefComplaint(item.id)}
                className={`p-5 rounded-2xl border-3 text-center transition-all cursor-pointer ${
                  chiefComplaint === item.id
                    ? 'border-sky-500 bg-sky-50/90 shadow-md scale-102'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="font-bold text-slate-900 text-sm">{item.label}</div>
              </button>
            ))}
          </div>

          <div className="max-w-xl mx-auto p-4 bg-sky-50/50 rounded-2xl border border-sky-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <div className="text-xs text-slate-600">
                <span className="font-bold text-slate-800 block">Voice Dictation Available</span>
                Speak in Hindi, Marathi, or English using the mic button below.
              </div>
            </div>
            <Button
              variant={isListening ? 'danger' : 'outline'}
              size="sm"
              onClick={() => setIsListening(!isListening)}
            >
              {isListening ? 'Stop Mic' : 'Start Mic'}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Symptom Details & Onset */}
      {currentStep === 3 && (
        <Card variant="kiosk" padding="kiosk">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 text-center">
            Tell us more about your {chiefComplaint}
          </h2>
          <p className="text-slate-600 text-sm text-center mb-8">
            How long have you had this, and are there any other symptoms?
          </p>

          <div className="max-w-xl mx-auto space-y-6">
            {/* Duration */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Since when do you have this?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['Today', '2-3 days', '1 week+'].map((dur) => (
                  <button
                    key={dur}
                    onClick={() => setFeverDuration(dur)}
                    className={`py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer ${
                      feverDuration === dur
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    {dur}
                  </button>
                ))}
              </div>
            </div>

            {/* Associated Symptoms */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Do you have any of these additional symptoms?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Headache',
                  'Body ache / Chills',
                  'Vomiting / Nausea',
                  'Mosquito exposure',
                  'Loss of appetite',
                  'High shivering',
                ].map((symptom) => {
                  const isChecked = associatedSymptoms.includes(symptom);
                  return (
                    <button
                      key={symptom}
                      onClick={() => toggleSymptom(symptom)}
                      className={`p-3 rounded-xl border-2 text-left font-semibold text-xs flex items-center justify-between transition-all cursor-pointer ${
                        isChecked
                          ? 'border-sky-500 bg-sky-50/80 text-sky-900'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <span>{symptom}</span>
                      {isChecked && <Check className="w-4 h-4 text-sky-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Step 4: Document Upload */}
      {currentStep === 4 && (
        <Card variant="kiosk" padding="kiosk">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 text-center">
            Upload Old Prescriptions or Reports
          </h2>
          <p className="text-slate-600 text-sm text-center mb-8">
            Securely scan and attach prior medical records, prescriptions, or laboratory diagnostic reports.
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
                <div className="text-[11px] text-emerald-700">Digitization Complete • Paracetamol 650mg & CBC parameters detected</div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 px-2 py-0.5 rounded bg-emerald-100">
              Attached
            </span>
          </div>
        </Card>
      )}

      {/* Step 5: Review & Submit */}
      {currentStep === 5 && (
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
                  Extracted from Prescription
                </div>
                <span className="text-[11px] text-amber-700 font-semibold">Verified</span>
              </div>
              <div className="text-sm font-bold text-slate-900">
                Paracetamol 650mg TDS (3 days)
              </div>
              <div className="text-xs text-slate-500">Source: Uploaded medical record</div>
            </div>
          </div>
        </Card>
      )}
    </KioskShell>
  );
};
