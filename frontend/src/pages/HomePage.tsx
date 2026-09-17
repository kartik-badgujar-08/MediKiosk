import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Stethoscope, 
  Mic, 
  Hand, 
  FileText, 
  CheckCircle2, 
  GitBranch,
  Database,
  Loader2,
  Check,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
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
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-4">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          {t('home.heroBadge')}
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {t('home.heroTitle')}
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
          {t('home.heroSubtitle')}
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-amber-100" />
            <span>{t('home.btnGovLogin')}</span>
          </Link>

          <button
            onClick={handleSeedDemo}
            disabled={isSeeding || seedSuccess}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all disabled:opacity-70 cursor-pointer"
          >
            {isSeeding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : seedSuccess ? (
              <Check className="w-4 h-4 text-emerald-200" />
            ) : (
              <Database className="w-4 h-4 text-teal-200" />
            )}
            <span>
              {isSeeding
                ? 'Loading Scenarios...'
                : seedSuccess
                ? 'Demo Data Ready! Redirecting...'
                : t('home.btnSeedDemo')}
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
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('home.kioskCardTitle')}</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              {t('home.kioskCardDesc')}
            </p>
            <ul className="space-y-2.5 text-xs text-slate-700 font-medium mb-8">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                {t('home.voiceFeature')} (English, Hindi, Marathi)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                {t('home.signFeature')}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                {t('home.ocrFeature')}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                Audio-Guided Health Data Consent
              </li>
            </ul>
          </div>
          <Link
            to="/kiosk"
            className="w-full py-3.5 px-6 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-center shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
          >
            <User className="w-5 h-5" />
            {t('home.kioskCardBtn')}
          </Link>
        </div>

        {/* Doctor Dashboard Card */}
        <div className="bg-white rounded-2xl border-2 border-teal-100 hover:border-teal-400 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('home.doctorCardTitle')}</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              {t('home.doctorCardDesc')}
            </p>
            <ul className="space-y-2.5 text-xs text-slate-700 font-medium mb-8">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                Deterministic safety rule alerts & red flags
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                Accept / Amend / Reject data verification
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                Longitudinal patient timeline across past encounters
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                ABDM digital health records integration
              </li>
            </ul>
          </div>
          <Link
            to="/doctor"
            className="w-full py-3.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-center shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
          >
            <Stethoscope className="w-5 h-5" />
            {t('home.doctorCardBtn')}
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
            <div className="text-xs font-bold text-slate-900">Voice Dictation</div>
            <div className="text-[11px] text-slate-500">Speech-to-Text Intake</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <Hand className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Sign Language</div>
            <div className="text-[11px] text-slate-500">Visual Video Assistance</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-teal-50 text-teal-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Report Scanning</div>
            <div className="text-[11px] text-slate-500">Automated Lab Digitization</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Digital Health</div>
            <div className="text-[11px] text-slate-500">ABDM & FHIR Standards</div>
          </div>
        </div>
      </div>
    </div>
  );
};
