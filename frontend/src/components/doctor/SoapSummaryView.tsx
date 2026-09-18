import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Check, 
  Edit3, 
  X, 
  RefreshCw, 
  Volume2, 
  FileText, 
  Activity, 
  Pill, 
  AlertCircle,
  Languages
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { api } from '../../services/api';

export interface SoapSummaryViewProps {
  encounterId: string;
  summary: any;
  clinicalState: any;
  onSummaryUpdated: (updatedSummary: any) => void;
  verificationMap: Record<string, 'ACCEPTED' | 'AMENDED' | 'REJECTED'>;
  onFactAction: (factId: string, action: 'ACCEPTED' | 'AMENDED' | 'REJECTED') => void;
  onFinalize: () => void;
  isVerifying: boolean;
  verifySuccess: boolean;
}

export const SoapSummaryView: React.FC<SoapSummaryViewProps> = ({
  encounterId,
  summary,
  clinicalState,
  onSummaryUpdated,
  verificationMap,
  onFactAction,
  onFinalize,
  isVerifying,
  verifySuccess,
}) => {
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('engine');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [previewLanguage, setPreviewLanguage] = useState<'en' | 'hi' | 'mr'>('en');
  const [isSpeakingVernacular, setIsSpeakingVernacular] = useState(false);

  // Load available providers
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const res = await api.getSummaryProviders();
        if (res?.providers) {
          setProviders(res.providers);
          setSelectedProvider(res.active_provider || 'engine');
        }
      } catch (e) {
        console.warn('Could not load AI providers:', e);
      }
    };
    loadProviders();
  }, []);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const refreshed = await api.generateSummary(encounterId, {
        provider: selectedProvider,
        language: previewLanguage,
      });
      onSummaryUpdated(refreshed);
    } catch (e) {
      console.error('Failed to regenerate summary:', e);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSpeakVernacular = (text: string, lang: 'en' | 'hi' | 'mr') => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN';
    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeakingVernacular(true);
    utterance.onend = () => setIsSpeakingVernacular(false);
    utterance.onerror = () => setIsSpeakingVernacular(false);
    window.speechSynthesis.speak(utterance);
  };

  const soap = summary?.soap_sections;
  const triage = summary?.triage_level || 'ROUTINE';
  const pertinentPositives: string[] = summary?.pertinent_positives || [];
  const pertinentNegatives: string[] = summary?.pertinent_negatives || [];
  const vernacularSummaries: Record<string, string> = summary?.patient_vernacular_summary || {};

  const allFactsList = clinicalState
    ? [
        clinicalState.chief_complaint,
        ...(clinicalState.history_of_present_illness || []),
        ...(clinicalState.medications || []),
        ...(clinicalState.allergies || []),
        ...(clinicalState.associated_symptoms || []),
        ...(clinicalState.investigations || []),
      ].filter(Boolean)
    : [];

  return (
    <div className="space-y-6">
      {/* AI Provenance & Triage Level Header Banner */}
      <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900">Physician Clinical SOAP Note</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                triage === 'EMERGENCY'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                  : triage === 'URGENT'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  triage === 'EMERGENCY' ? 'bg-rose-600' : triage === 'URGENT' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
                Triage: {triage}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>Provider Engine:</span>
              <strong className="text-slate-700 font-semibold">
                {summary?.ai_model_used || 'MediKiosk Clinical Synthesis Engine'}
              </strong>
            </div>
          </div>
        </div>

        {/* Provider Switcher & Regenerate Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="text-xs font-bold p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-teal-600 cursor-pointer"
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.status})
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            isLoading={isRegenerating}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Regenerate
          </Button>
        </div>
      </div>

      {/* Red Flag Alert Banner */}
      {clinicalState?.red_flags && clinicalState.red_flags.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          <div className="flex-1 text-xs text-rose-950">
            <strong className="text-sm font-bold block mb-1">
              Deterministic Safety Red Flags ({clinicalState.red_flags.length} Alerts Triggered)
            </strong>
            <ul className="list-disc pl-4 space-y-1">
              {clinicalState.red_flags.map((rf: any, i: number) => (
                <li key={i}>
                  <strong>{rf.title}:</strong> {rf.clinical_rationale}
                </li>
              ))}
            </ul>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 bg-rose-200 text-rose-900 rounded-md shrink-0">
            Immediate Attention
          </span>
        </div>
      )}

      {/* 4 SOAP PILLARS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* S - SUBJECTIVE */}
        <Card className="border-l-4 border-l-sky-500 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-black text-xs">
                S
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Subjective (HPI & Clinical Narrative)</h4>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
              Patient Reported
            </span>
          </div>

          <div className="space-y-3.5 text-xs text-slate-800 flex-1">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Chief Complaint
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl font-bold text-slate-900 text-sm border border-slate-200">
                {summary?.chief_complaint || 'General Clinical Evaluation'}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                History of Present Illness (SOCRATES Narrative)
              </div>
              <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 leading-relaxed text-slate-700">
                {summary?.hpi_narrative || 'Intake interview completed.'}
              </p>
            </div>

            {/* Pertinent Positives & Negatives Chips */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Pertinent Positives & Negatives
              </div>
              <div className="flex flex-wrap gap-1.5">
                {pertinentPositives.map((pos, i) => (
                  <span key={`pos-${i}`} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px] flex items-center gap-1">
                    <span className="text-emerald-600 font-bold">+</span> {pos}
                  </span>
                ))}
                {pertinentNegatives.map((neg, i) => (
                  <span key={`neg-${i}`} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium text-[11px] flex items-center gap-1">
                    <span className="text-slate-400 font-bold">-</span> {neg}
                  </span>
                ))}
              </div>
            </div>

            {/* Active Medications & Allergies */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200">
                <div className="font-bold text-amber-950 text-[11px] mb-1 flex items-center gap-1">
                  <Pill className="w-3.5 h-3.5 text-amber-600" />
                  <span>Documented Medications</span>
                </div>
                <div className="text-[11px] text-amber-900 leading-tight">
                  {summary?.sections?.medications?.content || 'No medications recorded'}
                </div>
              </div>

              <div className="p-2.5 bg-rose-50/60 rounded-xl border border-rose-200">
                <div className="font-bold text-rose-950 text-[11px] mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Documented Allergies</span>
                </div>
                <div className="text-[11px] text-rose-900 leading-tight">
                  {summary?.sections?.allergies?.content || 'NKDA (No known drug allergies)'}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* O - OBJECTIVE */}
        <Card className="border-l-4 border-l-teal-500 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-black text-xs">
                O
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Objective (Vitals & Digested Labs)</h4>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              Measured & OCR
            </span>
          </div>

          <div className="space-y-4 text-xs text-slate-800 flex-1">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-600" />
                <span>Recorded Vital Signs</span>
              </div>
              <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200/80">
                {clinicalState?.vital_signs && clinicalState.vital_signs.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {clinicalState.vital_signs.map((v: any, i: number) => (
                      <div key={i} className="p-2 bg-white rounded-lg border border-teal-200 flex justify-between items-center">
                        <span className="text-slate-600 font-medium">{v.name}:</span>
                        <span className="font-bold text-slate-900 font-mono">{v.value} {v.unit || ''}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600 font-medium">
                    {soap?.objective?.content || 'Physical vitals not recorded in this intake session.'}
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Diagnostic Investigations Matrix</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
                <pre className="whitespace-pre-wrap font-sans text-xs text-slate-700 leading-relaxed">
                  {soap?.objective?.content || 'No external diagnostic reports uploaded for this encounter.'}
                </pre>
              </div>
            </div>
          </div>
        </Card>

        {/* A - ASSESSMENT */}
        <Card className="border-l-4 border-l-amber-500 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-black text-xs">
                A
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Assessment (Impression & Risk Triage)</h4>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Clinical Analysis
            </span>
          </div>

          <div className="space-y-3.5 text-xs text-slate-800 flex-1">
            <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200 leading-relaxed">
              <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                Syndromic Clinical Impression & Red Flags
              </div>
              <pre className="whitespace-pre-wrap font-sans text-xs text-slate-800 font-medium leading-relaxed">
                {soap?.assessment?.content || 'Presentation requires targeted clinician examination and correlation.'}
              </pre>
            </div>


            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Safety Red Flags Status
              </div>
              <div className="text-slate-700">
                {clinicalState?.red_flags?.length > 0 ? (
                  <span className="text-rose-700 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {clinicalState.red_flags.length} red flag safety conditions flagged for mandatory physician review.
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Zero deterministic safety red flags triggered.
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* P - PLAN */}
        <Card className="border-l-4 border-l-emerald-500 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs">
                P
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Plan (Next Steps & Diagnostics)</h4>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Physician Action
            </span>
          </div>

          <div className="space-y-3 text-xs text-slate-800 flex-1">
            <div className="p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-200">
              <div className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider mb-1.5">
                Recommended Diagnostics & Focus Items
              </div>
              <pre className="whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed font-medium">
                {soap?.plan?.content || '1. Outpatient physician consultation.\n2. Confirm digitized medication and allergy history.'}
              </pre>
            </div>

            <div className="text-[11px] text-slate-500 italic">
              * Attending physician verification and clinical sign-off is required before finalizing this encounter.
            </div>
          </div>
        </Card>
      </div>

      {/* MULTILINGUAL PATIENT VERNACULAR SUMMARY (Plain Language Preview) */}
      <Card className="bg-gradient-to-r from-sky-50/70 via-indigo-50/50 to-teal-50/70 border-2 border-sky-200">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-sky-200/80 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Languages className="w-5 h-5 text-sky-700" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Patient Plain-Language Vernacular Summary</h4>
              <span className="text-xs text-slate-500">
                Explains clinical case to patient in their native language with loud audio readout
              </span>
            </div>
          </div>

          {/* Language Selector Pills */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-sky-300 shadow-2xs">
            <button
              onClick={() => setPreviewLanguage('en')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                previewLanguage === 'en' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setPreviewLanguage('hi')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                previewLanguage === 'hi' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              हिंदी (Hindi)
            </button>
            <button
              onClick={() => setPreviewLanguage('mr')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                previewLanguage === 'mr' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              मराठी (Marathi)
            </button>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-sky-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-slate-800 text-xs sm:text-sm font-medium leading-relaxed flex-1">
            {vernacularSummaries[previewLanguage] || vernacularSummaries['en'] || 'Patient summary generated.'}
          </p>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleSpeakVernacular(vernacularSummaries[previewLanguage] || vernacularSummaries['en'] || '', previewLanguage)}
            isLoading={isSpeakingVernacular}
            leftIcon={<Volume2 className="w-4 h-4" />}
            className="shrink-0"
          >
            {isSpeakingVernacular ? 'Speaking...' : 'Play Audio'}
          </Button>
        </div>
      </Card>

      {/* FACT-BY-FACT CLINICAL OBSERVATION VERIFICATION TABLE */}
      <Card>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">
              Clinical Facts Verification (Accept / Amend / Reject)
            </h4>
            <span className="text-xs text-slate-500">
              {allFactsList.length} Extracted facts linked to FHIR R4 Observations
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">NMC Verified Clinician Review</span>
        </div>

        <div className="space-y-2.5">
          {allFactsList.map((fact: any) => {
            const action = verificationMap[fact.id] || 'ACCEPTED';
            return (
              <div
                key={fact.id}
                className={`p-3 bg-white border rounded-xl flex items-center justify-between gap-4 transition-all ${
                  action === 'ACCEPTED'
                    ? 'border-slate-200'
                    : action === 'AMENDED'
                    ? 'border-indigo-300 bg-indigo-50/20'
                    : 'border-rose-300 bg-rose-50/30 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Badge provenance={fact.source || 'patient_touch'} />
                  <div>
                    <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                      <span>{fact.name}:</span>
                      <span className={action === 'REJECTED' ? 'line-through text-slate-400' : 'text-slate-700'}>
                        {String(fact.value)} {fact.unit || ''}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Confidence: {Math.round((fact.confidence || 0.95) * 100)}% • Category: {fact.category}
                      {fact.notes && ` • ${fact.notes}`}
                    </div>
                  </div>
                </div>

                {/* Verification Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onFactAction(fact.id, 'ACCEPTED')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      action === 'ACCEPTED'
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-2xs'
                        : 'text-slate-600 hover:bg-emerald-50 border-slate-200'
                    }`}
                    title="Accept fact"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onFactAction(fact.id, 'AMENDED')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      action === 'AMENDED'
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:bg-indigo-50 border-slate-200'
                    }`}
                    title="Amend fact"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onFactAction(fact.id, 'REJECTED')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      action === 'REJECTED'
                        ? 'bg-rose-500 text-white border-rose-600 shadow-2xs'
                        : 'text-slate-600 hover:bg-rose-50 border-slate-200'
                    }`}
                    title="Reject fact"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Doctor Finalize Button */}
        <div className="pt-5 mt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            {verifySuccess ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Encounter Authenticated & Verified! FHIR R4 synced.
              </span>
            ) : (
              <span>All verified facts are mapped to FHIR R4 and made available to ABDM / HIS.</span>
            )}
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={onFinalize}
            isLoading={isVerifying}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Sign & Verify Encounter (FHIR R4 Ready)
          </Button>
        </div>
      </Card>
    </div>
  );
};
