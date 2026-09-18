import React, { useState, useEffect, useMemo } from 'react';
import {
  RotateCcw,
  Camera,
  Hand,
  VolumeX,
  Eye,
  ChevronRight,
} from 'lucide-react';

export type SignGestureKey =
  | 'GREETING'
  | 'FEVER'
  | 'PAIN_CHEST'
  | 'PAIN_STOMACH'
  | 'PAIN_HEAD'
  | 'COUGH'
  | 'BREATHLESSNESS'
  | 'RASH'
  | 'PAIN_BACK'
  | 'DURATION_1DAY'
  | 'DURATION_3DAYS'
  | 'DURATION_1WEEK'
  | 'QUESTION'
  | 'SEVERITY'
  | 'DOCUMENT'
  | 'YES'
  | 'NO'
  | 'SUCCESS'
  | 'IDLE';

interface IslAvatarProps {
  currentStep: number;
  questionId?: string;
  questionText?: string;
  questionGloss?: string;
  options?: Array<{ value: string; label: string; signKey?: SignGestureKey }>;
  onSelectOption?: (val: string, label: string) => void;
  onOpenSignCamera?: () => void;
  language?: string;
}

// Map questions & options to specific gestures
const getGestureForContext = (step: number, questionId?: string): SignGestureKey => {
  if (step === 1) return 'GREETING';
  if (step === 3) return 'DOCUMENT';
  if (step === 4) return 'SUCCESS';

  if (!questionId) return 'QUESTION';

  switch (questionId) {
    case 'CC_PRIMARY':
      return 'QUESTION';
    case 'FEVER_DURATION':
      return 'DURATION_3DAYS';
    case 'FEVER_GRADE':
      return 'FEVER';
    case 'FEVER_ASSOCIATED':
      return 'PAIN_HEAD';
    case 'SOCRATES_SITE':
      return 'PAIN_CHEST';
    case 'SOCRATES_ONSET':
      return 'QUESTION';
    case 'SOCRATES_CHARACTER':
      return 'PAIN_CHEST';
    case 'SOCRATES_RADIATION':
      return 'QUESTION';
    case 'SOCRATES_ASSOCIATED':
      return 'PAIN_STOMACH';
    case 'SOCRATES_TIMING':
      return 'DURATION_1WEEK';
    case 'SOCRATES_EXACERBATING':
      return 'QUESTION';
    case 'SOCRATES_SEVERITY':
      return 'SEVERITY';
    default:
      return 'QUESTION';
  }
};

const mapOptionToGesture = (val: string): SignGestureKey => {
  const v = val.toLowerCase();
  if (v.includes('fever')) return 'FEVER';
  if (v.includes('chest')) return 'PAIN_CHEST';
  if (v.includes('stomach') || v.includes('abdom')) return 'PAIN_STOMACH';
  if (v.includes('head')) return 'PAIN_HEAD';
  if (v.includes('cough')) return 'COUGH';
  if (v.includes('breath')) return 'BREATHLESSNESS';
  if (v.includes('rash') || v.includes('itch')) return 'RASH';
  if (v.includes('back')) return 'PAIN_BACK';
  if (v.includes('1 day')) return 'DURATION_1DAY';
  if (v.includes('2 to 3') || v.includes('3 days')) return 'DURATION_3DAYS';
  if (v.includes('1 week') || v.includes('4 to 7')) return 'DURATION_1WEEK';
  if (v.includes('yes') || v === 'true') return 'YES';
  if (v.includes('no') || v === 'false') return 'NO';
  return 'QUESTION';
};

export const IslAvatar: React.FC<IslAvatarProps> = ({
  currentStep,
  questionId,
  questionText,
  questionGloss,
  options = [],
  onSelectOption,
  onOpenSignCamera,
  language: _language = 'en',
}) => {
  const [interpreter, setInterpreter] = useState<'divya' | 'aarav'>('divya');
  const [speed, setSpeed] = useState<0.75 | 1 | 1.25>(1);
  const [activeGesture, setActiveGesture] = useState<SignGestureKey>('IDLE');
  const [animationTick, setAnimationTick] = useState(0);
  const [demonstratingSign, setDemonstratingSign] = useState<{
    label: string;
    gloss: string;
    key: SignGestureKey;
  } | null>(null);

  // Sync gesture whenever step or question changes
  useEffect(() => {
    const nextGesture = getGestureForContext(currentStep, questionId);
    setActiveGesture(nextGesture);
    setDemonstratingSign(null);
    setAnimationTick((t) => t + 1);
  }, [currentStep, questionId]);

  // Replay handler
  const handleReplay = () => {
    setAnimationTick((t) => t + 1);
  };

  // Preview an option's sign
  const handlePreviewSign = (label: string, gestureKey: SignGestureKey) => {
    setActiveGesture(gestureKey);
    setDemonstratingSign({
      label,
      gloss: gestureKey.replace('_', ' '),
      key: gestureKey,
    });
    setAnimationTick((t) => t + 1);
  };

  // Format ISL gloss tokens
  const glossTokens = useMemo(() => {
    if (demonstratingSign) {
      return [`[SIGN: ${demonstratingSign.gloss}]`];
    }
    if (questionGloss) {
      return questionGloss.split(' ').map((g) => `[${g.toUpperCase()}]`);
    }
    if (currentStep === 1) return ['[WELCOME]', '[PATIENT]', '[ABHA / ID]', '[CONFIRM]'];
    if (currentStep === 3) return ['[PRESCRIPTION / LAB]', '[DOCUMENT]', '[SCAN]'];
    if (currentStep === 4) return ['[INTAKE COMPLETE]', '[TOKEN NUMBER]', '[DOCTOR ROOM]'];
    return ['[DOCTOR QUESTION]', '[PLEASE POINT / CHOOSE]'];
  }, [demonstratingSign, questionGloss, currentStep]);

  // Duration in seconds according to speed
  const animDuration = 2.4 / speed;

  return (
    <div className="w-full bg-gradient-to-b from-teal-900 via-teal-950 to-slate-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border-2 border-teal-500/40 relative overflow-hidden flex flex-col">
      {/* Visual Ambient Glows */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Interpreter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-teal-800/60 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
            <Hand className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-teal-100 tracking-wide">
                ISL Medical Interpreter Avatar
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-teal-500/30 text-teal-300 border border-teal-400/30">
                ISLRTC Certified
              </span>
            </div>
            <div className="text-[11px] text-teal-300/80 flex items-center gap-1.5">
              <VolumeX className="w-3 h-3 text-amber-400" />
              <span>Silent Visual Signing • Designed for Deaf & Hard-of-Hearing</span>
            </div>
          </div>
        </div>

        {/* Interpreter Persona & Speed Selectors */}
        <div className="flex items-center gap-2">
          {/* Avatar Persona Switcher */}
          <div className="bg-teal-900/80 border border-teal-700/60 rounded-xl p-0.5 flex text-xs font-semibold">
            <button
              type="button"
              onClick={() => setInterpreter('divya')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                interpreter === 'divya'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                  : 'text-teal-200 hover:text-white'
              }`}
            >
              👩 Divya
            </button>
            <button
              type="button"
              onClick={() => setInterpreter('aarav')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                interpreter === 'aarav'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                  : 'text-teal-200 hover:text-white'
              }`}
            >
              👨 Aarav
            </button>
          </div>

          {/* Speed Buttons */}
          <div className="bg-teal-900/80 border border-teal-700/60 rounded-xl p-0.5 flex text-[11px] font-bold">
            {([0.75, 1, 1.25] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 rounded-lg transition-all ${
                  speed === s
                    ? 'bg-teal-400 text-slate-950 shadow-xs'
                    : 'text-teal-300 hover:text-white'
                }`}
                title={`Playback speed: ${s}x`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Replay */}
          <button
            type="button"
            onClick={handleReplay}
            className="p-1.5 rounded-xl bg-teal-800/70 hover:bg-teal-700 border border-teal-600/50 text-teal-200 hover:text-white transition-all active:scale-95"
            title="Replay Sign Gesture"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Avatar Stage & Animation View */}
      <div className="relative my-4 flex flex-col items-center justify-center min-h-[260px] sm:min-h-[290px] rounded-2xl bg-gradient-to-b from-teal-950/80 to-slate-900/90 border border-teal-800/40 p-4">
        {/* Active Sign Title / State Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-teal-500/30 text-xs font-semibold text-teal-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>
            Signing:{' '}
            <strong className="text-white">
              {demonstratingSign ? demonstratingSign.label : activeGesture.replace('_', ' ')}
            </strong>
          </span>
        </div>

        {/* Camera Gesture Recognition Trigger */}
        {onOpenSignCamera && (
          <button
            type="button"
            onClick={onOpenSignCamera}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 hover:text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Camera className="w-3.5 h-3.5 text-sky-300" />
            <span>Sign via Camera</span>
          </button>
        )}

        {/* Dynamic Vector ISL Avatar Character */}
        <div className="relative w-60 h-60 sm:w-68 sm:h-68 flex items-center justify-center">
          <InterpreterSvgCharacter
            key={`${interpreter}-${activeGesture}-${animationTick}`}
            interpreter={interpreter}
            gesture={activeGesture}
            duration={animDuration}
          />
        </div>

        {/* Non-manual facial/ISL grammar prompt */}
        <div className="mt-2 text-center">
          <span className="text-xs text-teal-300/90 font-medium">
            {activeGesture === 'QUESTION'
              ? 'Eyebrows raised • Open inquiry palms querying symptoms'
              : activeGesture === 'FEVER'
              ? 'Palm feeling forehead • Sensation of high temperature'
              : activeGesture === 'PAIN_CHEST'
              ? 'Clenched hand over sternum • Indicating thoracic pressure'
              : activeGesture === 'PAIN_STOMACH'
              ? 'Circular abdominal hand rubbing • Pointing to stomach ache'
              : activeGesture === 'PAIN_HEAD'
              ? 'Both hands pulsing at temples • Indicating acute cephalalgia'
              : activeGesture === 'COUGH'
              ? 'Cupped hand to mouth • Rhythmic chest motion'
              : activeGesture === 'BREATHLESSNESS'
              ? 'Both hands at chest • Expanded ribcage respiratory gesture'
              : activeGesture === 'DOCUMENT'
              ? 'Hands scanning prescription sheet • Digitize records'
              : activeGesture === 'GREETING'
              ? 'Namaste / Welcome greeting • Citizen intake identification'
              : activeGesture === 'SUCCESS'
              ? 'Affirmative thumbs up & ISL applause • Consultation queued'
              : 'Clear non-manual grammar and standard ISLRTC hand shapes'}
          </span>
        </div>
      </div>

      {/* ISL Grammar Gloss Subtitles */}
      <div className="p-3.5 rounded-2xl bg-teal-950/90 border border-teal-800/80 mb-4 shadow-inner">
        <div className="flex items-center justify-between text-[11px] font-bold text-teal-300 mb-1.5 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-teal-400" />
            <span>Official ISL Gloss Syntax (Sign Grammar)</span>
          </div>
          <span className="text-teal-400/80">ISLRTC Standard</span>
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          {glossTokens.map((token, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-lg bg-teal-900/90 border border-teal-500/50 text-white font-mono text-xs font-black shadow-xs tracking-wide"
            >
              {token}
            </span>
          ))}
        </div>
        {questionText && (
          <div className="text-xs text-teal-200/90 mt-2 font-medium italic border-t border-teal-800/60 pt-1.5">
            "{questionText}"
          </div>
        )}
      </div>

      {/* Interactive Option Sign Demonstrations (Deaf patient can preview or click to answer) */}
      {options && options.length > 0 && (
        <div className="mt-1">
          <div className="flex items-center justify-between text-xs font-bold text-teal-200 mb-2">
            <span>Symptom Signs for this Question (Click to Preview or Select):</span>
            <span className="text-[11px] text-teal-400 font-normal">
              Touch to demonstrate sign
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {options.map((opt) => {
              const gestureKey = opt.signKey || mapOptionToGesture(opt.value);
              const isCurrentPreview = demonstratingSign?.label === opt.label;
              return (
                <div
                  key={opt.value}
                  className={`p-2.5 rounded-xl border transition-all text-left flex flex-col justify-between ${
                    isCurrentPreview
                      ? 'bg-teal-500/30 border-teal-400 shadow-md ring-1 ring-teal-400'
                      : 'bg-slate-900/60 hover:bg-teal-900/50 border-teal-800/70 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-xs font-bold text-white truncate">{opt.label}</span>
                    <button
                      type="button"
                      onClick={() => handlePreviewSign(opt.label, gestureKey)}
                      className="px-1.5 py-0.5 rounded-md bg-teal-800 hover:bg-teal-700 text-teal-200 text-[10px] font-semibold border border-teal-600/50 shrink-0 cursor-pointer"
                      title="Demonstrate this sign on avatar"
                    >
                      Show Sign
                    </button>
                  </div>

                  {onSelectOption && (
                    <button
                      type="button"
                      onClick={() => onSelectOption(opt.value, opt.label)}
                      className="w-full mt-1 py-1 rounded-lg bg-teal-600/80 hover:bg-teal-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      <span>Choose</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// SVG Character Component with Dynamic Non-manual Markers and Hand Gestures
// =========================================================================

interface InterpreterSvgProps {
  interpreter: 'divya' | 'aarav';
  gesture: SignGestureKey;
  duration: number;
}

const InterpreterSvgCharacter: React.FC<InterpreterSvgProps> = ({
  interpreter,
  gesture,
  duration,
}) => {
  const isFemale = interpreter === 'divya';

  // Skin tones & clothing styles
  const skinTone = '#f5c396';
  const skinShadow = '#e0a97a';
  const hairColor = isFemale ? '#261b18' : '#1f1b1a';
  const shirtColor = isFemale ? '#0f766e' : '#0369a1';
  const tieOrScarf = isFemale ? '#14b8a6' : '#0284c7';

  // Determine gesture kinematics (transforms for left arm, right arm, head, mouth)
  const getKinematics = () => {
    switch (gesture) {
      case 'GREETING':
        return {
          leftArm: 'rotate(-25 90 140) translate(22, -28)',
          rightArm: 'rotate(25 150 140) translate(-22, -28)',
          headTilt: 'rotate(2 120 70)',
          mouthShape: 'M 112 85 Q 120 92 128 85',
          eyebrows: 'neutral',
        };
      case 'FEVER':
        return {
          leftArm: 'rotate(5 90 140)',
          rightArm: 'rotate(-55 150 140) translate(-28, -58)',
          headTilt: 'rotate(-4 120 70)',
          mouthShape: 'M 114 86 Q 120 88 126 86',
          eyebrows: 'concerned',
        };
      case 'PAIN_CHEST':
        return {
          leftArm: 'rotate(8 90 140)',
          rightArm: 'rotate(-25 150 140) translate(-24, -32)',
          headTilt: 'rotate(3 120 70)',
          mouthShape: 'M 115 87 Q 120 84 125 87',
          eyebrows: 'pain',
        };
      case 'PAIN_STOMACH':
        return {
          leftArm: 'rotate(18 90 140) translate(14, -8)',
          rightArm: 'rotate(-18 150 140) translate(-14, -8)',
          headTilt: 'rotate(4 120 70)',
          mouthShape: 'M 115 87 Q 120 85 125 87',
          eyebrows: 'pain',
        };
      case 'PAIN_HEAD':
        return {
          leftArm: 'rotate(45 90 140) translate(30, -56)',
          rightArm: 'rotate(-45 150 140) translate(-30, -56)',
          headTilt: 'rotate(0 120 70)',
          mouthShape: 'M 115 87 Q 120 84 125 87',
          eyebrows: 'pain',
        };
      case 'COUGH':
        return {
          leftArm: 'rotate(5 90 140)',
          rightArm: 'rotate(-40 150 140) translate(-26, -46)',
          headTilt: 'rotate(3 120 70)',
          mouthShape: 'M 116 87 Q 120 89 124 87',
          eyebrows: 'concerned',
        };
      case 'BREATHLESSNESS':
        return {
          leftArm: 'rotate(20 90 140) translate(18, -24)',
          rightArm: 'rotate(-20 150 140) translate(-18, -24)',
          headTilt: 'rotate(-3 120 70)',
          mouthShape: 'M 117 84 A 3 3 0 0 1 123 84',
          eyebrows: 'raised',
        };
      case 'DOCUMENT':
        return {
          leftArm: 'rotate(15 90 140) translate(12, -18)',
          rightArm: 'rotate(-15 150 140) translate(-12, -18)',
          headTilt: 'rotate(4 120 70)',
          mouthShape: 'M 115 86 Q 120 89 125 86',
          eyebrows: 'neutral',
        };
      case 'YES':
        return {
          leftArm: 'rotate(5 90 140)',
          rightArm: 'rotate(-25 150 140) translate(-20, -30)',
          headTilt: 'rotate(5 120 70)',
          mouthShape: 'M 114 85 Q 120 92 126 85',
          eyebrows: 'raised',
        };
      case 'NO':
        return {
          leftArm: 'rotate(5 90 140)',
          rightArm: 'rotate(-30 150 140) translate(-20, -35)',
          headTilt: 'rotate(-6 120 70)',
          mouthShape: 'M 115 87 Q 120 84 125 87',
          eyebrows: 'concerned',
        };
      case 'SEVERITY':
        return {
          leftArm: 'rotate(10 90 140) translate(5, 0)',
          rightArm: 'rotate(-45 150 140) translate(-25, -45)',
          headTilt: 'rotate(2 120 70)',
          mouthShape: 'M 115 86 Q 120 85 125 86',
          eyebrows: 'concerned',
        };
      case 'DURATION_1DAY':
      case 'DURATION_3DAYS':
      case 'DURATION_1WEEK':
        return {
          leftArm: 'rotate(15 90 140) translate(12, -20)',
          rightArm: 'rotate(-28 150 140) translate(-20, -34)',
          headTilt: 'rotate(3 120 70)',
          mouthShape: 'M 115 86 Q 120 89 125 86',
          eyebrows: 'raised',
        };
      case 'SUCCESS':
        return {
          leftArm: 'rotate(35 90 140) translate(24, -48)',
          rightArm: 'rotate(-35 150 140) translate(-24, -48)',
          headTilt: 'rotate(0 120 70)',
          mouthShape: 'M 112 85 Q 120 94 128 85',
          eyebrows: 'raised',
        };
      case 'QUESTION':
      default:
        return {
          leftArm: 'rotate(22 90 140) translate(16, -18)',
          rightArm: 'rotate(-22 150 140) translate(-16, -18)',
          headTilt: 'rotate(-3 120 70)',
          mouthShape: 'M 116 86 Q 120 90 124 86',
          eyebrows: 'raised',
        };
    }
  };

  const k = getKinematics();

  return (
    <svg
      viewBox="0 0 240 240"
      className="w-full h-full drop-shadow-2xl overflow-visible select-none"
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="labCoatGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
        <linearGradient id="shirtGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={shirtColor} />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <radialGradient id="haloGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#042f2e" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient Halo behind Interpreter */}
      <circle cx="120" cy="110" r="105" fill="url(#haloGrad)" />

      {/* Torso & Uniform Body */}
      <g id="torso">
        {/* Inner Professional Shirt */}
        <path d="M 92 125 L 148 125 L 152 230 L 88 230 Z" fill="url(#shirtGrad)" />

        {/* Doctor Lab Coat / Professional Jacket */}
        <path
          d="M 85 130 L 70 230 L 102 230 L 110 150 Z"
          fill="url(#labCoatGrad)"
          stroke="#cbd5e1"
          strokeWidth="1.5"
        />
        <path
          d="M 155 130 L 170 230 L 138 230 L 130 150 Z"
          fill="url(#labCoatGrad)"
          stroke="#cbd5e1"
          strokeWidth="1.5"
        />

        {/* Collar & Tie / Scarf */}
        <polygon points="120,132 114,120 126,120" fill={tieOrScarf} />
        <polygon points="116,132 124,132 122,175 118,175" fill={tieOrScarf} />

        {/* ISLRTC Interpreter ID Badge on Left Chest */}
        <rect
          x="94"
          y="155"
          width="18"
          height="24"
          rx="2"
          fill="#ffffff"
          stroke="#94a3b8"
          strokeWidth="1"
        />
        <rect x="96" y="157" width="14" height="6" fill="#0d9488" rx="1" />
        <line x1="97" y1="167" x2="109" y2="167" stroke="#64748b" strokeWidth="1.2" />
        <line x1="97" y1="171" x2="106" y2="171" stroke="#64748b" strokeWidth="1.2" />
        <circle cx="103" cy="154" r="1.5" fill="#475569" />
      </g>

      {/* Head & Facial Non-Manual Sign Language Markers */}
      <g id="head" style={{ transform: k.headTilt, transition: `transform ${duration}s ease-in-out` }}>
        {/* Neck */}
        <rect x="111" y="102" width="18" height="22" rx="4" fill={skinShadow} />

        {/* Hair Back for Female */}
        {isFemale && (
          <ellipse cx="120" cy="74" rx="34" ry="38" fill={hairColor} />
        )}

        {/* Face Shape */}
        <ellipse cx="120" cy="72" rx="26" ry="30" fill={skinTone} />

        {/* Ears */}
        <circle cx="94" cy="72" r="5" fill={skinShadow} />
        <circle cx="146" cy="72" r="5" fill={skinShadow} />

        {/* Hair Front / Styling */}
        {isFemale ? (
          <path
            d="M 94 65 C 96 38 144 38 146 65 C 138 52 102 52 94 65 Z"
            fill={hairColor}
          />
        ) : (
          <path
            d="M 94 62 C 94 40 146 40 146 62 C 140 48 100 48 94 62 Z"
            fill={hairColor}
          />
        )}

        {/* Eyebrows (Dynamic ISL Grammar Markers) */}
        {k.eyebrows === 'raised' ? (
          <g stroke="#2d1d17" strokeWidth="2" strokeLinecap="round">
            {/* Raised high for question inquiry */}
            <path d="M 104 57 Q 111 52 116 56" fill="none" />
            <path d="M 124 56 Q 129 52 136 57" fill="none" />
          </g>
        ) : k.eyebrows === 'pain' ? (
          <g stroke="#2d1d17" strokeWidth="2" strokeLinecap="round">
            {/* Slanted inner down for pain empathy */}
            <path d="M 104 59 Q 111 63 116 60" fill="none" />
            <path d="M 124 60 Q 129 63 136 59" fill="none" />
          </g>
        ) : k.eyebrows === 'concerned' ? (
          <g stroke="#2d1d17" strokeWidth="2" strokeLinecap="round">
            <path d="M 104 60 Q 111 58 116 61" fill="none" />
            <path d="M 124 61 Q 129 58 136 60" fill="none" />
          </g>
        ) : (
          <g stroke="#2d1d17" strokeWidth="2" strokeLinecap="round">
            <path d="M 104 59 Q 111 57 116 59" fill="none" />
            <path d="M 124 59 Q 129 57 136 59" fill="none" />
          </g>
        )}

        {/* Eyes (Engaged and Attentive) */}
        <g id="eyes">
          <ellipse cx="110" cy="67" rx="3.5" ry="3.8" fill="#1e293b" />
          <ellipse cx="130" cy="67" rx="3.5" ry="3.8" fill="#1e293b" />
          <circle cx="109" cy="66" r="1" fill="#ffffff" />
          <circle cx="129" cy="66" r="1" fill="#ffffff" />
        </g>

        {/* Nose */}
        <path
          d="M 120 68 L 118 75 L 122 75"
          fill="none"
          stroke={skinShadow}
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Mouth (Responsive Non-manual sign expression) */}
        <path
          d={k.mouthShape}
          fill="none"
          stroke="#b91c1c"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Cheeks blush */}
        <circle cx="105" cy="74" r="3" fill="#f87171" opacity="0.3" />
        <circle cx="135" cy="74" r="3" fill="#f87171" opacity="0.3" />
      </g>

      {/* Left Arm & Hand (Sign Language Articulation) */}
      <g
        id="left-arm"
        style={{
          transform: k.leftArm,
          transformOrigin: '90px 140px',
          transition: `transform ${duration}s cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      >
        {/* Upper Arm */}
        <path
          d="M 85 130 Q 72 165 80 185"
          fill="none"
          stroke="#ffffff"
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* Forearm */}
        <path
          d="M 80 185 Q 92 190 102 182"
          fill="none"
          stroke={skinTone}
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Left Hand Articulation */}
        <circle cx="104" cy="180" r="7" fill={skinTone} />
        {/* Fingers */}
        <circle cx="108" cy="177" r="3" fill={skinTone} />
        <circle cx="111" cy="180" r="2.8" fill={skinTone} />
        <circle cx="109" cy="184" r="2.5" fill={skinTone} />
      </g>

      {/* Right Arm & Hand (Primary Signing Hand) */}
      <g
        id="right-arm"
        style={{
          transform: k.rightArm,
          transformOrigin: '150px 140px',
          transition: `transform ${duration}s cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      >
        {/* Upper Arm */}
        <path
          d="M 155 130 Q 168 165 160 185"
          fill="none"
          stroke="#ffffff"
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* Forearm */}
        <path
          d="M 160 185 Q 148 190 138 182"
          fill="none"
          stroke={skinTone}
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Right Hand Articulation */}
        <circle cx="136" cy="180" r="7" fill={skinTone} />
        {/* Fingers */}
        <circle cx="132" cy="177" r="3" fill={skinTone} />
        <circle cx="129" cy="180" r="2.8" fill={skinTone} />
        <circle cx="131" cy="184" r="2.5" fill={skinTone} />
      </g>
    </svg>
  );
};
