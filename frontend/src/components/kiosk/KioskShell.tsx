import React, { useState } from 'react';
import { 
  Mic, 
  Hand, 
  ArrowLeft, 
  ArrowRight, 
  Globe2, 
  AlertTriangle,
  RotateCcw,
  SkipForward
} from 'lucide-react';
import { Button } from '../ui/Button';

export type LanguageCode = 'en' | 'hi' | 'mr';

export interface KioskShellProps {
  currentStep: number;
  totalSteps: number;
  stepCategory?: string;
  selectedLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  isISLEnabled: boolean;
  onToggleISL: () => void;
  isListening?: boolean;
  onToggleVoice: () => void;
  onRepeatAudio?: () => void;
  onBack: () => void;
  onNext: () => void;
  onSkip?: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
  nextButtonLabel?: string;
  children: React.ReactNode;
}

export const KioskShell: React.FC<KioskShellProps> = ({
  currentStep,
  totalSteps,
  stepCategory = 'Intake Question',
  selectedLanguage,
  onLanguageChange,
  isISLEnabled,
  onToggleISL,
  isListening = false,
  onToggleVoice,
  onRepeatAudio,
  onBack,
  onNext,
  onSkip,
  canGoBack,
  canGoNext,
  nextButtonLabel = 'Continue',
  children,
}) => {
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const languages: { code: LanguageCode; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिंदी' },
    { code: 'mr', label: 'Marathi', native: 'मराठी' },
  ];

  const percentage = Math.min(Math.round((currentStep / Math.max(totalSteps, 1)) * 100), 100);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 relative select-none">
      {/* Kiosk Top Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          {/* Language Selector */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Globe2 className="w-5 h-5 text-slate-500 hidden sm:block" />
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => onLanguageChange(lang.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedLanguage === lang.code
                      ? 'bg-white text-sky-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  aria-label={`Select ${lang.label}`}
                >
                  <span className="sm:inline">{lang.native}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Accessibility Buttons (ISL & Audio & Emergency) */}
          <div className="flex items-center gap-2">
            {/* ISL Toggle */}
            <button
              onClick={onToggleISL}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                isISLEnabled
                  ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                  : 'bg-white text-teal-700 border-teal-200 hover:bg-teal-50'
              }`}
              title="Toggle Indian Sign Language mode"
            >
              <Hand className="w-4 h-4" />
              <span className="hidden sm:inline">ISL Mode</span>
            </button>

            {/* Emergency Staff Button */}
            <button
              onClick={() => setShowEmergencyModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span className="hidden sm:inline">Emergency Help</span>
            </button>
          </div>
        </div>
      </div>

      {/* Question Progress Tracker */}
      <div className="w-full bg-white border-b border-slate-200 px-4 sm:px-8 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700 mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-xs font-bold">
              Question {currentStep} of {totalSteps}
            </span>
            <span className="text-slate-500 font-medium">• {stepCategory}</span>
          </div>
          <span className="text-slate-500 font-medium">{percentage}%</span>
        </div>
        <div className="max-w-4xl mx-auto h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-teal-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Main Interactive Work Area */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
        {children}
      </div>

      {/* Bottom Kiosk Action Bar */}
      <div className="bg-white border-t border-slate-200 p-4 sm:p-6 shadow-md sticky bottom-0 z-30">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Back Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={onBack}
              disabled={!canGoBack}
              leftIcon={<ArrowLeft className="w-5 h-5" />}
              className="min-h-[56px] text-base"
            >
              Back
            </Button>

            {onRepeatAudio && (
              <Button
                variant="outline"
                size="lg"
                onClick={onRepeatAudio}
                leftIcon={<RotateCcw className="w-5 h-5 text-sky-600" />}
                className="min-h-[56px] text-base"
                title="Repeat audio of this question"
              >
                <span className="hidden sm:inline">Repeat Audio</span>
              </Button>
            )}
          </div>

          {/* Voice Input Center Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleVoice}
              className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-base transition-all shadow-sm ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-200'
                  : 'bg-sky-50 text-sky-700 border-2 border-sky-300 hover:bg-sky-100'
              }`}
            >
              <Mic className={`w-5 h-5 ${isListening ? 'text-white' : 'text-sky-600'}`} />
              <span>{isListening ? 'Listening...' : 'Speak Answer'}</span>
            </button>
          </div>

          {/* Skip & Continue Navigation */}
          <div className="flex items-center gap-2">
            {onSkip && (
              <Button
                variant="ghost"
                size="lg"
                onClick={onSkip}
                rightIcon={<SkipForward className="w-5 h-5 text-slate-500" />}
                className="min-h-[56px] text-base text-slate-500"
              >
                Skip
              </Button>
            )}

            <Button
              variant="primary"
              size="kiosk"
              onClick={onNext}
              disabled={!canGoNext}
              rightIcon={<ArrowRight className="w-6 h-6" />}
              className="min-h-[56px] py-3.5 text-base px-8 font-bold"
            >
              {nextButtonLabel}
            </Button>
          </div>
        </div>
      </div>

      {/* Emergency Help Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-4 border-rose-500 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 text-center mb-2">
              Medical Emergency Warning
            </h3>
            <p className="text-slate-700 text-center text-sm leading-relaxed mb-6">
              If you or the patient are experiencing <strong>severe chest pain, difficulty breathing, acute heavy bleeding, loss of consciousness, or severe allergic reaction</strong>:
            </p>
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center text-rose-800 font-semibold text-sm mb-6">
              🚨 Please press the call button or alert the nearest hospital staff immediately!
            </div>
            <Button
              variant="danger"
              size="lg"
              onClick={() => setShowEmergencyModal(false)}
              className="w-full"
            >
              I Understand — Return to Kiosk
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
