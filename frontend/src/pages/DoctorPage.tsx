import React from 'react';
import { Stethoscope, ShieldCheck } from 'lucide-react';

export const DoctorPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xs border border-slate-200">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4">
          <Stethoscope className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Doctor Clinical Dashboard</h1>
        <p className="text-sm text-slate-600 mb-6">
          Phase 1 Foundation Ready. Clinical review, Accept/Amend/Reject workflow, longitudinal timeline, and FHIR export will be integrated in subsequent phases.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          Foundation Active
        </div>
      </div>
    </div>
  );
};
