import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Activity, ShieldCheck, Stethoscope, User, AlertTriangle } from 'lucide-react';
import { api, type HealthResponse } from '../services/api';

export const RootLayout: React.FC = () => {
  const location = useLocation();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);

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
                  MediKiosk
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-sky-100 text-sky-700">
                    SIH26047
                  </span>
                </span>
                <span className="text-xs text-slate-500 block -mt-0.5">
                  Multimodal Clinical Intake Assistant
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation links */}
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/kiosk"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                isKioskMode
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-sky-600 hover:bg-sky-50'
              }`}
            >
              <User className="w-4 h-4" />
              Patient Kiosk
            </Link>

            <Link
              to="/doctor"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                location.pathname.startsWith('/doctor')
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-teal-600 hover:bg-teal-50'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              Doctor Dashboard
            </Link>

            {/* Backend connectivity badge */}
            <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-slate-200">
              {isBackendConnected === true ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Connected
                </span>
              ) : isBackendConnected === false ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  API Disconnected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  Checking...
                </span>
              )}
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
            <strong>Clinical Safety Notice:</strong> MediKiosk is an intake assistant and does not provide autonomous medical diagnosis. All records require clinician review and verification.
          </p>
          <p className="text-slate-400">
            MediKiosk {health ? `v${health.version}` : 'v1.0.0'} • HealthTech First-Mile Intake
          </p>
        </div>
      </footer>
    </div>
  );
};
