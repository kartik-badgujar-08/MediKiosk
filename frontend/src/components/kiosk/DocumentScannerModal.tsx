import React, { useState, useRef } from 'react';
import { Upload, FileText, Sparkles, AlertCircle, ScanLine } from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import type { OcrExtractionData } from './OcrResultPreview';

interface DocumentScannerProps {
  encounterId: string;
  onExtractionComplete: (doc: any, extraction: OcrExtractionData) => void;
}

export const DocumentScannerModal: React.FC<DocumentScannerProps> = ({
  encounterId,
  onExtractionComplete,
}) => {
  const { language, speak } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStageText, setScanStageText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick Samples list
  const samplePresets = [
    {
      id: 'sample_rx',
      title: "Doctor's Handwritten Prescription",
      subtitle: 'Dr. Anita Desai • Paracetamol 650mg TDS, Pantoprazole 40mg, Azithromycin, ORS',
      type: 'Prescription (TrOCR)',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
    },
    {
      id: 'sample_cbc',
      title: 'Complete Blood Count (CBC) Panel',
      subtitle: 'Metropolis Labs • Platelets 92,000 [LOW], Hb 11.2 [LOW], WBC 7,400',
      type: 'Haematology Lab',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      id: 'sample_diabetic',
      title: 'Diabetic & Lipid Profile Report',
      subtitle: 'Apollo Labs • Fasting Glucose 186 [HIGH], HbA1c 8.4% [HIGH], Cholesterol 224',
      type: 'Endocrinology Lab',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
  ];

  // Run visual scanning simulation
  const simulateScanStages = async (isLab: boolean) => {
    setIsScanning(true);
    setErrorMsg(null);

    // Audio narration
    const startMsg = language === 'hi'
      ? 'दस्तावेज़ की स्कैनिंग और डिजिटलीकरण शुरू हो रहा है'
      : language === 'mr'
      ? 'दस्तऐवजाचे स्कॅनिंग सुरू होत आहे'
      : 'Scanning and digitizing medical document';
    speak(startMsg);

    setScanStageText('Preprocessing document & enhancing image contrast...');
    setScanProgress(25);
    await new Promise((r) => setTimeout(r, 600));

    setScanStageText(isLab ? 'Analyzing multi-column tabular lab structure...' : 'Running Microsoft TrOCR handwritten prescription recognition...');
    setScanProgress(60);
    await new Promise((r) => setTimeout(r, 700));

    setScanStageText('Normalizing clinical dosages, reference ranges, & flags...');
    setScanProgress(90);
    await new Promise((r) => setTimeout(r, 500));
  };

  // Handle Real File Upload
  const handleFileUpload = async (file: File) => {
    try {
      const isLab = anyLabTerm(file.name);
      await simulateScanStages(isLab);

      // Upload to real backend
      const doc = await api.uploadDocument(encounterId, file);

      // Process via real OCR backend
      const extraction = await api.processDocument(doc.id);

      setScanProgress(100);
      setScanStageText('Digitization Complete!');

      // Loud announcement of completion
      const medCount = extraction.extracted_entities?.filter((e: any) => e.category === 'medication').length || 0;
      const labCount = extraction.tables?.[0]?.rows?.length || 0;

      let announce = '';
      if (medCount > 0) {
        announce = language === 'hi'
          ? `पर्ची का डिजिटलीकरण पूरा हुआ। ${medCount} दवाइयां पाई गईं।`
          : language === 'mr'
          ? `प्रिस्क्रिप्शन स्कॅनिंग पूर्ण झाले. ${medCount} औषधे आढळली.`
          : `Prescription scanned successfully. ${medCount} medications detected.`;
      } else {
        announce = language === 'hi'
          ? `जांच रिपोर्ट का डिजिटलीकरण पूरा हुआ। ${labCount} पैरामीटर पाए गए।`
          : language === 'mr'
          ? `तपासणी अहवाल स्कॅनिंग पूर्ण झाले. ${labCount} चाचण्या आढळल्या.`
          : `Laboratory report scanned. ${labCount} diagnostic investigations extracted.`;
      }
      speak(announce);

      onExtractionComplete(doc, extraction);
    } catch (err: any) {
      console.error('OCR Processing error:', err);
      setErrorMsg(err.message || 'Failed to scan document. Please try again or choose a sample.');
    } finally {
      setIsScanning(false);
    }
  };

  // Handle Sample 1-click Preset
  const handleSelectSample = async (sampleId: string) => {
    try {
      const isLab = sampleId.includes('cbc') || sampleId.includes('diabetic');
      await simulateScanStages(isLab);

      const res = await api.attachSampleDocument(encounterId, sampleId);
      const { document: doc, extraction } = res;

      setScanProgress(100);
      setScanStageText('Digitization Complete!');

      const medCount = extraction.extracted_entities?.filter((e: any) => e.category === 'medication').length || 0;
      const labCount = extraction.tables?.[0]?.rows?.length || 0;

      let announce = '';
      if (medCount > 0) {
        announce = language === 'hi'
          ? `पर्ची का डिजिटलीकरण पूरा हुआ। ${medCount} दवाइयां पाई गईं।`
          : language === 'mr'
          ? `प्रिस्क्रिप्शन स्कॅनिंग पूर्ण झाले. ${medCount} औषधे आढळली.`
          : `Prescription scanned. ${medCount} medications detected.`;
      } else {
        announce = language === 'hi'
          ? `जांच रिपोर्ट का डिजिटलीकरण पूरा हुआ। ${labCount} पैरामीटर पाए गए।`
          : language === 'mr'
          ? `तपासणी अहवाल स्कॅनिंग पूर्ण झाले. ${labCount} चाचण्या आढळल्या.`
          : `Lab report scanned. ${labCount} investigations extracted.`;
      }
      speak(announce);

      onExtractionComplete(doc, extraction);
    } catch (err: any) {
      console.error('Sample attach error:', err);
      setErrorMsg(err.message || 'Failed to attach sample report.');
    } finally {
      setIsScanning(false);
    }
  };

  const anyLabTerm = (name: string) => {
    const l = name.toLowerCase();
    return l.includes('cbc') || l.includes('lab') || l.includes('blood') || l.includes('report') || l.includes('test');
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
      />

      {/* SCANNING IN PROGRESS ANIMATION */}
      {isScanning ? (
        <div className="p-8 sm:p-10 rounded-3xl border-3 border-sky-400 bg-gradient-to-b from-sky-50 to-indigo-50 text-center shadow-lg relative overflow-hidden">
          {/* Visual Scanner Beam */}
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent animate-pulse" />

          <div className="w-16 h-16 rounded-2xl bg-white shadow-md text-sky-600 flex items-center justify-center mx-auto mb-4 border border-sky-200">
            <ScanLine className="w-8 h-8 animate-bounce text-sky-600" />
          </div>

          <h3 className="text-xl font-black text-slate-900 mb-1">
            Digitizing Medical Document...
          </h3>
          <p className="text-xs text-sky-900 font-medium mb-5">
            {scanStageText}
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-sky-200/80 rounded-full h-3 max-w-md mx-auto overflow-hidden">
            <div
              className="bg-sky-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${scanProgress}%` }}
            />
          </div>

          <div className="text-[11px] font-mono text-slate-500 mt-2 font-semibold">
            {scanProgress}% Completed
          </div>
        </div>
      ) : (
        <>
          {/* DRAG & DROP UPLOAD ZONE */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className="border-3 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/60 hover:bg-sky-50 rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 group shadow-xs hover:shadow-md"
          >
            <div className="w-16 h-16 rounded-2xl bg-sky-100 text-sky-600 group-hover:scale-105 group-hover:bg-sky-600 group-hover:text-white flex items-center justify-center mx-auto mb-4 transition-all duration-200 shadow-xs">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-900 mb-1 group-hover:text-sky-950">
              Tap to Scan or Choose Document
            </h3>
            <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
              Upload prescription photo, lab investigation PDF, or discharge summary. Supports PNG, JPG, JPEG, and PDF up to 15MB.
            </p>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs group-hover:border-sky-400 group-hover:text-sky-700">
              <FileText className="w-4 h-4 text-sky-600" />
              Browse Files on Device
            </span>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1-CLICK INSTANT PRESET SAMPLES */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Or Test With Instant Medical Samples</span>
              </div>
              <span className="text-[11px] text-slate-400">1-Tap Live OCR Demo</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {samplePresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectSample(preset.id)}
                  className="p-4 rounded-2xl border-2 border-slate-200 hover:border-sky-500 bg-white hover:bg-sky-50/60 text-left transition-all cursor-pointer flex items-center justify-between group shadow-2xs hover:shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 group-hover:text-sky-950">
                        {preset.title}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${preset.badgeColor}`}>
                        {preset.type}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 group-hover:text-slate-700 line-clamp-1">
                      {preset.subtitle}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-slate-200 group-hover:border-sky-500 group-hover:bg-sky-600 group-hover:text-white flex items-center justify-center text-slate-400 transition-all shrink-0 ml-3">
                    →
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
