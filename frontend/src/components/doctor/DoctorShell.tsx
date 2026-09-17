import React, { useState } from 'react';
import { 
  Stethoscope, 
  AlertOctagon, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Share2, 
  Activity,
  History,
  ShieldCheck,
  Search
} from 'lucide-react';
import { Badge, type VerificationStatusType } from '../ui/Badge';

export interface PatientEncounterSummary {
  id: string;
  patientName: string;
  age: number;
  gender: string;
  uhid: string;
  chiefComplaint: string;
  redFlagsCount: number;
  status: VerificationStatusType;
  timestamp: string;
  intakeChannel: 'voice' | 'touch' | 'sign' | 'document';
}

export interface DoctorShellProps {
  encounters: PatientEncounterSummary[];
  selectedEncounterId: string | null;
  onSelectEncounter: (id: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

export const DoctorShell: React.FC<DoctorShellProps> = ({
  encounters,
  selectedEncounterId,
  onSelectEncounter,
  activeTab,
  onTabChange,
  children,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const selectedEncounter = encounters.find((e) => e.id === selectedEncounterId) || encounters[0];

  const filteredEncounters = encounters.filter((e) =>
    e.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.chiefComplaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.uhid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'summary', label: 'Clinical Summary', icon: <FileText className="w-4 h-4" /> },
    { id: 'socrates', label: 'HPI & SOCRATES', icon: <Activity className="w-4 h-4" /> },
    { id: 'meds', label: 'Meds & Allergies', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'docs', label: 'Documents & OCR', icon: <FileText className="w-4 h-4" /> },
    { id: 'timeline', label: 'Patient Timeline', icon: <History className="w-4 h-4" /> },
    { id: 'fhir', label: 'FHIR R4 / ABDM', icon: <Share2 className="w-4 h-4" /> },
  ];

  return (
    <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden">
      {/* Doctor Top Clinical Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-teal-700 font-bold text-lg">
            <Stethoscope className="w-6 h-6 stroke-[2.2]" />
            <span>Physician Clinical Decision Workspace</span>
          </div>
          <span className="hidden md:inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            Intake Verification Mode
          </span>
        </div>

        {selectedEncounter && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-900">{selectedEncounter.patientName}</div>
              <div className="text-[11px] text-slate-500">
                {selectedEncounter.age}y / {selectedEncounter.gender} • UHID: {selectedEncounter.uhid}
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
              {selectedEncounter.patientName.charAt(0)}
            </div>
          </div>
        )}
      </div>

      {/* Main Workspace Layout (Sidebar + Detail) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Encounter Queue */}
        <aside className="w-80 sm:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>Intake Queue</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">
                  {encounters.length}
                </span>
              </h2>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search patient, complaint, UHID..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Queue List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredEncounters.map((enc) => {
              const isSelected = enc.id === selectedEncounterId;
              return (
                <div
                  key={enc.id}
                  onClick={() => onSelectEncounter(enc.id)}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-teal-50/70 border-l-4 border-teal-600'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-bold text-sm text-slate-900">{enc.patientName}</div>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {enc.timestamp}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mb-2">
                    {enc.age} yrs • {enc.gender} • <span className="font-medium text-slate-800">{enc.chiefComplaint}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {enc.redFlagsCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertOctagon className="w-3 h-3 text-rose-600" />
                          {enc.redFlagsCount} Red Flag{enc.redFlagsCount > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Clear
                        </span>
                      )}
                    </div>
                    <Badge verification={enc.status} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right Panel: Detail View */}
        <section className="flex-1 flex flex-col overflow-y-auto bg-slate-50">
          {/* Clinical Navigation Tabs */}
          <div className="bg-white border-b border-slate-200 px-6 pt-2 sticky top-0 z-20 shadow-2xs">
            <div className="flex space-x-1 sm:space-x-4 overflow-x-auto">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                      isActive
                        ? 'border-teal-600 text-teal-700 bg-teal-50/30'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content Body */}
          <div className="p-6 max-w-6xl w-full mx-auto flex-1">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
};
