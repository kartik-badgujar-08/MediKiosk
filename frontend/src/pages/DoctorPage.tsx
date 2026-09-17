import React, { useState } from 'react';
import { DoctorShell, type PatientEncounterSummary } from '../components/doctor/DoctorShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { 
  Check, 
  Edit3, 
  X, 
  AlertTriangle, 
  FileText, 
  Share2, 
  CheckCircle2, 
  Layers,
  Sparkles
} from 'lucide-react';

export const DoctorPage: React.FC = () => {
  const [encounters] = useState<PatientEncounterSummary[]>([
    {
      id: 'enc-001',
      patientName: 'Rahul Sharma',
      age: 35,
      gender: 'Male',
      uhid: 'UHID-2026-8941',
      chiefComplaint: 'Fever (3 days) + Headache',
      redFlagsCount: 1,
      status: 'PENDING',
      timestamp: '10 mins ago',
      intakeChannel: 'voice',
    },
    {
      id: 'enc-002',
      patientName: 'Sunita Patil',
      age: 28,
      gender: 'Female',
      uhid: 'UHID-2026-8942',
      chiefComplaint: 'Acute Abdominal Pain (ISL Intake)',
      redFlagsCount: 0,
      status: 'PATIENT_CONFIRMED',
      timestamp: '25 mins ago',
      intakeChannel: 'sign',
    },
    {
      id: 'enc-003',
      patientName: 'Amit Verma',
      age: 52,
      gender: 'Male',
      uhid: 'UHID-2026-8930',
      chiefComplaint: 'Productive Cough & Wheezing',
      redFlagsCount: 0,
      status: 'VERIFIED',
      timestamp: '1 hour ago',
      intakeChannel: 'touch',
    },
  ]);

  const [selectedEncounterId, setSelectedEncounterId] = useState('enc-001');
  const [activeTab, setActiveTab] = useState('summary');

  // Verification status state for Rahul's extracted items
  const [verificationMap, setVerificationMap] = useState<Record<string, 'ACCEPTED' | 'AMENDED' | 'REJECTED'>>({
    fever: 'ACCEPTED',
    headache: 'ACCEPTED',
    mosquito: 'ACCEPTED',
    paracetamol: 'ACCEPTED',
  });

  const handleAction = (key: string, action: 'ACCEPTED' | 'AMENDED' | 'REJECTED') => {
    setVerificationMap((prev) => ({ ...prev, [key]: action }));
  };

  return (
    <DoctorShell
      encounters={encounters}
      selectedEncounterId={selectedEncounterId}
      onSelectEncounter={setSelectedEncounterId}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* Tab: Clinical Summary */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Red Flag Alert Banner */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1 text-xs text-amber-900">
              <strong className="text-sm font-bold block mb-0.5">
                Deterministic Red Flag Rule Triggered (Clinician Attention Required)
              </strong>
              High fever with prolonged duration (3 days), generalized body ache, retro-orbital headache, 
              and significant local mosquito exposure reported. Check CBC platelet count and hematocrit for acute viral vector-borne disease.
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md">
              High Priority
            </span>
          </div>

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
                    Synthesized from Multilingual Voice + Patient Review + PaddleOCR Ingestion
                  </p>
                </div>
              </div>
              <Badge provenance="ai_generated">Draft AI Summary</Badge>
            </div>

            {/* Structured Clinical Sections */}
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  History of Present Illness (HPI)
                </h4>
                <p className="text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  A 35-year-old male presents with acute febrile illness for 3 days, accompanied by throbbing headache and diffuse myalgia. Patient notes active mosquito exposure in his residential locality. Denies shortness of breath, active chest pain, or petechial skin rashes.
                </p>
              </div>

              {/* Individual Extracted Facts with Doctor Verification Controls */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Clinical Facts & Verification Actions
                </h4>
                <div className="space-y-2.5">
                  {/* Fact 1 */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Badge provenance="patient_voice" />
                      <div>
                        <div className="font-bold text-slate-800 text-xs sm:text-sm">
                          Fever: 3 days duration, moderate-high grade
                        </div>
                        <div className="text-[11px] text-slate-500">Confidence: 94% • Voice (Hindi)</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAction('fever', 'ACCEPTED')}
                        className={`p-1.5 rounded-lg text-xs font-bold border transition-all ${
                          verificationMap.fever === 'ACCEPTED'
                            ? 'bg-emerald-500 text-white border-emerald-600'
                            : 'text-slate-600 hover:bg-emerald-50'
                        }`}
                        title="Accept fact"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleAction('fever', 'AMENDED')}
                        className={`p-1.5 rounded-lg text-xs font-bold border transition-all ${
                          verificationMap.fever === 'AMENDED'
                            ? 'bg-indigo-500 text-white border-indigo-600'
                            : 'text-slate-600 hover:bg-indigo-50'
                        }`}
                        title="Amend fact"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleAction('fever', 'REJECTED')}
                        className={`p-1.5 rounded-lg text-xs font-bold border transition-all ${
                          verificationMap.fever === 'REJECTED'
                            ? 'bg-rose-500 text-white border-rose-600'
                            : 'text-slate-600 hover:bg-rose-50'
                        }`}
                        title="Reject fact"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Fact 2 */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Badge provenance="ocr" />
                      <div>
                        <div className="font-bold text-slate-800 text-xs sm:text-sm">
                          Medication: Paracetamol 650mg TDS
                        </div>
                        <div className="text-[11px] text-slate-500">Extracted from old prescription • Confidence: 91%</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAction('paracetamol', 'ACCEPTED')}
                        className={`p-1.5 rounded-lg text-xs font-bold border transition-all ${
                          verificationMap.paracetamol === 'ACCEPTED'
                            ? 'bg-emerald-500 text-white border-emerald-600'
                            : 'text-slate-600 hover:bg-emerald-50'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleAction('paracetamol', 'AMENDED')}
                        className={`p-1.5 rounded-lg text-xs font-bold border transition-all ${
                          verificationMap.paracetamol === 'AMENDED'
                            ? 'bg-indigo-500 text-white border-indigo-600'
                            : 'text-slate-600 hover:bg-indigo-50'
                        }`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleAction('paracetamol', 'REJECTED')}
                        className={`p-1.5 rounded-lg text-xs font-bold border transition-all ${
                          verificationMap.paracetamol === 'REJECTED'
                            ? 'bg-rose-500 text-white border-rose-600'
                            : 'text-slate-600 hover:bg-rose-50'
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification and Submission Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  All accepted facts will be converted into verified FHIR R4 resources and synced to ABDM.
                </div>
                <Button variant="secondary" size="md" leftIcon={<CheckCircle2 className="w-4 h-4" />}>
                  Sign & Verify Encounter (FHIR Ready)
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
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="block text-slate-500 uppercase tracking-wider text-[10px]">
                Site (S)
              </strong>
              <div className="font-bold text-slate-800 text-sm mt-0.5">Frontal & Retro-orbital</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="block text-slate-500 uppercase tracking-wider text-[10px]">
                Onset (O)
              </strong>
              <div className="font-bold text-slate-800 text-sm mt-0.5">Sudden onset, 3 days ago</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="block text-slate-500 uppercase tracking-wider text-[10px]">
                Character (C)
              </strong>
              <div className="font-bold text-slate-800 text-sm mt-0.5">Throbbing, continuous dull ache</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="block text-slate-500 uppercase tracking-wider text-[10px]">
                Radiation (R)
              </strong>
              <div className="font-bold text-slate-800 text-sm mt-0.5">No neck radiation / no stiffness</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="block text-slate-500 uppercase tracking-wider text-[10px]">
                Associated Symptoms (A)
              </strong>
              <div className="font-bold text-slate-800 text-sm mt-0.5">Fever, chills, generalized myalgia</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="block text-slate-500 uppercase tracking-wider text-[10px]">
                Severity (S)
              </strong>
              <div className="font-bold text-slate-800 text-sm mt-0.5">7 / 10 (Moderate to Severe)</div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab: Meds & Allergies */}
      {activeTab === 'meds' && (
        <Card>
          <h3 className="text-base font-bold text-slate-900 mb-4">Medications & Allergies</h3>
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-800 text-sm mb-1">Active Prescriptions</div>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li>Paracetamol 650 mg — 1 tab TDS PRN (Source: Physical prescription upload)</li>
                <li>Oral Rehydration Solution (ORS) — Frequent sips (Source: Patient voice)</li>
              </ul>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="font-bold text-emerald-900 text-sm mb-1">Known Allergies</div>
              <p className="text-emerald-800">
                No known drug allergies (NKDA) recorded during intake session.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tab: Documents & OCR */}
      {activeTab === 'docs' && (
        <Card>
          <h3 className="text-base font-bold text-slate-900 mb-4">Uploaded Documents & OCR Extractions</h3>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-sky-600" />
              <div>
                <div className="font-bold text-sm text-slate-900">Prescription_Opd_01.jpg</div>
                <div className="text-xs text-slate-500">Processed by PaddleOCR & PP-StructureV3 • 2 entities extracted</div>
              </div>
            </div>
            <Badge provenance="ocr">OCR Verified</Badge>
          </div>
        </Card>
      )}

      {/* Tab: Timeline */}
      {activeTab === 'timeline' && (
        <Card>
          <h3 className="text-base font-bold text-slate-900 mb-4">Longitudinal Patient Timeline</h3>
          <div className="space-y-4 pl-4 border-l-2 border-teal-200 text-xs">
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-teal-500 absolute -left-[23px] top-1"></div>
              <div className="font-bold text-slate-900 text-sm">Today — Current Encounter (OPD Intake)</div>
              <div className="text-slate-600">Acute febrile illness, headache, mosquito exposure. Intake via MediKiosk.</div>
            </div>
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-slate-300 absolute -left-[23px] top-1"></div>
              <div className="font-bold text-slate-700 text-sm">Aug 2025 — General OPD Visit</div>
              <div className="text-slate-600">Seasonal allergic rhinitis. Prescribed Cetirizine 10mg.</div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab: FHIR & ABDM */}
      {activeTab === 'fhir' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-600" />
              <span>FHIR R4 Resource Bundle Preview</span>
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              ABDM M1/M2/M3 Ready
            </span>
          </div>
          <pre className="p-4 bg-slate-900 text-emerald-400 rounded-2xl text-xs overflow-x-auto font-mono max-h-96">
{JSON.stringify(
  {
    resourceType: "Bundle",
    type: "collection",
    entry: [
      {
        resource: {
          resourceType: "Patient",
          id: "patient-rahul-35",
          name: [{ use: "official", family: "Sharma", given: ["Rahul"] }],
          gender: "male",
          birthDate: "1991-04-12"
        }
      },
      {
        resource: {
          resourceType: "Condition",
          clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }] },
          verificationStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "unconfirmed" }] },
          code: { text: "Fever and Headache" },
          subject: { reference: "Patient/patient-rahul-35" }
        }
      }
    ]
  },
  null,
  2
)}
          </pre>
        </Card>
      )}
    </DoctorShell>
  );
};
