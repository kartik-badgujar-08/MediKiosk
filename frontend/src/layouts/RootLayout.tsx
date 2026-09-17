import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Activity, 
  ShieldCheck, 
  Stethoscope, 
  User, 
  AlertTriangle, 
  LogIn, 
  LogOut, 
  CheckCircle2,
  Globe
} from 'lucide-react';
import { api, type HealthResponse } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage, SUPPORTED_LANGUAGES, type LanguageCode } from '../context/LanguageContext';

export const RootLayout: React.FC = () => {
  const location = useLocation();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);

  const { role, patientProfile, doctorProfile, logout, isAuthenticated } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await api.checkRootHealth();
        setHealth(res);
        setIsBackendConnected(true);
      } catch (err) {
        console.warn('Backend health check failed:', err);
        setIsBackendConnected(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, []);

  const isKioskMode = location.pathname.startsWith('/kiosk');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Top Header / Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
                <Activity className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                  {t('app.title')}
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ABDM Network
                  </span>
                </span>
                <span className="text-xs text-slate-500 block -mt-0.5">
                  {t('app.subtitle')}
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation links & Global Language Switcher */}
          <nav className="flex items-center gap-2 sm:gap-3.5">
            {/* Global Language Selector */}
            <div className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200/80 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 transition-all">
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-700 shrink-0" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="bg-transparent text-xs font-bold text-slate-800 cursor-pointer focus:outline-none pr-1"
                aria-label="Website Language Selector"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.native}
                  </option>
                ))}
              </select>
            </div>

            <Link
              to="/kiosk"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                isKioskMode
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-sky-600 hover:bg-sky-50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{t('nav.kiosk')}</span>
            </Link>

            <Link
              to="/doctor"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                location.pathname.startsWith('/doctor')
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-teal-600 hover:bg-teal-50'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>{t('nav.doctor')}</span>
            </Link>

            {/* Authenticated Government User Badge or Login Button */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                {role === 'patient' && patientProfile && (
                  <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                    <span className="font-bold">{patientProfile.name}</span>
                    <span className="font-mono text-[10px] text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">
                      ABHA: {patientProfile.abha_number}
                    </span>
                  </div>
                )}

                {role === 'doctor' && doctorProfile && (
                  <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    <span className="font-bold">{doctorProfile.full_name}</span>
                    <span className="font-mono text-[10px] text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded">
                      {doctorProfile.registration_number}
                    </span>
                  </div>
                )}

                <button
                  onClick={logout}
                  title="Logout Government Identity Session"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-amber-600" />
                <span>{t('nav.login')}</span>
              </Link>
            )}

            {/* Backend connectivity badge */}
            <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-200">
              {isBackendConnected === true ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {t('nav.connected')}
                </span>
              ) : isBackendConnected === false ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  {t('nav.disconnected')}
                </span>
              ) : null}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Clinical Disclaimer Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 justify-center">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <strong>Clinical Notice:</strong> Patient history is gathered for clinician review. System does not provide autonomous medical diagnosis.
          </p>
          <p className="text-slate-400">
            MediKiosk {health ? `v${health.version}` : 'v1.0.0'} • National Digital Health Network • Clinical Intake
          </p>
        </div>
      </footer>
    </div>
  );
};
