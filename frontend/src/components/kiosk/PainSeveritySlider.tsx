import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface PainSeveritySliderProps {
  value?: number;
  onSelect: (value: number, label: string) => void;
}

interface SeverityTier {
  range: [number, number];
  icon: string;
  labelEn: string;
  labelHi: string;
  labelMr: string;
  colorClass: string;
  badgeClass: string;
}

const TIERS: SeverityTier[] = [
  { range: [1, 3], icon: '😊', labelEn: 'Mild Pain', labelHi: 'हल्का दर्द', labelMr: 'हलकी वेदना', colorClass: 'border-emerald-400 bg-emerald-50 text-emerald-900', badgeClass: 'bg-emerald-100 text-emerald-800' },
  { range: [4, 6], icon: '😐', labelEn: 'Moderate Pain', labelHi: 'मध्यम दर्द', labelMr: 'मध्यम वेदना', colorClass: 'border-amber-400 bg-amber-50 text-amber-900', badgeClass: 'bg-amber-100 text-amber-800' },
  { range: [7, 8], icon: '😣', labelEn: 'Severe Pain', labelHi: 'तेज असहज दर्द', labelMr: 'तीव्र वेदना', colorClass: 'border-orange-400 bg-orange-50 text-orange-900', badgeClass: 'bg-orange-100 text-orange-800' },
  { range: [9, 10], icon: '😭', labelEn: 'Worst Possible Pain', labelHi: 'असहनीय तेज दर्द', labelMr: 'असह्य तीव्र वेदना', colorClass: 'border-rose-500 bg-rose-50 text-rose-900', badgeClass: 'bg-rose-100 text-rose-800' },
];

export const PainSeveritySlider: React.FC<PainSeveritySliderProps> = ({ value = 5, onSelect }) => {
  const { language } = useLanguage();

  const currentTier = TIERS.find(t => value >= t.range[0] && value <= t.range[1]) || TIERS[1];

  const getTierLabel = (tier: SeverityTier) => {
    if (language === 'hi') return tier.labelHi;
    if (language === 'mr') return tier.labelMr;
    return tier.labelEn;
  };

  const getNumberColor = (n: number) => {
    if (n <= 3) return 'hover:border-emerald-500 hover:bg-emerald-50';
    if (n <= 6) return 'hover:border-amber-500 hover:bg-amber-50';
    if (n <= 8) return 'hover:border-orange-500 hover:bg-orange-50';
    return 'hover:border-rose-500 hover:bg-rose-50';
  };

  const getActiveNumberColor = (n: number) => {
    if (n <= 3) return 'border-emerald-600 bg-emerald-600 text-white shadow-emerald-200';
    if (n <= 6) return 'border-amber-500 bg-amber-500 text-white shadow-amber-200';
    if (n <= 8) return 'border-orange-600 bg-orange-600 text-white shadow-orange-200';
    return 'border-rose-600 bg-rose-600 text-white shadow-rose-200 ring-2 ring-rose-400 animate-pulse';
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Current Selection Display */}
      <div className={`p-5 rounded-2xl border-2 text-center transition-all ${currentTier.colorClass} shadow-xs`}>
        <div className="text-5xl mb-2">{currentTier.icon}</div>
        <div className="text-2xl sm:text-3xl font-black mb-1">
          {value} / 10
        </div>
        <div className="font-bold text-base sm:text-lg">
          {getTierLabel(currentTier)}
        </div>
        {value >= 9 && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs">
            ⚠️ Clinical Alert: Severe Pain Priority
          </div>
        )}
      </div>

      {/* 1 to 10 Large Touch Buttons */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold text-slate-500 px-1">
          <span>1 (Mild)</span>
          <span>5 (Moderate)</span>
          <span>10 (Worst Possible)</span>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-2.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
            const isSelected = value === num;
            return (
              <button
                key={num}
                type="button"
                onClick={() => onSelect(num, `${num} / 10 - ${getTierLabel(currentTier)}`)}
                className={`h-14 sm:h-16 rounded-xl border-3 font-black text-lg sm:text-xl transition-all duration-150 cursor-pointer shadow-xs flex items-center justify-center ${
                  isSelected
                    ? `${getActiveNumberColor(num)} shadow-lg scale-108`
                    : `border-slate-200 bg-white text-slate-800 ${getNumberColor(num)}`
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
