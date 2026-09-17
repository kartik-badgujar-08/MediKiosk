import React, { useState } from 'react';
import { Pill, FileText, AlertTriangle, ChevronDown, ChevronUp, Cpu, Activity, Clock } from 'lucide-react';

export interface ExtractedEntity {
  name: string;
  category: string; // medication | lab_test | finding | symptom
  value: any;
  unit?: string;
  confidence: number;
  source: string;
  extraction_method?: string;
}

export interface DocumentTable {
  headers: string[];
  rows: string[][];
}

export interface OcrExtractionData {
  document_id: string;
  raw_text: string;
  ocr_engine: string;
  confidence: number;
  tables?: DocumentTable[];
  extracted_entities?: ExtractedEntity[];
  layout_blocks?: any[];
}

interface OcrResultPreviewProps {
  filename: string;
  extraction: OcrExtractionData;
  onRemove?: () => void;
}

export const OcrResultPreview: React.FC<OcrResultPreviewProps> = ({
  filename,
  extraction,
  onRemove,
}) => {
  const [showRawText, setShowRawText] = useState(false);

  // Group entities
  const medications = extraction.extracted_entities?.filter(
    (e) => e.category === 'medication'
  ) || [];

  const table = extraction.tables && extraction.tables.length > 0 ? extraction.tables[0] : null;

  // Detect any low or critical flags
  const abnormalLabCount = table?.rows.filter((r) => {
    const flag = (r[4] || '').toUpperCase();
    return flag === 'LOW' || flag === 'HIGH' || flag === 'CRITICAL';
  }).length || 0;

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden text-left transition-all">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-sky-50 via-indigo-50 to-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <span>{filename}</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold">
                Digitized
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Cpu className="w-3.5 h-3.5 text-sky-600" />
              <span className="font-mono">{extraction.ocr_engine}</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">{Math.round(extraction.confidence * 100)}% Match</span>
            </div>
          </div>
        </div>

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 transition-all cursor-pointer"
          >
            Remove & Rescan
          </button>
        )}
      </div>

      <div className="p-5 space-y-6">
        {/* Abnormal Findings Alert */}
        {abnormalLabCount > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Diagnostic Attention Required
              </div>
              <div className="text-xs text-amber-800 mt-0.5 font-medium">
                {abnormalLabCount} parameter(s) outside standard biological reference ranges (flagged below). Clinician will review during consultation.
              </div>
            </div>
          </div>
        )}

        {/* 1. EXTRACTED MEDICATIONS (From Prescriptions) */}
        {medications.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Pill className="w-4 h-4 text-sky-600" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Extracted Prescription Medications ({medications.length})
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {medications.map((med, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-bold text-slate-900 text-sm">
                      {med.name}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-mono">
                      {med.unit || 'Rx'}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{String(med.value)}</span>
                  </div>

                  <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                    <span>Source: {med.extraction_method || 'TrOCR Engine'}</span>
                    <span className="text-emerald-700 font-semibold">{Math.round(med.confidence * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. EXTRACTED LAB REPORT TABLE */}
        {table && table.rows.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Laboratory Investigations & Reference Matrix
              </h4>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-600 border-b border-slate-200">
                    {table.headers.map((h, i) => (
                      <th key={i} className="p-3 font-bold uppercase tracking-wider text-[11px]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {table.rows.map((row, rIdx) => {
                    const flag = (row[4] || 'NORMAL').toUpperCase();
                    const isLow = flag === 'LOW';
                    const isHigh = flag === 'HIGH';
                    const isCritical = flag === 'CRITICAL';
                    const isAbnormal = isLow || isHigh || isCritical;

                    return (
                      <tr
                        key={rIdx}
                        className={`transition-colors ${
                          isAbnormal ? 'bg-amber-50/40 hover:bg-amber-50/70 font-semibold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-3 font-medium text-slate-900">{row[0]}</td>
                        <td className={`p-3 font-bold font-mono ${isAbnormal ? 'text-rose-900' : 'text-slate-800'}`}>
                          {row[1]}
                        </td>
                        <td className="p-3 text-slate-500 font-mono">{row[2]}</td>
                        <td className="p-3 text-slate-600">{row[3]}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                              isCritical
                                ? 'bg-rose-600 text-white'
                                : isLow
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : isHigh
                                ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
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

        {/* 3. RAW OCR TRANSCRIPT COLLAPSIBLE */}
        <div className="border-t border-slate-200/80 pt-3">
          <button
            type="button"
            onClick={() => setShowRawText(!showRawText)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900 py-1 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              {showRawText ? 'Hide Raw OCR Text Transcript' : 'View Raw OCR Text Transcript'}
            </span>
            {showRawText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showRawText && (
            <pre className="mt-3 p-4 bg-slate-900 text-slate-200 rounded-2xl text-[11px] font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto border border-slate-800">
              {extraction.raw_text}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
