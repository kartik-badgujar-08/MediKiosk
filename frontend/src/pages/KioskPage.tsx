import React from 'react';
import { User, Sparkles } from 'lucide-react';

export const KioskPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xs border border-slate-200">
        <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Patient Kiosk Shell</h1>
        <p className="text-sm text-slate-600 mb-6">
          Phase 1 Foundation Ready. Adaptive interview workflow, multilingual voice, sign language, and document ingestion will be activated in subsequent phases.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Foundation Active
        </div>
      </div>
    </div>
  );
};
