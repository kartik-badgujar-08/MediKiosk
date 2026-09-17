import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DoctorShell, type PatientEncounterSummary } from '../components/doctor/DoctorShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { 
  Check, 
  Edit3, 
  X, 
  AlertTriangle, 
  FileText, 
  Share2, 
  CheckCircle2, 
  Layers,
  Sparkles,
  Loader2,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';
import { api } from '../services/api';

export const DoctorPage: React.FC = () => {
  const { doctorProfile } = useAuth();
  const [encounters, setEncounters] = useState<PatientEncounterSummary[]>([]);
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [isLoading, setIsLoading] = useState(true);

  // Encounter detailed data from backend
  const [clinicalState, setClinicalState] = useState<any | null>(null);
  const [summary, setSummary] = useState<any | null>(null);
  const [fhirBundle, setFhirBundle] = useState<any | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);

  // Fact action tracking
  const [verificationMap, setVerificationMap] = useState<Record<string, 'ACCEPTED' | 'AMENDED' | 'REJECTED'>>({});
  const [amendedValues, setAmendedValues] = useState<Record<string, string>>({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);

  const loadEncounters = async () => {
    setIsLoading(true);
    try {
      let rawEncounters = await api.getEncounters();
      if (!rawEncounters || rawEncounters.length === 0) {
        // Seed demo data if database has no encounters
        await api.seedDemoData();
        rawEncounters = await api.getEncounters();
      }

      // Map to summaries
      const mapped: PatientEncounterSummary[] = await Promise.all(
        rawEncounters.map(async (enc: any) => {
          let patientName = 'Patient';
          let age = 35;
          let gender = 'Male';
          let uhid = 'UHID-2026-XXXX';

          try {
            const p = await api.getPatient(enc.patient_id);
            if (p) {
              patientName = p.name;
              age = p.age;
              gender = p.gender;
              uhid = p.uhid || uhid;
            }
          } catch (e) {
            console.warn('Failed to load patient for encounter:', e);
          }

          let redFlagsCount = 0;
          try {
            const st = await api.getClinicalState(enc.id);
            redFlagsCount = st?.red_flags?.length || 0;
          } catch {}

          return {
            id: enc.id,
            patientName,
            age,
            gender,
            uhid,
            chiefComplaint: enc.chief_complaint || 'General Clinical Intake',
            redFlagsCount,
            status: enc.status,
            timestamp: new Date(enc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            intakeChannel: enc.intake_channel || 'touch',
          };
        })
      );

      setEncounters(mapped);
      if (mapped.length > 0 && !selectedEncounterId) {
        setSelectedEncounterId(mapped[0].id);
      }
    } catch (err) {
      console.error('Failed to load encounters:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEncounters();
  }, []);

  // Load detailed encounter data when selectedEncounterId changes
  useEffect(() => {
    if (!selectedEncounterId) return;

    const loadEncounterDetails = async () => {
      try {
        const [st, sum, bundle] = await Promise.all([
          api.getClinicalState(selectedEncounterId).catch(() => null),
          api.getSummary(selectedEncounterId).catch(() => null),
          api.getFHIRBundle(selectedEncounterId).catch(() => null),
        ]);

        setClinicalState(st);
        setSummary(sum);
        setFhirBundle(bundle);

        // Load timeline if patient_id is available
        const currentEnc = encounters.find((e) => e.id === selectedEncounterId);
        if (currentEnc && st?.patient_id) {
          const t = await api.getPatientTimeline(st.patient_id).catch(() => null);
          setTimelineEvents(t?.events || []);
        }

        // Initialize verification map
        const initialMap: Record<string, 'ACCEPTED' | 'AMENDED' | 'REJECTED'> = {};
        if (st) {
          const allFacts = [
            st.chief_complaint,
            ...(st.history_of_present_illness || []),
            ...(st.medications || []),
            ...(st.allergies || []),
            ...(st.associated_symptoms || []),
            ...(st.investigations || []),
          ].filter(Boolean);

          allFacts.forEach((f: any) => {
            initialMap[f.id] = f.verification_status === 'REJECTED' ? 'REJECTED' : 'ACCEPTED';
          });
        }
        setVerificationMap(initialMap);
      } catch (err) {
        console.error('Failed to load encounter details:', err);
      }
    };

    loadEncounterDetails();
  }, [selectedEncounterId, encounters]);

  const handleFactAction = (factId: string, action: 'ACCEPTED' | 'AMENDED' | 'REJECTED') => {
    if (action === 'AMENDED') {
      const currentFact = allFactsList.find((f: any) => f.id === factId);
      const newVal = window.prompt('Enter amended clinical value:', String(currentFact?.value || ''));
      if (newVal !== null) {
        setAmendedValues((prev) => ({ ...prev, [factId]: newVal }));
        setVerificationMap((prev) => ({ ...prev, [factId]: action }));
      }
      return;
    }
    setVerificationMap((prev) => ({ ...prev, [factId]: action }));
  };

  const handleDoctorFinalize = async () => {
    if (!selectedEncounterId) return;
    setIsVerifying(true);
    try {
      const actions = Object.entries(verificationMap).map(([factId, act]) => ({
        fact_id: factId,
        action: act,
        amended_value: amendedValues[factId] || null,
        clinical_notes: act === 'AMENDED' ? 'Doctor amended clinical value' : undefined,
      }));

      await api.doctorVerify({
        encounter_id: selectedEncounterId,
        doctor_id: doctorProfile ? doctorProfile.hpr_id : 'dr_ramesh',
        doctor_name: doctorProfile ? doctorProfile.full_name : 'Dr. Ramesh Sharma',
        actions,
        overall_assessment: 'Verified and finalized by attending physician.',
        finalize_encounter: true,
      });

      setVerifySuccess(true);
      loadEncounters();
    } catch (err) {
      console.error('Failed to verify clinical facts:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading && encounters.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <span className="text-sm font-semibold text-slate-600">Loading Clinical Intake Queue...</span>
        </div>
      </div>
    );
  }

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
    <DoctorShell
      encounters={encounters}
      selectedEncounterId={selectedEncounterId}
      onSelectEncounter={setSelectedEncounterId}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* Clinician Identity Banner */}
      {doctorProfile ? (
        <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                <span>NMC Verified Attending Physician: <strong>{doctorProfile.full_name}</strong></span>
              </div>
              <div className="text-[11px] text-slate-600 font-mono">
                {doctorProfile.degrees} • {doctorProfile.registration_number} ({doctorProfile.state_medical_council})
              </div>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold border border-teal-200">
            HPR Authenticated
          </span>
        </div>
      ) : (
        <div className="mb-4 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs text-amber-900">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Attending Clinician:</strong> Guest Mode (Dr. Ramesh Sharma). Sign in with HPR to bind NMC digital signature.
            </span>
          </div>
          <Link
            to="/login?role=doctor"
            className="px-3 py-1 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-2xs"
          >
            HPR Sign In
          </Link>
        </div>
      )}

      {/* Tab: Clinical Summary */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Red Flag Alert Banner */}
          {clinicalState?.red_flags && clinicalState.red_flags.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1 text-xs text-amber-900">
                <strong className="text-sm font-bold block mb-1">
                  Deterministic Safety Alerts ({clinicalState.red_flags.length} Detected)
                </strong>
                <ul className="list-disc pl-4 space-y-1">
                  {clinicalState.red_flags.map((rf: any, i: number) => (
                    <li key={i}>
                      <strong>{rf.title}:</strong> {rf.clinical_rationale}
                    </li>
                  ))}
                </ul>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-200 text-amber-900 rounded-md shrink-0">
                Clinician Attention
              </span>
            </div>
          )}

          {/* AI Physician Draft Summary Card */}
          <Card>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-violet-50 text-violet-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Physician-Ready Intake Summary</h3>
                  <p className="text-xs text-slate-500">
                    Synthesized from Multi-channel Input + OCR Digestion ({summary?.ai_model_used || 'Qwen/MediKiosk Engine'})
                  </p>
                </div>
              </div>
              <Badge provenance="ai_generated">Draft AI Summary</Badge>
            </div>

            {/* Structured Clinical Sections */}
            <div className="space-y-5 text-sm">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  History of Present Illness (HPI)
                </h4>
                <p className="text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm">
                  {summary?.hpi_narrative || 'Intake interview completed. Presenting illness progression recorded.'}
                </p>
              </div>

              {/* Individual Extracted Facts with Doctor Verification Controls */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Clinical Observations & Verification Actions (Accept / Amend / Reject)
                  </h4>
                  <span className="text-xs text-slate-400">
                    {allFactsList.length} Facts Extracted
                  </span>
                </div>

                <div className="space-y-2.5">
                  {allFactsList.map((fact: any) => {
                    const action = verificationMap[fact.id] || 'ACCEPTED';
                    return (
                      <div
                        key={fact.id}
                        className={`p-3.5 bg-white border rounded-xl flex items-center justify-between gap-4 transition-all ${
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

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleFactAction(fact.id, 'ACCEPTED')}
                            className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                              action === 'ACCEPTED'
                                ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                                : 'text-slate-600 hover:bg-emerald-50 border-slate-200'
                            }`}
                            title="Accept fact"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleFactAction(fact.id, 'AMENDED')}
                            className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                              action === 'AMENDED'
                                ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                                : 'text-slate-600 hover:bg-indigo-50 border-slate-200'
                            }`}
                            title="Amend fact"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleFactAction(fact.id, 'REJECTED')}
                            className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                              action === 'REJECTED'
                                ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
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
              </div>

              {/* Doctor Sign and Verify Button */}
              <div className="pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
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
                  onClick={handleDoctorFinalize}
                  isLoading={isVerifying}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Sign & Verify Encounter (FHIR R4 Ready)
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab: SOCRATES & Symptoms */}
      {activeTab === 'socrates' && (
        <Card>
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600" />
            <span>SOCRATES Pain & Symptom Breakdown</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="block text-slate-500 uppercase tracking-wider text-[10px]">Site (S)</strong>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                {clinicalState?.pain_assessment?.site?.value || 'Head / Retro-orbital'}
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="block text-slate-500 uppercase tracking-wider text-[10px]">Onset (O)</strong>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                {clinicalState?.pain_assessment?.onset?.value || 'Acute sudden onset (3 days)'}
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="block text-slate-500 uppercase tracking-wider text-[10px]">Character (C)</strong>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                {clinicalState?.pain_assessment?.character?.value || 'Throbbing dull ache'}
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="block text-slate-500 uppercase tracking-wider text-[10px]">Radiation (R)</strong>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                {clinicalState?.pain_assessment?.radiation?.value || 'No neck radiation'}
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="block text-slate-500 uppercase tracking-wider text-[10px]">Severity (S)</strong>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                {clinicalState?.pain_assessment?.severity?.value || '7'} / 10
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab: Meds & Allergies */}
      {activeTab === 'meds' && (
        <Card>
          <h3 className="text-base font-bold text-slate-900 mb-4">Medications, Allergies & AYUSH History</h3>
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-800 text-sm mb-2">Prescriptions & Ingestions</div>
              {clinicalState?.medications?.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                  {clinicalState.medications.map((m: any, i: number) => (
                    <li key={i}>
                      <strong>{m.name}</strong> — {String(m.value)} (Source: {m.source})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500">No active prescription medicines logged.</p>
              )}
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="font-bold text-emerald-900 text-sm mb-1">Documented Allergies</div>
              <p className="text-emerald-800">
                {clinicalState?.allergies?.length > 0
                  ? clinicalState.allergies.map((a: any) => `${a.name}: ${a.value}`).join(', ')
                  : 'No known drug allergies (NKDA) recorded.'}
              </p>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="font-bold text-amber-900 text-sm mb-1">AYUSH & Herbal Home Remedies</div>
              <p className="text-amber-800">
                {clinicalState?.ayush_history?.length > 0
                  ? clinicalState.ayush_history.map((ay: any) => `${ay.name}: ${ay.value}`).join(', ')
                  : 'No Ayurvedic or homeopathic remedies logged.'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tab: Documents & OCR */}
      {activeTab === 'docs' && (
        <Card>
          <h3 className="text-base font-bold text-slate-900 mb-4">Uploaded Medical Documents & Digitized OCR</h3>
          <div className="space-y-3">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-sky-600 shrink-0" />
                <div>
                  <div className="font-bold text-sm text-slate-900">Lab_Report_CBC_Haematology.pdf</div>
                  <div className="text-xs text-slate-500">
                    PaddleOCR & PP-StructureV3 • Platelet Count (130,000 /uL), Hemoglobin (13.8 g/dL)
                  </div>
                </div>
              </div>
              <Badge provenance="ocr">Digitized</Badge>
            </div>
          </div>
        </Card>
      )}

      {/* Tab: Timeline */}
      {activeTab === 'timeline' && (
        <Card>
          <h3 className="text-base font-bold text-slate-900 mb-4">Longitudinal Patient Timeline</h3>
          <div className="space-y-6 pl-4 border-l-2 border-teal-200 text-xs">
            {timelineEvents.map((evt: any) => (
              <div key={evt.id} className="relative">
                <div className="w-3 h-3 rounded-full bg-teal-500 absolute -left-[23px] top-1 ring-4 ring-white" />
                <div className="text-[11px] text-teal-700 font-bold uppercase tracking-wider">{evt.year} • {evt.date.slice(0, 10)}</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{evt.title}</div>
                <div className="text-slate-600 mt-0.5">{evt.description}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab: FHIR R4 Bundle Preview */}
      {activeTab === 'fhir' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-600" />
              <span>HL7 FHIR R4 Resource Bundle</span>
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              ABDM & HIS Interoperable
            </span>
          </div>
          <pre className="p-4 bg-slate-900 text-emerald-400 rounded-2xl text-xs overflow-x-auto font-mono max-h-96">
            {fhirBundle ? JSON.stringify(fhirBundle, null, 2) : '// Loading FHIR R4 Bundle...'}
          </pre>
        </Card>
      )}
    </DoctorShell>
  );
};
