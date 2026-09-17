import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Stethoscope, 
  Mic, 
  Hand, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  GitBranch,
  Database,
  Loader2,
  Check
} from 'lucide-react';
import { api } from '../services/api';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      await api.seedDemoData();
      setSeedSuccess(true);
      setTimeout(() => {
        setSeedSuccess(false);
        navigate('/doctor');
      }, 1200);
    } catch (err) {
      console.error('Failed to seed demo data:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-center">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5 text-sky-500" />
          SIH26047 – First-Mile Clinical Intake System
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Intelligent Clinical Case-Taking with Multimodal Accessibility
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
          MediKiosk captures patient medical history through Touch, Multilingual Voice, 
          Indian Sign Language (ISL), and Document OCR into a structured, FHIR-ready Canonical Clinical State.
        </p>

        {/* 1-Click Seed Demo Button */}
        <div className="mt-6 flex items-center justify-center">
          <button
            onClick={handleSeedDemo}
            disabled={isSeeding || seedSuccess}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all disabled:opacity-70 cursor-pointer"
          >
            {isSeeding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : seedSuccess ? (
              <Check className="w-4 h-4 text-emerald-300" />
            ) : (
              <Database className="w-4 h-4 text-violet-200" />
            )}
            <span>
              {isSeeding
                ? 'Seeding Scenarios...'
                : seedSuccess
                ? 'Demo Data Seeded! Redirecting...'
                : 'Seed Demo Scenarios (Rahul & Sunita ISL)'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Mode Entry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full mb-12">
        {/* Patient Kiosk Card */}
        <div className="bg-white rounded-2xl border-2 border-sky-100 hover:border-sky-400 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
              <User className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Patient Intake Kiosk</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Designed for touchscreens with high accessibility, multilingual voice, SOCRATES pain mapping,
              Indian Sign Language support, and past document upload.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-700 font-medium mb-8">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                English, Hindi & Marathi voice input (IndicConformer)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                Indian Sign Language (ISLRTC vocabulary)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                Prescription & Lab Report digitization (PaddleOCR)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                Patient review & correction before submission
              </li>
            </ul>
          </div>
          <Link
            to="/kiosk"
            className="w-full py-3.5 px-6 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-center shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
          >
            <User className="w-5 h-5" />
            Launch Patient Kiosk
          </Link>
        </div>

        {/* Doctor Dashboard Card */}
        <div className="bg-white rounded-2xl border-2 border-teal-100 hover:border-teal-400 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Doctor Clinical Dashboard</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Clinical decision workspace with red-flag detection, field-by-field Accept/Amend/Reject 
              provenance verification, FHIR R4 export, and ABDM integration.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-700 font-medium mb-8">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                Deterministic red flag safety rule alerts
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                Accept / Amend / Reject data verification
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                Longitudinal patient timeline across encounters
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                FHIR R4 bundle generation & ABDM/HIS adapter
              </li>
            </ul>
          </div>
          <Link
            to="/doctor"
            className="w-full py-3.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-center shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
          >
            <Stethoscope className="w-5 h-5" />
            Open Doctor Dashboard
          </Link>
        </div>
      </div>

      {/* Multimodal Pillars Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto w-full">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-50 text-sky-600">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Multilingual Voice</div>
            <div className="text-[11px] text-slate-500">IndicConformer ASR</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <Hand className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Sign Accessibility</div>
            <div className="text-[11px] text-slate-500">ISLRTC Dictionary</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-teal-50 text-teal-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Document OCR</div>
            <div className="text-[11px] text-slate-500">PaddleOCR & Structure</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Interoperability</div>
            <div className="text-[11px] text-slate-500">FHIR R4 & ABDM</div>
          </div>
        </div>
      </div>
    </div>
  );
};
