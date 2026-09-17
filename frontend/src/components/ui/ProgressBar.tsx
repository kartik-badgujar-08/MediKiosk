import React from 'react';

export interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabel?: string;
  category?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  stepLabel,
  category,
}) => {
  const percentage = Math.min(Math.round((currentStep / Math.max(totalSteps, 1)) * 100), 100);

  return (
    <div className="w-full bg-white px-6 py-4 border-b border-slate-200">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between text-sm font-semibold text-slate-700 mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-xs font-bold">
              Question {currentStep} of {totalSteps}
            </span>
            {category && <span className="text-slate-500 font-medium">• {category}</span>}
          </div>
          <span className="text-slate-500 font-medium">{percentage}% completed</span>
        </div>

        {/* Progress Track */}
        <div 
          className="w-full h-3 bg-slate-100 rounded-full overflow-hidden" 
          role="progressbar" 
          aria-valuenow={percentage} 
          aria-valuemin={0} 
          aria-valuemax={100}
        >
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-teal-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {stepLabel && (
          <div className="mt-1.5 text-xs text-slate-500 font-medium">
            {stepLabel}
          </div>
        )}
      </div>
    </div>
  );
};
