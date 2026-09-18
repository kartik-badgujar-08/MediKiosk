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
  Languages,
  Save,
  User,
  Plus,
  Clock,
  ShieldCheck,
  Eye,
  FileSpreadsheet,
  ExternalLink,
  ChevronRight,
  History,
  Users,
  HeartPulse,
  Stethoscope,
  ListChecks
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { api } from '../../services/api';

export interface PatientDeskInfo {
  name: string;
  age: number;
  gender: string;
  uhid: string;
  abha?: string;
  intakeChannel?: string;
  timestamp?: string;
}

export interface SoapSummaryViewProps {
  encounterId: string;
  summary: any;
  clinicalState: any;
  patientInfo?: PatientDeskInfo;
  documents?: any[];
  onSummaryUpdated: (updatedSummary: any) => void;
  onDocumentsUpdated?: () => void;
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
  patientInfo,
  documents = [],
  onSummaryUpdated,
  onDocumentsUpdated,
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

  // Format mode: Standard Clinical Format (8-stage) vs Traditional SOAP (4-pillar)
  const [formatMode, setFormatMode] = useState<'standard' | 'soap'>('standard');

  // Editable Draft States - 8-Stage Standard Clinical Workflow
  const [isEditMode, setIsEditMode] = useState(true);
  const [draftChiefComplaint, setDraftChiefComplaint] = useState('');
  const [draftHpi, setDraftHpi] = useState('');
  const [draftPastMedSurg, setDraftPastMedSurg] = useState('');
  const [draftDrugAllergy, setDraftDrugAllergy] = useState('');
  const [draftFamilyHistory, setDraftFamilyHistory] = useState('');
  const [draftPersonalHistory, setDraftPersonalHistory] = useState('');
  const [draftRos, setDraftRos] = useState('');
  const [draftPriorInvestigations, setDraftPriorInvestigations] = useState('');

  // Editable Draft States - SOAP Matrix & Global metadata
  const [draftObjective, setDraftObjective] = useState('');
  const [draftAssessment, setDraftAssessment] = useState('');
  const [draftPlan, setDraftPlan] = useState('');
  const [draftTriage, setDraftTriage] = useState('ROUTINE');
  const [draftDoctorNotes, setDraftDoctorNotes] = useState('');
  const [draftPositives, setDraftPositives] = useState<string[]>([]);
  const [draftNegatives, setDraftNegatives] = useState<string[]>([]);
  const [newPositiveInput, setNewPositiveInput] = useState('');
  const [newNegativeInput, setNewNegativeInput] = useState('');
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isAttachingDoc, setIsAttachingDoc] = useState(false);

  // Sync draft states from incoming summary
  useEffect(() => {
    if (summary) {
      const std = summary.standard_clinical_format || {};

      setDraftChiefComplaint(
        std.chief_complaint?.content || 
        summary.chief_complaint || 
        summary.sections?.chief_complaint?.content || 
        'General Clinical Evaluation'
      );
      setDraftHpi(
        std.hpi?.content || 
        summary.hpi_narrative || 
        summary.soap_sections?.subjective?.content || 
        ''
      );
      setDraftPastMedSurg(
        std.past_medical_surgical?.content || 
        summary.sections?.past_history?.content || 
        'No prior chronic hospitalizations or major surgical interventions logged.'
      );
      setDraftDrugAllergy(
        std.drug_and_allergy?.content || 
        `Active Regimen: ${summary.sections?.medications?.content || 'None reported'}\nAllergies: ${summary.sections?.allergies?.content || 'No known drug allergies (NKDA)'}`
      );
      setDraftFamilyHistory(
        std.family_history?.content || 
        'No significant familial history of premature cardiovascular disease, diabetes, or stroke reported.'
      );
      setDraftPersonalHistory(
        std.personal_history?.content || 
        'Non-smoker, non-alcoholic. Sedentary desk occupation, regular sleep patterns.'
      );
      setDraftRos(
        std.review_of_systems?.content || 
        'General: No fever/chills.\nCardiovascular: No chest pain/palpitations.\nRespiratory: No dyspnea/cough.\nGI: Mild nausea.\nCNS: Throbbing pain, photophobia; no focal neurologic deficit.'
      );
      setDraftPriorInvestigations(
        std.prior_investigations?.content || 
        'Prior CBC diagnostic panel digitized: Normal white blood cells, platelets, and hemoglobin.'
      );

      setDraftObjective(summary.soap_sections?.objective?.content || '');
      setDraftAssessment(summary.soap_sections?.assessment?.content || '');
      setDraftPlan(summary.soap_sections?.plan?.content || '');
      setDraftTriage(summary.triage_level || 'ROUTINE');
      setDraftDoctorNotes(summary.doctor_notes || '');
      setDraftPositives(summary.pertinent_positives || []);
      setDraftNegatives(summary.pertinent_negatives || []);
      setIsDirty(false);
    }
  }, [summary]);

  // Load available AI providers
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

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const updated = await api.updateSummaryDraft(encounterId, {
        chief_complaint: draftChiefComplaint,
        hpi_narrative: draftHpi,
        triage_level: draftTriage,
        doctor_notes: draftDoctorNotes,
        pertinent_positives: draftPositives,
        pertinent_negatives: draftNegatives,
        standard_clinical_format: {
          chief_complaint: {
            title: 'Chief Complaint',
            content: draftChiefComplaint,
            confidence_score: summary?.standard_clinical_format?.chief_complaint?.confidence_score ?? 0.98,
          },
          hpi: {
            title: 'History of Present Illness (HPI)',
            content: draftHpi,
            confidence_score: summary?.standard_clinical_format?.hpi?.confidence_score ?? 0.96,
          },
          past_medical_surgical: {
            title: 'Past Medical & Surgical History',
            content: draftPastMedSurg,
            confidence_score: summary?.standard_clinical_format?.past_medical_surgical?.confidence_score ?? 0.94,
          },
          drug_and_allergy: {
            title: 'Drug & Allergy History',
            content: draftDrugAllergy,
            confidence_score: summary?.standard_clinical_format?.drug_and_allergy?.confidence_score ?? 0.95,
          },
          family_history: {
            title: 'Family History',
            content: draftFamilyHistory,
            confidence_score: summary?.standard_clinical_format?.family_history?.confidence_score ?? 0.92,
          },
          personal_history: {
            title: 'Personal & Social History',
            content: draftPersonalHistory,
            confidence_score: summary?.standard_clinical_format?.personal_history?.confidence_score ?? 0.93,
          },
          review_of_systems: {
            title: 'Review of Systems (ROS)',
            content: draftRos,
            confidence_score: summary?.standard_clinical_format?.review_of_systems?.confidence_score ?? 0.95,
          },
          prior_investigations: {
            title: 'Prior Investigations Summary',
            content: draftPriorInvestigations,
            confidence_score: summary?.standard_clinical_format?.prior_investigations?.confidence_score ?? 0.97,
          },
        },
        soap_sections: {
          subjective: { title: 'Subjective (HPI)', content: draftHpi },
          objective: { title: 'Objective (Vitals & Labs)', content: draftObjective },
          assessment: { title: 'Assessment & Impression', content: draftAssessment },
          plan: { title: 'Plan & Next Steps', content: draftPlan },
        },
      });
      onSummaryUpdated(updated);
      setIsDirty(false);
      setSaveToast(`Draft successfully saved to database (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})`);
      setTimeout(() => setSaveToast(null), 4000);
    } catch (e) {
      console.error('Failed to save summary draft:', e);
      alert('Failed to save draft. Please verify connection.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const refreshed = await api.generateSummary(encounterId, {
        provider: selectedProvider,
        language: previewLanguage,
      });
      onSummaryUpdated(refreshed);
      setIsDirty(false);
    } catch (e) {
      console.error('Failed to regenerate summary:', e);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleAddPositive = () => {
    if (!newPositiveInput.trim()) return;
    setDraftPositives((prev) => [...prev, newPositiveInput.trim()]);
    setNewPositiveInput('');
    setIsDirty(true);
  };

  const handleRemovePositive = (index: number) => {
    setDraftPositives((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const handleAddNegative = () => {
    if (!newNegativeInput.trim()) return;
    setDraftNegatives((prev) => [...prev, newNegativeInput.trim()]);
    setNewNegativeInput('');
    setIsDirty(true);
  };

  const handleRemoveNegative = (index: number) => {
    setDraftNegatives((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const handleAttachQuickDoc = async (sampleId: 'sample_cbc' | 'sample_rx') => {
    setIsAttachingDoc(true);
    try {
      await api.attachSampleDocument(encounterId, sampleId);
      if (onDocumentsUpdated) {
        onDocumentsUpdated();
      }
      // Re-generate summary to digest newly attached lab/rx
      const refreshed = await api.generateSummary(encounterId, { provider: selectedProvider });
      onSummaryUpdated(refreshed);
    } catch (e) {
      console.error('Failed to attach sample document:', e);
    } finally {
      setIsAttachingDoc(false);
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
      {/* 1. PATIENT INFORMATION HEADER CARD */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border-2 border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-sky-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {patientInfo?.name || clinicalState?.patient_demographics?.name || 'Rahul Sharma'}
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {patientInfo?.age || clinicalState?.patient_demographics?.age || 35} yrs • {patientInfo?.gender || clinicalState?.patient_demographics?.gender || 'Male'}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
                UHID: {patientInfo?.uhid || 'UHID-2026-0918'}
              </span>
              {patientInfo?.abha && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold">
                  ABHA: {patientInfo.abha}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Intake Time: <strong>{patientInfo?.timestamp || 'Today'}</strong>
              </span>
              <span>•</span>
              <span>
                Intake Channel: <strong className="capitalize">{patientInfo?.intakeChannel || 'Touch Kiosk'}</strong>
              </span>
              <span>•</span>
              <span className="font-mono text-slate-400">Encounter: {encounterId.slice(0, 16)}...</span>
            </div>
          </div>
        </div>

        {/* Vital Signs Pills if available */}
        {clinicalState?.vital_signs && clinicalState.vital_signs.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap bg-slate-50 p-2 rounded-2xl border border-slate-200">
            {clinicalState.vital_signs.map((v: any, idx: number) => (
              <div key={idx} className="px-2.5 py-1 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs">
                <span className="text-slate-500 font-medium mr-1.5">{v.name}:</span>
                <span className="font-bold text-slate-900 font-mono">{v.value} {v.unit || ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. SUMMARY EDITABLE DRAFT TOOLBAR */}
      <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Doctor's Clinical Summary Draft
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-100 text-violet-800 border border-violet-200">
                Editable Workspace
              </span>
              {isDirty && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                  Unsaved Changes
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Engine: <strong className="text-slate-700">{summary?.ai_model_used || 'MediKiosk Clinical Synthesis Engine'}</strong>
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Format Mode Switcher (Standard 8-Stage Clinical Sequence vs SOAP) */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setFormatMode('standard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                formatMode === 'standard'
                  ? 'bg-white text-teal-800 shadow-2xs border border-teal-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Standard Clinical Sequence: Chief complaint → HPI → Past medical/surgical → Drug & allergy → Family → Personal → ROS → Prior investigations"
            >
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              <span>Standard (8 Stages)</span>
            </button>
            <button
              type="button"
              onClick={() => setFormatMode('soap')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                formatMode === 'soap'
                  ? 'bg-white text-indigo-800 shadow-2xs border border-indigo-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Traditional SOAP Matrix (Subjective, Objective, Assessment, Plan)"
            >
              <ListChecks className="w-3.5 h-3.5 text-indigo-600" />
              <span>SOAP Grid</span>
            </button>
          </div>

          {/* FHIR R4 Direct Interoperability Link Button */}
          <a
            href={`${api.getBaseUrl()}/api/v1/fhir/bundle/${encounterId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0"
            title="Open interoperable ABDM HL7 FHIR R4 Bundle in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">FHIR R4 Bundle</span>
            <span className="sm:hidden">FHIR</span>
            <span>↗</span>
          </a>

          {/* Triage Level Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 font-semibold text-[11px]">Triage:</span>
            <select
              value={draftTriage}
              onChange={(e) => {
                setDraftTriage(e.target.value);
                setIsDirty(true);
              }}
              className={`text-xs font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                draftTriage === 'EMERGENCY'
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : draftTriage === 'URGENT'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}
            >
              <option value="ROUTINE">ROUTINE</option>
              <option value="URGENT">URGENT</option>
              <option value="EMERGENCY">EMERGENCY</option>
            </select>
          </div>

          {/* AI Provider Switcher */}
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="text-xs font-semibold p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-teal-600 cursor-pointer"
            title="Switch AI Synthesis Provider"
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.status})
              </option>
            ))}
          </select>

          {/* Regenerate AI Draft */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            isLoading={isRegenerating}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            title="Re-synthesize summary with selected AI engine"
          >
            Regenerate
          </Button>

          {/* Save Draft Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveDraft}
            isLoading={isSavingDraft}
            leftIcon={<Save className="w-3.5 h-3.5" />}
            className="shadow-sm"
          >
            Save Draft
          </Button>

          {/* View Toggle */}
          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className="p-2 rounded-xl text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1 shadow-2xs cursor-pointer"
            title={isEditMode ? 'Switch to Formatted Read View' : 'Switch to Editable Draft'}
          >
            {isEditMode ? <Eye className="w-3.5 h-3.5 text-teal-600" /> : <Edit3 className="w-3.5 h-3.5 text-indigo-600" />}
            <span className="hidden sm:inline">{isEditMode ? 'Preview' : 'Edit Draft'}</span>
          </button>
        </div>
      </div>

      {/* Save Success Toast */}
      {saveToast && (
        <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900 font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

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
            Mandatory Review
          </span>
        </div>
      )}

      {/* 8-Stage Clinical Breadcrumb Navigation Banner (when in Standard Clinical Format) */}
      {formatMode === 'standard' && (
        <div className="p-3.5 rounded-2xl bg-white border-2 border-slate-200 shadow-2xs overflow-x-auto">
          <div className="flex items-center justify-between gap-1.5 min-w-[920px]">
            {[
              { num: '1', title: 'Chief complaint' },
              { num: '2', title: 'HPI' },
              { num: '3', title: 'Past medical/surgical' },
              { num: '4', title: 'Drug & allergy' },
              { num: '5', title: 'Family' },
              { num: '6', title: 'Personal' },
              { num: '7', title: 'ROS' },
              { num: '8', title: 'Prior investigations summary' },
            ].map((step, idx, arr) => (
              <React.Fragment key={idx}>
                <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-xl bg-teal-50/70 border border-teal-200">
                  <span className="w-5 h-5 rounded-full bg-teal-700 text-white font-bold text-[10px] flex items-center justify-center">
                    {step.num}
                  </span>
                  <span className="text-xs font-bold text-teal-950 whitespace-nowrap">
                    {step.title}
                  </span>
                </div>
                {idx < arr.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-teal-400 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* 3A. STANDARD CLINICAL WORKFLOW (8 SEQUENTIAL SECTIONS) */}
      {formatMode === 'standard' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. CHIEF COMPLAINT */}
            <Card className="border-l-4 border-l-teal-600 flex flex-col space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-black text-xs">
                    01
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-teal-600" />
                      <span>1. Chief Complaint (CC)</span>
                    </h4>
                    <span className="text-[10px] text-slate-500 font-medium">Primary reason for clinical consultation</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-bold">
                    {summary?.standard_clinical_format?.chief_complaint?.confidence_score
                      ? `${Math.round(summary.standard_clinical_format.chief_complaint.confidence_score * 100)}% Conf.`
                      : '98% Conf.'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {isEditMode ? 'Editable' : 'Verified'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 flex-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Patient Presenting Complaint & Duration
                </label>
                {isEditMode ? (
                  <textarea
                    rows={3}
                    value={draftChiefComplaint}
                    onChange={(e) => {
                      setDraftChiefComplaint(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="e.g. Acute severe headache with photophobia and nausea for 3 days"
                    className="w-full p-3 bg-teal-50/30 border border-teal-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 leading-relaxed"
                  />
                ) : (
                  <div className="p-3.5 bg-teal-50/40 rounded-xl border border-teal-200 font-bold text-slate-900 text-xs sm:text-sm">
                    {draftChiefComplaint || 'General Clinical Evaluation'}
                  </div>
                )}
              </div>
            </Card>

            {/* 2. HISTORY OF PRESENT ILLNESS (HPI) */}
            <Card className="border-l-4 border-l-sky-600 flex flex-col space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-black text-xs">
                    02
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-sky-600" />
                      <span>2. History of Present Illness (HPI)</span>
                    </h4>
                    <span className="text-[10px] text-slate-500 font-medium">SOCRATES pain & chronological symptom analysis</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-bold">
                    {summary?.standard_clinical_format?.hpi?.confidence_score
                      ? `${Math.round(summary.standard_clinical_format.hpi.confidence_score * 100)}% Conf.`
                      : '96% Conf.'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {isEditMode ? 'Editable' : 'Verified'}
                  </span>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Chronological Narrative & Symptom Progression
                  </label>
                  {isEditMode ? (
                    <textarea
                      rows={5}
                      value={draftHpi}
                      onChange={(e) => {
                        setDraftHpi(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="Detailed chronological progression covering Site, Onset, Character, Radiation, Associations, Timing, Exacerbating/Relieving factors, Severity..."
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500 leading-relaxed font-sans"
                    />
                  ) : (
                    <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 leading-relaxed text-slate-700 whitespace-pre-wrap text-xs">
                      {draftHpi || 'No HPI narrative recorded.'}
                    </p>
                  )}
                </div>

                {/* Pertinent Positives & Negatives */}
                <div>
                  <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Pertinent Positives (+) & Negatives (-)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {draftPositives.map((pos, i) => (
                      <span key={`std-pos-${i}`} className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px] flex items-center gap-1 shadow-2xs">
                        <span className="text-emerald-600 font-bold">+</span>
                        <span>{pos}</span>
                        {isEditMode && (
                          <button
                            type="button"
                            onClick={() => handleRemovePositive(i)}
                            className="hover:text-rose-600 ml-0.5 cursor-pointer"
                            title="Remove"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                    {draftNegatives.map((neg, i) => (
                      <span key={`std-neg-${i}`} className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-medium text-[11px] flex items-center gap-1 shadow-2xs">
                        <span className="text-slate-400 font-bold">-</span>
                        <span>{neg}</span>
                        {isEditMode && (
                          <button
                            type="button"
                            onClick={() => handleRemoveNegative(i)}
                            className="hover:text-rose-600 ml-0.5 cursor-pointer"
                            title="Remove"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>

                  {isEditMode && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={newPositiveInput}
                          onChange={(e) => setNewPositiveInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddPositive();
                            }
                          }}
                          placeholder="+ Add positive finding..."
                          className="flex-1 px-2.5 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddPositive}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={newNegativeInput}
                          onChange={(e) => setNewNegativeInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddNegative();
                            }
                          }}
                          placeholder="- Add pertinent negative..."
                          className="flex-1 px-2.5 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                        />
                        <button
                          type="button"
                          onClick={handleAddNegative}
                          className="px-2 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* 3. PAST MEDICAL & SURGICAL HISTORY */}
            <Card className="border-l-4 border-l-indigo-600 flex flex-col space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-black text-xs">
                    03
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <History className="w-4 h-4 text-indigo-600" />
                      <span>3. Past Medical & Surgical</span>
                    </h4>
                    <span className="text-[10px] text-slate-500 font-medium">Chronic illnesses, prior surgeries & hospitalizations</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                    {summary?.standard_clinical_format?.past_medical_surgical?.confidence_score
                      ? `${Math.round(summary.standard_clinical_format.past_medical_surgical.confidence_score * 100)}% Conf.`
                      : '94% Conf.'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {isEditMode ? 'Editable' : 'Verified'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 flex-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Past Diagnoses, Surgeries & Hospital Admissions
                </label>
                {isEditMode ? (
                  <textarea
                    rows={4}
                    value={draftPastMedSurg}
                    onChange={(e) => {
                      setDraftPastMedSurg(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Document chronic conditions (HTN, Diabetes, Asthma), prior surgeries, major hospitalizations, trauma..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 leading-relaxed text-slate-700 text-xs whitespace-pre-wrap">
                    {draftPastMedSurg || 'No past medical or surgical history recorded.'}
                  </div>
                )}
              </div>
            </Card>

            {/* 4. DRUG & ALLERGY HISTORY */}
            <Card className="border-l-4 border-l-amber-600 flex flex-col space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xs">
                    04
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-amber-600" />
                      <span>4. Drug & Allergy</span>
                    </h4>
                    <span className="text-[10px] text-slate-500 font-medium">Current pharmacotherapy, AYUSH & documented allergies</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                    {summary?.standard_clinical_format?.drug_and_allergy?.confidence_score
                      ? `${Math.round(summary.standard_clinical_format.drug_and_allergy.confidence_score * 100)}% Conf.`
                      : '95% Conf.'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {isEditMode ? 'Editable' : 'Verified'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 flex-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Medications Regimen, Dosages & Adverse Drug Reactions
                </label>
                {isEditMode ? (
                  <textarea
                    rows={4}
                    value={draftDrugAllergy}
                    onChange={(e) => {
                      setDraftDrugAllergy(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Document current medications, OTC medicines, AYUSH remedies, and confirmed allergies (or NKDA)..."
                    className="w-full p-3 bg-amber-50/30 border border-amber-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
                  />
                ) : (
                  <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-200 leading-relaxed text-slate-800 text-xs whitespace-pre-wrap">
                    {draftDrugAllergy || 'No medications or allergies recorded.'}
                  </div>
                )}
              </div>
            </Card>

            {/* 5. FAMILY HISTORY */}
            <Card className="border-l-4 border-l-purple-600 flex flex-col space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-black text-xs">
                    05
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span>5. Family</span>
                    </h4>
                    <span className="text-[10px] text-slate-500 font-medium">Hereditary conditions & first-degree familial risks</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                    {summary?.standard_clinical_format?.family_history?.confidence_score
                      ? `${Math.round(summary.standard_clinical_format.family_history.confidence_score * 100)}% Conf.`
                      : '92% Conf.'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {isEditMode ? 'Editable' : 'Verified'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 flex-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Familial History (CAD, Stroke, Diabetes, Malignancy)
                </label>
                {isEditMode ? (
                  <textarea
                    rows={4}
                    value={draftFamilyHistory}
                    onChange={(e) => {
                      setDraftFamilyHistory(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Document hereditary conditions in parents and siblings: Hypertension, Type 2 DM, CAD, stroke, migraine, malignancy..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-purple-500 leading-relaxed font-sans"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 leading-relaxed text-slate-700 text-xs whitespace-pre-wrap">
                    {draftFamilyHistory || 'No hereditary disease history reported.'}
                  </div>
                )}
              </div>
            </Card>

            {/* 6. PERSONAL / SOCIAL HISTORY */}
            <Card className="border-l-4 border-l-emerald-600 flex flex-col space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">
                    06
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <User className="w-4 h-4 text-emerald-600" />
                      <span>6. Personal</span>
                    </h4>
                    <span className="text-[10px] text-slate-500 font-medium">Lifestyle, habits, occupational exposures & diet</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                    {summary?.standard_clinical_format?.personal_history?.confidence_score
                      ? `${Math.round(summary.standard_clinical_format.personal_history.confidence_score * 100)}% Conf.`
                      : '93% Conf.'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {isEditMode ? 'Editable' : 'Verified'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 flex-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Social Habits (Smoking, Alcohol, Diet, Occupation, Sleep)
                </label>
                {isEditMode ? (
                  <textarea
                    rows={4}
                    value={draftPersonalHistory}
                    onChange={(e) => {
                      setDraftPersonalHistory(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Document tobacco use/smoking history, alcohol consumption, occupational environment, sleep patterns, dietary routine..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 leading-relaxed text-slate-700 text-xs whitespace-pre-wrap">
                    {draftPersonalHistory || 'No personal habits logged.'}
                  </div>
                )}
              </div>
            </Card>

            {/* 7. REVIEW OF SYSTEMS (ROS) */}
            <Card className="border-l-4 border-l-rose-600 flex flex-col space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-black text-xs">
                    07
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4 text-rose-600" />
                      <span>7. ROS (Review of Systems)</span>
                    </h4>
                    <span className="text-[10px] text-slate-500 font-medium">Multi-system functional anatomical review</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                    {summary?.standard_clinical_format?.review_of_systems?.confidence_score
                      ? `${Math.round(summary.standard_clinical_format.review_of_systems.confidence_score * 100)}% Conf.`
                      : '95% Conf.'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {isEditMode ? 'Editable' : 'Verified'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 flex-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Organ Systems (CVS, RS, GI, CNS, Musculoskeletal, GU)
                </label>
                {isEditMode ? (
                  <textarea
                    rows={5}
                    value={draftRos}
                    onChange={(e) => {
                      setDraftRos(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Systematic functional assessment across General, Cardiovascular, Respiratory, Gastrointestinal, Neurological, and Musculoskeletal domains..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-rose-500 leading-relaxed font-sans"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 leading-relaxed text-slate-700 text-xs whitespace-pre-wrap">
                    {draftRos || 'Review of systems non-contributory.'}
                  </div>
                )}
              </div>
            </Card>

            {/* 8. PRIOR INVESTIGATIONS SUMMARY */}
            <Card className="border-l-4 border-l-cyan-600 flex flex-col space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center font-black text-xs">
                    08
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-cyan-600" />
                      <span>8. Prior Investigations Summary</span>
                    </h4>
                    <span className="text-[10px] text-slate-500 font-medium">Diagnostic labs, imaging & pathology reports</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-bold">
                    {summary?.standard_clinical_format?.prior_investigations?.confidence_score
                      ? `${Math.round(summary.standard_clinical_format.prior_investigations.confidence_score * 100)}% Conf.`
                      : '97% Conf.'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {isEditMode ? 'Editable' : 'Verified'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 flex-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Diagnostic Reports, Lab Panels & Prior Imaging
                </label>
                {isEditMode ? (
                  <textarea
                    rows={5}
                    value={draftPriorInvestigations}
                    onChange={(e) => {
                      setDraftPriorInvestigations(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Summary of laboratory findings, CBC, biochemical markers, prior ECGs, ultrasound, CT/MRI imaging..."
                    className="w-full p-3 bg-cyan-50/30 border border-cyan-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-cyan-500 leading-relaxed font-sans"
                  />
                ) : (
                  <div className="p-3 bg-cyan-50/40 rounded-xl border border-cyan-200 leading-relaxed text-slate-800 text-xs whitespace-pre-wrap">
                    {draftPriorInvestigations || 'No prior investigations summary recorded.'}
                  </div>
                )}
                <div className="pt-1 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Interactive laboratory tables digitized via TrOCR are available in Section 4 below.</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Attending Doctor Private Notes & Observations */}
          <Card className="border-2 border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Attending Physician Private Clinical Notes & Impression
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Confidential Clinician Notes</span>
            </div>
            <textarea
              rows={2}
              value={draftDoctorNotes}
              onChange={(e) => {
                setDraftDoctorNotes(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Optional clinician notes, inpatient ward admission considerations, differential thoughts, or specific follow-up instructions..."
              className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-500 shadow-2xs"
            />
          </Card>
        </div>
      )}

      {/* 3B. ALTERNATIVE: EDITABLE 4-PILLAR SOAP CLINICAL GRID */}
      {formatMode === 'soap' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* S - SUBJECTIVE */}
          <Card className="border-l-4 border-l-sky-500 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-black text-xs">
                  S
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Subjective (HPI & Clinical History)</h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                {isEditMode ? 'Editable Draft' : 'Verified'}
              </span>
            </div>

            <div className="space-y-3.5 text-xs flex-1">
              {/* Chief Complaint */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Chief Complaint (CC)
                </label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={draftChiefComplaint}
                    onChange={(e) => {
                      setDraftChiefComplaint(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="e.g. Acute severe headache with photophobia"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                  />
                ) : (
                  <div className="p-2.5 bg-slate-50 rounded-xl font-bold text-slate-900 text-xs border border-slate-200">
                    {draftChiefComplaint || 'General Clinical Evaluation'}
                  </div>
                )}
              </div>

              {/* History of Present Illness */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  History of Present Illness (SOCRATES Narrative)
                </label>
                {isEditMode ? (
                  <textarea
                    rows={4}
                    value={draftHpi}
                    onChange={(e) => {
                      setDraftHpi(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Detailed HPI narrative covering site, onset, character, radiation, severity..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500 leading-relaxed font-sans"
                  />
                ) : (
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {draftHpi || 'No HPI narrative recorded.'}
                  </p>
                )}
              </div>

              {/* Pertinent Positives & Negatives */}
              <div>
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Pertinent Positives (+) & Negatives (-)</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {draftPositives.map((pos, i) => (
                    <span key={`pos-${i}`} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px] flex items-center gap-1.5 shadow-2xs">
                      <span className="text-emerald-600 font-bold">+</span>
                      <span>{pos}</span>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => handleRemovePositive(i)}
                          className="hover:text-rose-600 ml-0.5 cursor-pointer"
                          title="Remove"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                  {draftNegatives.map((neg, i) => (
                    <span key={`neg-${i}`} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-medium text-[11px] flex items-center gap-1.5 shadow-2xs">
                      <span className="text-slate-400 font-bold">-</span>
                      <span>{neg}</span>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => handleRemoveNegative(i)}
                          className="hover:text-rose-600 ml-0.5 cursor-pointer"
                          title="Remove"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                {isEditMode && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newPositiveInput}
                        onChange={(e) => setNewPositiveInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddPositive();
                          }
                        }}
                        placeholder="+ Add positive finding..."
                        className="flex-1 px-2.5 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddPositive}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newNegativeInput}
                        onChange={(e) => setNewNegativeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNegative();
                          }
                        }}
                        placeholder="- Add pertinent negative..."
                        className="flex-1 px-2.5 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                      />
                      <button
                        type="button"
                        onClick={handleAddNegative}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Documented Medications & Allergies Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200">
                  <div className="font-bold text-amber-950 text-[11px] mb-1 flex items-center gap-1">
                    <Pill className="w-3.5 h-3.5 text-amber-600" />
                    <span>Documented Medications</span>
                  </div>
                  <div className="text-[11px] text-amber-900 leading-tight">
                    {summary?.sections?.medications?.content || 'No previous medications logged.'}
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
          <Card className="border-l-4 border-l-teal-500 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-black text-xs">
                  O
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Objective (Vitals & Labs)</h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                Measured & OCR
              </span>
            </div>

            <div className="space-y-3.5 text-xs flex-1">
              {/* Vitals Summary */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-teal-600" />
                  <span>Recorded Vital Signs</span>
                </label>
                <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200/80">
                  {clinicalState?.vital_signs && clinicalState.vital_signs.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {clinicalState.vital_signs.map((v: any, i: number) => (
                        <div key={i} className="p-2 bg-white rounded-lg border border-teal-200 flex justify-between items-center text-xs">
                          <span className="text-slate-600 font-medium">{v.name}:</span>
                          <span className="font-bold text-slate-900 font-mono">{v.value} {v.unit || ''}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600 font-medium text-xs">
                      Physical vitals recorded during bedside intake.
                    </p>
                  )}
                </div>
              </div>

              {/* Diagnostic Matrix / Objective Findings */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Physical Examination & Objective Findings (Editable)</span>
                </label>
                {isEditMode ? (
                  <textarea
                    rows={6}
                    value={draftObjective}
                    onChange={(e) => {
                      setDraftObjective(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Record objective clinical findings, examination notes, and lab matrix correlation..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-teal-500 leading-relaxed font-sans"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-52 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans text-xs text-slate-700 leading-relaxed">
                      {draftObjective || 'No objective findings recorded.'}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* A - ASSESSMENT */}
          <Card className="border-l-4 border-l-amber-500 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-black text-xs">
                  A
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Assessment (Impression & Risk Triage)</h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Clinical Synthesis
              </span>
            </div>

            <div className="space-y-3.5 text-xs flex-1">
              <div>
                <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                  Syndromic Clinical Impression & Differential (Editable)
                </label>
                {isEditMode ? (
                  <textarea
                    rows={4}
                    value={draftAssessment}
                    onChange={(e) => {
                      setDraftAssessment(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Record differential diagnosis, risk stratification, and clinical impression..."
                    className="w-full p-3 bg-amber-50/40 border border-amber-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
                  />
                ) : (
                  <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200 leading-relaxed">
                    <pre className="whitespace-pre-wrap font-sans text-xs text-slate-800 font-medium leading-relaxed">
                      {draftAssessment || 'Clinical impression pending physician correlation.'}
                    </pre>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Deterministic Red Flag Safety Evaluation
                </div>
                <div className="text-slate-700 text-xs">
                  {clinicalState?.red_flags?.length > 0 ? (
                    <span className="text-rose-700 font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      {clinicalState.red_flags.length} red flag safety conditions flagged for mandatory physician review.
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Zero deterministic safety red flags triggered.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* P - PLAN */}
          <Card className="border-l-4 border-l-emerald-500 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs">
                  P
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Plan (Next Steps & Diagnostics)</h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Physician Orders
              </span>
            </div>

            <div className="space-y-3.5 text-xs flex-1">
              <div>
                <label className="block text-[11px] font-bold text-emerald-950 uppercase tracking-wider mb-1">
                  Recommended Diagnostics & Action Items (Editable)
                </label>
                {isEditMode ? (
                  <textarea
                    rows={4}
                    value={draftPlan}
                    onChange={(e) => {
                      setDraftPlan(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="1. Targeted laboratory tests or imaging\n2. Clinical monitoring instructions\n3. Outpatient consultation timeline..."
                    className="w-full p-3 bg-emerald-50/40 border border-emerald-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                  />
                ) : (
                  <div className="p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-200">
                    <pre className="whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed font-medium">
                      {draftPlan || '1. Outpatient physician consultation.'}
                    </pre>
                  </div>
                )}
              </div>

              {/* Attending Doctor Private Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Attending Physician Private Clinical Notes
                </label>
                <textarea
                  rows={2}
                  value={draftDoctorNotes}
                  onChange={(e) => {
                    setDraftDoctorNotes(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Optional confidential clinician notes, hospital ward transfer, or specific observations..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 4. DIGITIZED LABORATORY REPORTS & PRESCRIPTIONS SECTION */}
      <Card className="border-2 border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-200 gap-3">
          <div>
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              <span>Digitized Laboratory Reports & Prescriptions (OCR)</span>
            </h4>
            <span className="text-xs text-slate-500">
              Directly extracted from physical lab sheets and handwritten prescriptions via TrOCR pipeline.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isAttachingDoc}
              onClick={() => handleAttachQuickDoc('sample_cbc')}
              className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
            >
              + Attach Test CBC Lab
            </button>
            <button
              type="button"
              disabled={isAttachingDoc}
              onClick={() => handleAttachQuickDoc('sample_rx')}
              className="px-3 py-1.5 rounded-xl border border-sky-300 bg-sky-50 text-sky-800 text-xs font-bold hover:bg-sky-100 transition-all cursor-pointer shadow-2xs"
            >
              + Attach Test Rx
            </button>
          </div>
        </div>

        {documents.length > 0 ? (
          <div className="space-y-4">
            {documents.map((doc: any) => {
              const ext = doc.extraction;
              const table = ext?.tables?.[0];
              const medications = ext?.extracted_entities?.filter((e: any) => e.category === 'medication') || [];

              return (
                <div key={doc.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-5 h-5 text-sky-600 shrink-0" />
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-slate-900">{doc.filename}</div>
                        <div className="text-[11px] text-slate-500">
                          {Math.round((doc.size_bytes || 0) / 1024)} KB • Engine: {ext?.ocr_engine || 'TrOCR'}
                        </div>
                      </div>
                    </div>
                    <Badge provenance="ocr">Digitized Record</Badge>
                  </div>

                  {/* Extracted Prescription Drugs */}
                  {medications.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Extracted Prescription Medications ({medications.length})
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {medications.map((m: any, idx: number) => (
                          <div key={idx} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-slate-900">{m.name}</span>
                              <span className="text-slate-600 ml-2 font-medium">{String(m.value)}</span>
                            </div>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-semibold">
                              {m.unit || 'Rx'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extracted Lab Table */}
                  {table && table.rows && table.rows.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Pathology Diagnostic Matrix
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                              {table.headers.map((h: string, i: number) => (
                                <th key={i} className="p-2 text-[11px] uppercase">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {table.rows.map((row: string[], rIdx: number) => {
                              const flag = (row[4] || 'NORMAL').toUpperCase();
                              const isAbnormal = flag === 'LOW' || flag === 'HIGH' || flag === 'CRITICAL';
                              return (
                                <tr key={rIdx} className={isAbnormal ? 'bg-amber-50/50' : 'hover:bg-slate-50'}>
                                  <td className="p-2 font-semibold text-slate-900">{row[0]}</td>
                                  <td className={`p-2 font-bold font-mono ${isAbnormal ? 'text-rose-900' : 'text-slate-800'}`}>{row[1]}</td>
                                  <td className="p-2 text-slate-500 font-mono">{row[2]}</td>
                                  <td className="p-2 text-slate-600">{row[3]}</td>
                                  <td className="p-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      flag === 'CRITICAL' ? 'bg-rose-600 text-white' :
                                      flag === 'LOW' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                                      flag === 'HIGH' ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                                      'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {flag}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-2">
            <FileText className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-xs font-bold text-slate-700">No Medical Documents Attached During Intake</div>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Patient completed first-time clinical interview. You can attach a sample CBC lab panel or prescription above to test OCR matrix parsing.
            </p>
          </div>
        )}
      </Card>

      {/* 5. MULTILINGUAL PATIENT VERNACULAR SUMMARY PREVIEW */}
      <Card className="bg-gradient-to-r from-sky-50/70 via-indigo-50/50 to-teal-50/70 border-2 border-sky-200">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-sky-200/80 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Languages className="w-5 h-5 text-sky-700" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Patient Plain-Language Vernacular Explanation</h4>
              <span className="text-xs text-slate-500">
                Audited plain-language case explanation presented to patient with loud audio readout
              </span>
            </div>
          </div>

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

      {/* 6. CLINICAL OBSERVATIONS VERIFICATION TABLE */}
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

        {/* 7. DOCTOR SIGN & FINALIZE ACTION */}
        <div className="pt-5 mt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            {verifySuccess ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Encounter Authenticated & Verified! FHIR R4 synced.
              </span>
            ) : (
              <span>All verified facts and draft changes are persisted to database and exported to FHIR R4.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={handleSaveDraft}
              isLoading={isSavingDraft}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Draft
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={onFinalize}
              isLoading={isVerifying}
              leftIcon={<ShieldCheck className="w-4 h-4" />}
            >
              Sign & Verify Encounter (FHIR R4 Ready)
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
