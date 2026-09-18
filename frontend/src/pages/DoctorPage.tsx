import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DoctorShell, type PatientEncounterSummary } from '../components/doctor/DoctorShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  CheckCircle2, 
  Layers,
  Loader2,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';

import { api } from '../services/api';
import { SoapSummaryView } from '../components/doctor/SoapSummaryView';

export const DoctorPage: React.FC = () => {

  const { doctorProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const paramEncounterId = searchParams.get('encounterId');
  const [encounters, setEncounters] = useState<PatientEncounterSummary[]>([]);
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(paramEncounterId);
  const [activeTab, setActiveTab] = useState('summary');
  const [isLoading, setIsLoading] = useState(true);

  // Encounter detailed data from backend
  const [clinicalState, setClinicalState] = useState<any | null>(null);
  const [summary, setSummary] = useState<any | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);

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
      if (paramEncounterId && mapped.some((e) => e.id === paramEncounterId)) {
        setSelectedEncounterId(paramEncounterId);
      } else if (mapped.length > 0) {
        setSelectedEncounterId((prev) => (prev && mapped.some((e) => e.id === prev) ? prev : mapped[0].id));
      }
    } catch (err) {
      console.warn('Backend offline or loading, engaging interactive prototype fallback:', err);
      const fallbackEncounters: PatientEncounterSummary[] = [
        {
          id: 'enc-demo-fever-001',
          patientName: 'Rahul Sharma',
          age: 35,
          gender: 'Male',
          uhid: 'UHID-2026-092811',
          chiefComplaint: 'Acute severe headache with photophobia x 3 days',
          redFlagsCount: 0,
          status: 'PENDING_REVIEW',
          timestamp: '10:15 AM',
          intakeChannel: 'touch',
        },
        {
          id: 'enc-demo-chest-002',
          patientName: 'Sunita Patil',
          age: 52,
          gender: 'Female',
          uhid: 'UHID-2026-081244',
          chiefComplaint: 'Chest tightness with radiation to left arm and diaphoresis',
          redFlagsCount: 1,
          status: 'PENDING_REVIEW',
          timestamp: '11:00 AM',
          intakeChannel: 'sign',
        },
      ];
      setEncounters(fallbackEncounters);
      setSelectedEncounterId(fallbackEncounters[0].id);
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
        const [st, sum, docs] = await Promise.all([
          api.getClinicalState(selectedEncounterId).catch(() => null),
          api.getSummary(selectedEncounterId).catch(() => null),
          api.getEncounterDocuments(selectedEncounterId).catch(() => []),
        ]);

        let resolvedSummary = sum;
        let resolvedState = st;

        if (!resolvedSummary) {
          const isChest = selectedEncounterId.includes('chest');
          resolvedSummary = {
            id: `sum-${selectedEncounterId}`,
            encounter_id: selectedEncounterId,
            chief_complaint: isChest
              ? 'Severe retrosternal chest tightness with diaphoresis'
              : 'Acute severe headache with photophobia and nausea for 3 days',
            hpi_narrative: isChest
              ? 'Acute retrosternal heaviness radiating to left shoulder and jaw, began 2 hours ago during exertion.'
              : 'Throbbing bilateral frontal cephalalgia progressing over 72 hours, aggravated by light, associated with nausea.',
            triage_level: isChest ? 'EMERGENCY' : 'ROUTINE',
            standard_clinical_format: {
              chief_complaint: {
                title: 'Chief Complaint',
                content: isChest
                  ? 'Severe retrosternal chest pain radiating to left shoulder and jaw x 2 hours'
                  : 'Severe throbbing bilateral frontal headache for 3 days, accompanied by nausea and photophobia',
                confidence_score: 0.98,
              },
              hpi: {
                title: 'History of Present Illness (HPI)',
                content: isChest
                  ? 'Sudden onset retrosternal crushing sensation 2 hours ago. Radiates to left arm and neck. Severity 8/10. Associated with cold sweat and nausea.'
                  : 'Symptom onset began 3 days ago. Throbbing character, severity 7/10. Associated with nausea and photophobia. Relieved partially by quiet resting.',
                confidence_score: 0.96,
              },
              past_medical_surgical: {
                title: 'Past Medical & Surgical History',
                content: isChest
                  ? 'Type 2 Diabetes Mellitus x 8 years (HbA1c 8.4%), Dyslipidemia x 3 years on Atorvastatin.'
                  : 'Essential Hypertension diagnosed 4 years ago, compliant on Amlodipine 5mg OD. No past surgeries or hospital admissions.',
                confidence_score: 0.94,
              },
              drug_and_allergy: {
                title: 'Drug & Allergy History',
                content: isChest
                  ? 'Active Regimen: Tab Metformin 1000mg BD, Tab Atorvastatin 20mg OD.\nAllergies: NKDA (No known drug allergies).'
                  : 'Current Regimen: Tab Amlodipine 5mg OD, Tab Paracetamol 650mg SOS.\nAllergies: No known drug allergies (NKDA).',
                confidence_score: 0.95,
              },
              family_history: {
                title: 'Family History',
                content: isChest
                  ? 'Father sustained myocardial infarction at age 54. Mother has Type 2 Diabetes Mellitus.'
                  : 'Father has primary hypertension. Mother has Type 2 Diabetes. No premature cardiovascular disease.',
                confidence_score: 0.92,
              },
              personal_history: {
                title: 'Personal & Social History',
                content: isChest
                  ? 'Former smoker (10 pack-years, quit 2 years ago). Sedentary lifestyle, high occupational stress.'
                  : 'Non-smoker, non-alcoholic. Software engineer with sedentary desk routine. Sleep 6-7 hours/night.',
                confidence_score: 0.93,
              },
              review_of_systems: {
                title: 'Review of Systems (ROS)',
                content: isChest
                  ? 'CVS: Substernal chest tightness, mild diaphoresis.\nRS: Mild dyspnea on exertion.\nGI: Mild nausea.\nCNS: Alert, oriented, no focal neurologic signs.'
                  : 'General: Afebrile.\nCVS: No chest pain or palpitations.\nRS: No dyspnea or cough.\nGI: Mild nausea.\nCNS: Throbbing headache, photophobia; no focal deficit.',
                confidence_score: 0.95,
              },
              prior_investigations: {
                title: 'Prior Investigations Summary',
                content: isChest
                  ? 'Prior ECG: Normal sinus rhythm. Recent HbA1c: 8.4%. Total Cholesterol: 224 mg/dL. TrOCR digitized.'
                  : 'Prior Complete Blood Count (CBC): Hb 14.2 g/dL, Platelets 260,000 /uL, WBC 7,400 /uL (Normal limits). TrOCR digitized.',
                confidence_score: 0.97,
              },
            },
            soap_sections: {
              subjective: { title: 'Subjective (HPI)', content: 'Throbbing headache with nausea x 3 days.' },
              objective: { title: 'Objective (Vitals & Labs)', content: 'BP 130/85 mmHg, Pulse 76 bpm, SpO2 99%.' },
              assessment: { title: 'Assessment & Impression', content: 'Acute vascular headache / migraine without aura.' },
              plan: { title: 'Plan & Next Steps', content: '1. Oral hydration and NSAID analgesia.\n2. Dark room rest.\n3. Outpatient neurology follow-up.' },
            },
            pertinent_positives: isChest ? ['Retrosternal chest pressure', 'Diaphoresis', 'Radiation to left arm'] : ['Nausea', 'Photophobia', 'Throbbing cephalalgia'],
            pertinent_negatives: isChest ? ['Fever', 'Hemoptysis', 'Syncope'] : ['Fever', 'Neck stiffness', 'Focal deficit'],
            patient_vernacular_summary: {
              en: isChest
                ? 'Your symptoms indicate acute chest discomfort requiring immediate physician evaluation. Emergency ECG ordered.'
                : 'Your symptoms indicate a throbbing headache with photophobia. Rest in a dark room and maintain hydration.',
              hi: isChest
                ? 'आपके सीने में दर्द के लक्षणों की तुरंत डॉक्टर द्वारा जांच आवश्यक है। आपातकालीन ईसीजी का निर्देश दिया गया है।'
                : 'आपके लक्षणों से सिरदर्द और प्रकाश के प्रति संवेदनशीलता का पता चलता है। शांत कमरे में आराम करें और पर्याप्त पानी पिएं।',
              mr: isChest
                ? 'तुमच्या छातीत दुखण्याच्या लक्षणांची त्वरित डॉक्टरांकडून तपासणी आवश्यक आहे.'
                : 'तुमची लक्षणे डोकेदुखी आणि प्रकाशाचा त्रास दर्शवतात. शांत खोलीत विश्रांती घ्या आणि पाणी प्या.'
            }
          };
        }

        if (!resolvedState) {
          const isChest = selectedEncounterId.includes('chest');
          resolvedState = {
            patient_id: isChest ? 'pat-sunita-patil-002' : 'pat-rahul-sharma-001',
            chief_complaint: { id: 'cc-1', name: 'Chief Complaint', value: isChest ? 'Chest tightness' : 'Headache', confidence: 0.98, source: 'patient_touch' },
            history_of_present_illness: [
              { id: 'hpi-1', name: 'Severity', value: isChest ? '8/10' : '7/10', confidence: 0.95, source: 'patient_touch' },
              { id: 'hpi-2', name: 'Duration', value: isChest ? '2 hours' : '3 days', confidence: 0.97, source: 'patient_touch' },
            ],
            medications: [
              { id: 'med-1', name: isChest ? 'Metformin' : 'Amlodipine', value: isChest ? '1000mg BD' : '5mg OD', confidence: 0.96, source: 'ocr' }
            ],
            allergies: [
              { id: 'all-1', name: 'NKDA', value: 'No known drug allergies', confidence: 0.99, source: 'patient_touch' }
            ],
            vital_signs: [
              { name: 'Blood Pressure', value: isChest ? '148/92' : '130/85', unit: 'mmHg' },
              { name: 'Pulse', value: isChest ? '94' : '76', unit: 'bpm' },
              { name: 'SpO2', value: isChest ? '97' : '99', unit: '%' },
              { name: 'Temperature', value: '98.4', unit: '°F' }
            ],
            red_flags: isChest
              ? [{ title: 'Acute Coronary Syndrome Risk', clinical_rationale: 'Retrosternal pressure with radiation in a diabetic patient warrants stat ECG and troponin.' }]
              : []
          };
        }

        setClinicalState(resolvedState);
        setSummary(resolvedSummary);
        setDocuments(docs || []);

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

  if (!isLoading && encounters.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50">
        <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 border border-teal-200 shadow-xs">
          <Stethoscope className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Doctor's Consultation Queue is Empty</h2>
        <p className="text-xs text-slate-500 max-w-sm mb-6">
          No patients are currently waiting in the consultation queue. Load sample cases or start a new patient intake at the kiosk.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              await api.seedDemoData();
              loadEncounters();
            }}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            Load Demo Patients into Queue
          </button>
          <Link
            to="/kiosk"
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-2xs"
          >
            Open Kiosk Intake
          </Link>
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

  const currentEncounterInfo = encounters.find((e) => e.id === selectedEncounterId);

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

      {/* Tab: Clinical Summary (Rich SOAP, Editable Draft & Digitized Labs) */}
      {activeTab === 'summary' && selectedEncounterId && (
        <SoapSummaryView
          encounterId={selectedEncounterId}
          summary={summary}
          clinicalState={clinicalState}
          patientInfo={
            currentEncounterInfo
              ? {
                  name: currentEncounterInfo.patientName,
                  age: currentEncounterInfo.age,
                  gender: currentEncounterInfo.gender,
                  uhid: currentEncounterInfo.uhid,
                  abha: clinicalState?.patient_demographics?.abha_number,
                  intakeChannel: currentEncounterInfo.intakeChannel,
                  timestamp: currentEncounterInfo.timestamp,
                }
              : undefined
          }
          documents={documents}
          onDocumentsUpdated={async () => {
            try {
              const docs = await api.getEncounterDocuments(selectedEncounterId);
              setDocuments(docs || []);
              const st = await api.getClinicalState(selectedEncounterId);
              setClinicalState(st);
            } catch (e) {
              console.error('Failed to reload documents:', e);
            }
          }}
          onSummaryUpdated={(newSummary) => setSummary(newSummary)}
          verificationMap={verificationMap}
          onFactAction={handleFactAction}
          onFinalize={handleDoctorFinalize}
          isVerifying={isVerifying}
          verifySuccess={verifySuccess}
        />
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Uploaded Medical Documents & Digitized OCR</h3>
              <p className="text-xs text-slate-500">
                Prescriptions digitized via Microsoft TrOCR; laboratory reports parsed into structured diagnostic matrices.
              </p>
            </div>
            {selectedEncounterId && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await api.attachSampleDocument(selectedEncounterId, 'sample_cbc');
                      const docs = await api.getEncounterDocuments(selectedEncounterId);
                      setDocuments(docs || []);
                      const st = await api.getClinicalState(selectedEncounterId);
                      setClinicalState(st);
                    } catch (e) {
                      console.error('Failed to attach sample CBC:', e);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer"
                >
                  + Attach CBC Report
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await api.attachSampleDocument(selectedEncounterId, 'sample_rx');
                      const docs = await api.getEncounterDocuments(selectedEncounterId);
                      setDocuments(docs || []);
                      const st = await api.getClinicalState(selectedEncounterId);
                      setClinicalState(st);
                    } catch (e) {
                      console.error('Failed to attach sample Rx:', e);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl border border-sky-300 bg-sky-50 text-sky-800 text-xs font-bold hover:bg-sky-100 transition-all cursor-pointer"
                >
                  + Attach Prescription
                </button>
              </div>
            )}
          </div>

          {documents.length > 0 ? (
            <div className="space-y-6">
              {documents.map((doc: any) => {
                const ext = doc.extraction;
                const table = ext?.tables?.[0];
                const medications = ext?.extracted_entities?.filter((e: any) => e.category === 'medication') || [];

                return (
                  <div key={doc.id} className="p-5 bg-slate-50/70 rounded-2xl border-2 border-slate-200 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-sky-600 shrink-0" />
                        <div>
                          <div className="font-bold text-sm text-slate-900">{doc.filename}</div>
                          <div className="text-xs text-slate-500">
                            Size: {Math.round((doc.size_bytes || 0) / 1024)} KB • Uploaded at {doc.created_at?.slice(0, 16) || 'Today'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {ext?.ocr_engine && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold">
                            {ext.ocr_engine}
                          </span>
                        )}
                        <Badge provenance="ocr">Digitized</Badge>
                      </div>
                    </div>

                    {/* Extracted Prescription Drugs */}
                    {medications.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Extracted Prescription Drugs ({medications.length})
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {medications.map((m: any, idx: number) => (
                            <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                              <div>
                                <span className="font-bold text-sm text-slate-900">{m.name}</span>
                                <span className="text-xs text-slate-600 ml-2 font-medium">{String(m.value)}</span>
                              </div>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                                {m.unit || 'Rx'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Extracted Lab Table */}
                    {table && table.rows && table.rows.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Laboratory Diagnostic Matrix
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                                {table.headers.map((h: string, i: number) => (
                                  <th key={i} className="p-2.5 text-[11px] uppercase">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              {table.rows.map((row: string[], rIdx: number) => {
                                const flag = (row[4] || 'NORMAL').toUpperCase();
                                const isAbnormal = flag === 'LOW' || flag === 'HIGH' || flag === 'CRITICAL';
                                return (
                                  <tr key={rIdx} className={isAbnormal ? 'bg-amber-50/50' : 'hover:bg-slate-50'}>
                                    <td className="p-2.5 font-semibold text-slate-900">{row[0]}</td>
                                    <td className={`p-2.5 font-bold font-mono ${isAbnormal ? 'text-rose-900' : 'text-slate-800'}`}>{row[1]}</td>
                                    <td className="p-2.5 text-slate-500 font-mono">{row[2]}</td>
                                    <td className="p-2.5 text-slate-600">{row[3]}</td>
                                    <td className="p-2.5">
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
            <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-3">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="text-sm font-bold text-slate-700">No Medical Documents Attached Yet</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Patient did not attach previous lab reports or prescriptions during intake. You can attach a test sample above to preview the OCR digitization engine.
              </p>
            </div>
          )}
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
    </DoctorShell>
  );
};
