import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface BodyZone {
  id: string;
  value: string;
  labelEn: string;
  labelHi: string;
  labelMr: string;
  icon: string;
  isRedFlag?: boolean;
}

const BODY_ZONES: BodyZone[] = [
  { id: 'chest', value: 'Chest', labelEn: 'Chest / Sternum', labelHi: 'छाती में', labelMr: 'छातीत', icon: '🫀', isRedFlag: true },
  { id: 'head', value: 'Head', labelEn: 'Head / Temples', labelHi: 'सिर / माथा', labelMr: 'डोके', icon: '🧠' },
  { id: 'abdomen_upper', value: 'Abdomen Upper', labelEn: 'Upper Abdomen / Stomach', labelHi: 'पेट के ऊपरी भाग में', labelMr: 'पोटाच्या वरच्या भागात', icon: '⚡' },
  { id: 'abdomen_lower', value: 'Abdomen Lower', labelEn: 'Lower Abdomen / Pelvic', labelHi: 'पेट के निचले भाग में', labelMr: 'पोटाच्या खालच्या भागात', icon: '🩺' },
  { id: 'back', value: 'Lower Back', labelEn: 'Lower Back / Spine', labelHi: 'कमर / पीठ', labelMr: 'कंबर / पाठीत', icon: '🦴' },
  { id: 'joints', value: 'Joints', labelEn: 'Joints (Knees/Hands)', labelHi: 'जोड़ों में', labelMr: 'सांध्यांमध्ये', icon: '🦵' },
  { id: 'other', value: 'Other', labelEn: 'Other Area', labelHi: 'अन्य स्थान', labelMr: 'इतर भाग', icon: '📍' },
];

interface SocratesBodyMapProps {
  selectedValue?: string;
  onSelect: (value: string, label: string) => void;
}

export const SocratesBodyMap: React.FC<SocratesBodyMapProps> = ({ selectedValue, onSelect }) => {
  const { language } = useLanguage();

  const getLabel = (zone: BodyZone) => {
    if (language === 'hi') return zone.labelHi;
    if (language === 'mr') return zone.labelMr;
    return zone.labelEn;
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200 mb-2">
          Touch Anatomical Selector • [S] Site
        </span>
        <p className="text-sm text-slate-600">
          Tap on the anatomical region where you feel the pain:
        </p>
      </div>

      {/* Grid of Large Touch Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
        {BODY_ZONES.map((zone) => {
          const isSelected = selectedValue === zone.value;
          const label = getLabel(zone);

          return (
            <button
              key={zone.id}
              type="button"
              onClick={() => onSelect(zone.value, label)}
              className={`p-4 rounded-2xl border-3 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[96px] ${
                isSelected
                  ? 'border-sky-500 bg-sky-50/90 shadow-md ring-2 ring-sky-300 ring-offset-2 scale-102'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-3xl">{zone.icon}</span>
                {zone.isRedFlag && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                    High Priority
                  </span>
                )}
                {isSelected && (
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                )}
              </div>
              <div className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                {label}
              </div>
              {language !== 'en' && (
                <div className="text-[11px] text-slate-500 font-medium">
                  {zone.labelEn}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
