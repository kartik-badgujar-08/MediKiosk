import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  User,
  Stethoscope,
  KeyRound,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles,
  Building2,
  CreditCard,
  Award,
} from 'lucide-react';
import { api, type MedicalCouncilItem, type ABHAProfile, type HPRDoctorProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginPatient, loginDoctor } = useAuth();

  // Initial tab based on query param ?role=doctor or ?role=patient
  const initialTab = searchParams.get('role') === 'doctor' ? 'doctor' : 'patient';
  const [activeTab, setActiveTab] = useState<'patient' | 'doctor'>(initialTab);

  // -------------------------------------------------------------
  // Patient State
  // -------------------------------------------------------------
  const [patientMode, setPatientMode] = useState<'abha' | 'qr'>('abha');
  const [abhaInput, setAbhaInput] = useState('91-4820-1928-3819');
  const [patientTxnId, setPatientTxnId] = useState('');
  const [patientMasked, setPatientMasked] = useState('');
  const [patientOtp, setPatientOtp] = useState('');
  const [patientStep, setPatientStep] = useState<'input' | 'otp' | 'verified'>('input');
  const [verifiedPatient, setVerifiedPatient] = useState<ABHAProfile | null>(null);

  // -------------------------------------------------------------
  // Doctor State
  // -------------------------------------------------------------
  const [docAuthType, setDocAuthType] = useState<'hpr' | 'smc'>('hpr');
  const [hprIdInput, setHprIdInput] = useState('dr.anita.desai@hpr');
  const [regNoInput, setRegNoInput] = useState('MMC-2018-09281');
  const [selectedCouncil, setSelectedCouncil] = useState('Maharashtra Medical Council');
  const [councils, setCouncils] = useState<MedicalCouncilItem[]>([]);
  const [doctorTxnId, setDoctorTxnId] = useState('');
  const [doctorMasked, setDoctorMasked] = useState('');
  const [doctorNamePreview, setDoctorNamePreview] = useState('');
  const [doctorOtp, setDoctorOtp] = useState('');
  const [doctorStep, setDoctorStep] = useState<'input' | 'otp' | 'verified'>('input');
  const [verifiedDoctor, setVerifiedDoctor] = useState<HPRDoctorProfile | null>(null);

  // -------------------------------------------------------------
  // Shared UI Feedback
  // -------------------------------------------------------------
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchCouncils = async () => {
      try {
        const list = await api.getMedicalCouncils();
        setCouncils(list);
      } catch (err) {
        console.warn('Could not fetch state medical councils:', err);
      }
    };
    fetchCouncils();
  }, []);

  // -------------------------------------------------------------
  // Patient Handlers
  // -------------------------------------------------------------
  const handleInitiatePatient = async (idToUse?: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    const targetId = idToUse || abhaInput;
    try {
      const res = await api.initAbhaAuth(targetId, 'MOBILE_OTP');
      setPatientTxnId(res.txn_id);
      setPatientMasked(res.masked_recipient);
      setPatientStep('otp');
      setPatientOtp('123456'); // prefill official sandbox test OTP for frictionless testing
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initiate ABDM authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPatientOtp = async () => {
    if (!patientOtp || patientOtp.length < 4) {
      setErrorMsg('Please enter the 6-digit OTP sent via ABDM');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.verifyAbhaOtp(patientTxnId, patientOtp);
      setVerifiedPatient(res.profile);
      setPatientStep('verified');
      loginPatient(res.profile, res.access_token);
    } catch (err: any) {
      setErrorMsg(err.message || 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateQrScan = async (sampleProfile: 'rahul' | 'sunita') => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const payload =
        sampleProfile === 'rahul'
          ? JSON.stringify({
              hid: '91-4820-1928-3819',
              phr: 'rahul.sharma@abdm',
              name: 'Rahul Sharma',
              gender: 'M',
              dob: '1998-05-14',
            })
          : JSON.stringify({
              hid: '91-8841-2091-5821',
              phr: 'sunita.patil@abdm',
              name: 'Sunita Patil',
              gender: 'F',
              dob: '1981-11-20',
            });

      const res = await api.scanAbhaQr(payload);
      setVerifiedPatient(res.profile);
      setPatientStep('verified');
      loginPatient(res.profile, res.access_token);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to scan and verify ABDM QR');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Doctor Handlers
  // -------------------------------------------------------------
  const handleInitiateDoctor = async (presetId?: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const hprVal = presetId || (docAuthType === 'hpr' ? hprIdInput : undefined);
      const regVal = docAuthType === 'smc' ? regNoInput : undefined;
      const res = await api.initHprAuth({
        hprId: hprVal,
        registrationNumber: regVal,
        stateMedicalCouncil: selectedCouncil,
      });
      setDoctorTxnId(res.txn_id);
      setDoctorMasked(res.masked_mobile);
      setDoctorNamePreview(res.doctor_name);
      setDoctorStep('otp');
      setDoctorOtp('123456'); // prefill sandbox test OTP
    } catch (err: any) {
      setErrorMsg(err.message || 'Healthcare Professionals Registry lookup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyDoctorOtp = async () => {
    if (!doctorOtp || doctorOtp.length < 4) {
      setErrorMsg('Please enter the 6-digit OTP');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.verifyHprOtp(doctorTxnId, doctorOtp);
      setVerifiedDoctor(res.profile);
      setDoctorStep('verified');
      loginDoctor(res.profile, res.access_token);
    } catch (err: any) {
      setErrorMsg(err.message || 'Doctor OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-center">
      {/* Official Government Tricolor Bar */}
      <div className="w-full h-1.5 rounded-full overflow-hidden flex shadow-xs mb-6">
        <div className="flex-1 bg-amber-500"></div>
        <div className="flex-1 bg-white border-y border-slate-200"></div>
        <div className="flex-1 bg-emerald-600"></div>
      </div>

      {/* Official Heading */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold mb-3">
          <ShieldCheck className="w-4 h-4 text-sky-600" />
          National Health Authority • Ayushman Bharat Digital Mission (ABDM)
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Government Digital Health Identity Portal
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
          Secure, verified authentication for Citizens via <strong>ABHA</strong> and Clinicians via{' '}
          <strong>HPR / National Medical Commission (NMC)</strong>.
        </p>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span className="flex-1">{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-xs font-bold text-red-800 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Portal Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50/70 p-2 gap-2">
          <button
            onClick={() => {
              setActiveTab('patient');
              setErrorMsg(null);
            }}
            className={`py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              activeTab === 'patient'
                ? 'bg-white text-sky-700 shadow-sm border border-sky-100'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <User className="w-5 h-5 text-sky-500" />
            <span>Citizen / Patient (ABHA)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('doctor');
              setErrorMsg(null);
            }}
            className={`py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              activeTab === 'doctor'
                ? 'bg-white text-teal-700 shadow-sm border border-teal-100'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Stethoscope className="w-5 h-5 text-teal-600" />
            <span>Doctor / Clinician (HPR / NMC)</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* PATIENT TAB CONTENT */}
        {/* ========================================================================= */}
        {activeTab === 'patient' && (
          <div className="p-6 sm:p-8">
            {patientStep === 'input' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Ayushman Bharat Health Account (ABHA) Login
                    </h2>
                    <p className="text-xs text-slate-500">
                      Official Milestone 1 (M1) Citizen Identification
                    </p>
                  </div>
                  {/* Mode switcher */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => setPatientMode('abha')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        patientMode === 'abha' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      ABHA ID / Mobile
                    </button>
                    <button
                      onClick={() => setPatientMode('qr')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        patientMode === 'qr' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Scan & Share QR
                    </button>
                  </div>
                </div>

                {patientMode === 'abha' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Enter 14-Digit ABHA Number or ABHA Address
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={abhaInput}
                          onChange={(e) => setAbhaInput(e.target.value)}
                          placeholder="e.g. 91-4820-1928-3819 or rahul.sharma@abdm"
                          className="w-full px-4 py-3.5 pl-11 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-900 font-mono text-sm"
                        />
                        <CreditCard className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>

                    {/* Pre-seeded Test Profiles Chips */}
                    <div>
                      <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                        Quick Test Identities (ABDM Sandbox Pre-Seeded):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAbhaInput('91-4820-1928-3819');
                            handleInitiatePatient('91-4820-1928-3819');
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 flex items-center gap-1.5 cursor-pointer"
                        >
                          <User className="w-3.5 h-3.5" />
                          Rahul Sharma (Fever • 91-4820-1928-3819)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAbhaInput('91-8841-2091-5821');
                            handleInitiatePatient('91-8841-2091-5821');
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 cursor-pointer"
                        >
                          <User className="w-3.5 h-3.5" />
                          Sunita Patil (ISL • 91-8841-2091-5821)
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleInitiatePatient()}
                      disabled={isLoading || !abhaInput.trim()}
                      className="w-full py-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <KeyRound className="w-5 h-5" />
                          <span>Request OTP via ABDM Gateway</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  /* QR SCAN MODE */
                  <div className="space-y-6 text-center py-4">
                    <div className="max-w-xs mx-auto p-6 rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50/50 flex flex-col items-center">
                      <QrCode className="w-16 h-16 text-sky-600 mb-3" />
                      <h3 className="text-sm font-bold text-slate-800">
                        Scan & Share ABHA QR Code
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Citizens can present their official ABHA card QR or Aarogya Setu / ABHA app.
                      </p>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-slate-500 mb-2">
                        Simulate Citizen QR Presentation:
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleSimulateQrScan('rahul')}
                          disabled={isLoading}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-100 hover:bg-sky-200 text-sky-800 border border-sky-300 cursor-pointer"
                        >
                          Scan Rahul Sharma's QR
                        </button>
                        <button
                          onClick={() => handleSimulateQrScan('sunita')}
                          disabled={isLoading}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 cursor-pointer"
                        >
                          Scan Sunita Patil's QR
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PATIENT STEP 2: OTP VERIFICATION */}
            {patientStep === 'otp' && (
              <div className="space-y-6 max-w-md mx-auto py-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Enter ABDM OTP</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    A 6-digit authentication OTP was sent to mobile linked with{' '}
                    <strong>{patientMasked}</strong>
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                    <Sparkles className="w-3.5 h-3.5" />
                    ABDM Sandbox Mode: Test OTP is <strong>123456</strong>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 text-center">
                    6-Digit One-Time Password
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={patientOtp}
                    onChange={(e) => setPatientOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-300 text-center font-mono text-2xl tracking-widest text-slate-900 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setPatientStep('input')}
                    className="flex-1 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Change ABHA ID
                  </button>
                  <button
                    onClick={handleVerifyPatientOtp}
                    disabled={isLoading || patientOtp.length < 4}
                    className="flex-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify & Issue ABHA Token</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* PATIENT STEP 3: VERIFIED DIGITAL CARD */}
            {patientStep === 'verified' && verifiedPatient && (
              <div className="space-y-6 max-w-lg mx-auto py-2">
                <div className="text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ABDM KYC Verified Digital Health Identity
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Citizen Authenticated</h2>
                </div>

                {/* Digital ABHA Card Display */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-sky-600 via-sky-700 to-indigo-800 text-white shadow-lg relative overflow-hidden border border-sky-400/30">
                  <div className="absolute right-4 top-4 opacity-10">
                    <ShieldCheck className="w-36 h-36" />
                  </div>

                  <div className="flex items-center justify-between border-b border-sky-400/40 pb-3 mb-4">
                    <div className="text-xs font-bold tracking-wider uppercase text-sky-100">
                      National Health Authority • Govt of India
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/50 text-white font-bold border border-sky-300/40">
                      ABHA CARD
                    </span>
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center text-2xl font-black text-white shrink-0">
                      {verifiedPatient.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white leading-tight">
                        {verifiedPatient.name}
                      </h3>
                      <div className="text-xs text-sky-200 font-mono mt-0.5">
                        {verifiedPatient.gender === 'M' ? 'Male' : 'Female'} • Age:{' '}
                        {verifiedPatient.age} • DOB: {verifiedPatient.date_of_birth}
                      </div>
                      <div className="text-xs text-sky-100 font-medium mt-1">
                        {verifiedPatient.district_name}, {verifiedPatient.state_name}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-xl p-3 border border-white/20 flex items-center justify-between font-mono text-xs">
                    <div>
                      <div className="text-[10px] text-sky-200 uppercase font-sans">ABHA Number</div>
                      <div className="font-bold tracking-widest text-white text-sm">
                        {verifiedPatient.abha_number}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-sky-200 uppercase font-sans">ABHA Address</div>
                      <div className="font-semibold text-white">{verifiedPatient.abha_address}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setPatientStep('input');
                      setVerifiedPatient(null);
                    }}
                    className="flex-1 py-3.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Switch Citizen
                  </button>
                  <button
                    onClick={() => navigate('/kiosk')}
                    className="flex-2 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Proceed to Patient Intake Kiosk</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* DOCTOR TAB CONTENT */}
        {/* ========================================================================= */}
        {activeTab === 'doctor' && (
          <div className="p-6 sm:p-8">
            {doctorStep === 'input' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Healthcare Professionals Registry (HPR) & NMC Login
                    </h2>
                    <p className="text-xs text-slate-500">
                      Official Doctor Credential Verification & Clinical Authorization
                    </p>
                  </div>
                  {/* Doctor mode switcher */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => setDocAuthType('hpr')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        docAuthType === 'hpr' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      HPR ID (@hpr)
                    </button>
                    <button
                      onClick={() => setDocAuthType('smc')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        docAuthType === 'smc' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Medical Council Reg
                    </button>
                  </div>
                </div>

                {docAuthType === 'hpr' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Healthcare Professional ID (HPR ID)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={hprIdInput}
                        onChange={(e) => setHprIdInput(e.target.value)}
                        placeholder="e.g. dr.anita.desai@hpr"
                        className="w-full px-4 py-3.5 pl-11 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 font-mono text-sm"
                      />
                      <Stethoscope className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        State Medical Council
                      </label>
                      <select
                        value={selectedCouncil}
                        onChange={(e) => setSelectedCouncil(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900 text-sm font-medium bg-white"
                      >
                        {councils.map((c) => (
                          <option key={c.code} value={c.name}>
                            {c.name} ({c.state})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Council Registration Number
                      </label>
                      <input
                        type="text"
                        value={regNoInput}
                        onChange={(e) => setRegNoInput(e.target.value)}
                        placeholder="e.g. MMC-2018-09281"
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900 font-mono text-sm uppercase"
                      />
                    </div>
                  </div>
                )}

                {/* Pre-seeded Test Clinicians */}
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    Quick Test Clinician (HPR Pre-Verified):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDocAuthType('hpr');
                        setHprIdInput('dr.anita.desai@hpr');
                        handleInitiateDoctor('dr.anita.desai@hpr');
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      Dr. Anita Desai (MD General Medicine • MMC)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDocAuthType('hpr');
                        setHprIdInput('dr.rajesh.verma@hpr');
                        handleInitiateDoctor('dr.rajesh.verma@hpr');
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      Dr. Rajesh Verma (MS General Surgery • DMC)
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleInitiateDoctor()}
                  disabled={isLoading}
                  className="w-full py-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-5 h-5" />
                      <span>Lookup & Dispatch Registry OTP</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* DOCTOR STEP 2: OTP */}
            {doctorStep === 'otp' && (
              <div className="space-y-6 max-w-md mx-auto py-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Verify Clinician OTP</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Matching Record: <strong>{doctorNamePreview}</strong>. OTP sent to mobile linked with{' '}
                    <strong>{doctorMasked}</strong>
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                    <Sparkles className="w-3.5 h-3.5" />
                    HPR Sandbox Mode: Test OTP is <strong>123456</strong>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 text-center">
                    6-Digit One-Time Password
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={doctorOtp}
                    onChange={(e) => setDoctorOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-300 text-center font-mono text-2xl tracking-widest text-slate-900 focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setDoctorStep('input')}
                    className="flex-1 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Change Clinician ID
                  </button>
                  <button
                    onClick={handleVerifyDoctorOtp}
                    disabled={isLoading || doctorOtp.length < 4}
                    className="flex-2 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify Doctor Credentials</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* DOCTOR STEP 3: VERIFIED PRACTITIONER CARD */}
            {doctorStep === 'verified' && verifiedDoctor && (
              <div className="space-y-6 max-w-lg mx-auto py-2">
                <div className="text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    National Medical Commission (NMC) Active Practitioner
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Doctor Verified & Authorized</h2>
                </div>

                {/* Doctor Credential Badge */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 text-white shadow-lg relative overflow-hidden border border-teal-400/30">
                  <div className="flex items-center justify-between border-b border-teal-500/40 pb-3 mb-4">
                    <div className="text-xs font-bold tracking-wider uppercase text-teal-200">
                      National Medical Commission • HPR Verified
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/40 text-emerald-200 font-bold border border-emerald-300/40">
                      ACTIVE CLINICIAN
                    </span>
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center text-teal-300 shrink-0">
                      <Stethoscope className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white leading-tight">
                        {verifiedDoctor.full_name}
                      </h3>
                      <div className="text-xs text-teal-200 font-semibold mt-0.5">
                        {verifiedDoctor.degrees} • {verifiedDoctor.specialization}
                      </div>
                      <div className="text-xs text-teal-100 font-mono mt-1">
                        {verifiedDoctor.hospital_affiliation}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-xl p-3 border border-white/20 flex items-center justify-between font-mono text-xs">
                    <div>
                      <div className="text-[10px] text-teal-300 uppercase font-sans">Medical Council</div>
                      <div className="font-bold text-white text-xs">{verifiedDoctor.state_medical_council}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-teal-300 uppercase font-sans">Reg Number</div>
                      <div className="font-bold tracking-wider text-emerald-300 text-sm">
                        {verifiedDoctor.registration_number}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setDoctorStep('input');
                      setVerifiedDoctor(null);
                    }}
                    className="flex-1 py-3.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Switch Doctor
                  </button>
                  <button
                    onClick={() => navigate('/doctor')}
                    className="flex-2 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Open Doctor Clinical Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Official Guidelines Info Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 max-w-4xl mx-auto w-full">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start gap-3">
          <Award className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-slate-900">National Health Authority</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              100% Free digital health identity framework under ABDM for every Indian citizen.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-slate-900">NMC Registered Doctors</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Clinical decision verification mapped to state and central council registries.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start gap-3">
          <Building2 className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-slate-900">Zero Cost & Legal</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Built on official ABDM Sandbox APIs conforming to the DPDP Act 2023.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
