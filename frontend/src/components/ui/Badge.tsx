import React from 'react';
import { 
  Mic, 
  Hand, 
  FileText, 
  Sparkles, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Edit3,
  MousePointer
} from 'lucide-react';

export type ProvenanceType = 
  | 'patient_voice' 
  | 'patient_touch' 
  | 'patient_text' 
  | 'sign_language' 
  | 'ocr' 
  | 'previous_record' 
  | 'ai_generated' 
  | 'doctor';

export type VerificationStatusType = 
  | 'PENDING' 
  | 'PATIENT_CONFIRMED' 
  | 'VERIFIED' 
  | 'AMENDED' 
  | 'REJECTED';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'slate';
  provenance?: ProvenanceType;
  verification?: VerificationStatusType;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  provenance,
  verification,
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-[11px] gap-1' : 'px-2.5 py-1 text-xs gap-1.5';

  if (provenance) {
    const provenanceConfig: Record<ProvenanceType, { label: string; icon: React.ReactNode; style: string }> = {
      patient_voice: {
        label: 'Voice Input',
        icon: <Mic className="w-3 h-3 text-sky-600" />,
        style: 'bg-sky-50 text-sky-700 border-sky-200',
      },
      patient_touch: {
        label: 'Touch Input',
        icon: <MousePointer className="w-3 h-3 text-indigo-600" />,
        style: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      },
      patient_text: {
        label: 'Patient Text',
        icon: <Edit3 className="w-3 h-3 text-blue-600" />,
        style: 'bg-blue-50 text-blue-700 border-blue-200',
      },
      sign_language: {
        label: 'ISL Sign',
        icon: <Hand className="w-3 h-3 text-teal-600" />,
        style: 'bg-teal-50 text-teal-700 border-teal-200',
      },
      ocr: {
        label: 'Document OCR',
        icon: <FileText className="w-3 h-3 text-amber-600" />,
        style: 'bg-amber-50 text-amber-800 border-amber-200',
      },
      previous_record: {
        label: 'Previous Record',
        icon: <FileText className="w-3 h-3 text-purple-600" />,
        style: 'bg-purple-50 text-purple-700 border-purple-200',
      },
      ai_generated: {
        label: 'AI Draft',
        icon: <Sparkles className="w-3 h-3 text-violet-600" />,
        style: 'bg-violet-50 text-violet-700 border-violet-200',
      },
      doctor: {
        label: 'Doctor Verified',
        icon: <UserCheck className="w-3 h-3 text-emerald-600" />,
        style: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      },
    };

    const cfg = provenanceConfig[provenance];
    return (
      <span
        className={`inline-flex items-center font-medium rounded-md border ${cfg.style} ${sizeStyles} ${className}`}
        {...props}
      >
        {cfg.icon}
        <span>{children || cfg.label}</span>
      </span>
    );
  }

  if (verification) {
    const verifConfig: Record<VerificationStatusType, { label: string; icon: React.ReactNode; style: string }> = {
      PENDING: {
        label: 'Pending Review',
        icon: <AlertCircle className="w-3 h-3 text-amber-600" />,
        style: 'bg-amber-50 text-amber-800 border-amber-200',
      },
      PATIENT_CONFIRMED: {
        label: 'Patient Confirmed',
        icon: <CheckCircle2 className="w-3 h-3 text-sky-600" />,
        style: 'bg-sky-50 text-sky-700 border-sky-200',
      },
      VERIFIED: {
        label: 'Doctor Verified',
        icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
        style: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      },
      AMENDED: {
        label: 'Amended by Doctor',
        icon: <Edit3 className="w-3 h-3 text-indigo-600" />,
        style: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      },
      REJECTED: {
        label: 'Rejected',
        icon: <XCircle className="w-3 h-3 text-rose-600" />,
        style: 'bg-rose-50 text-rose-700 border-rose-200',
      },
    };

    const cfg = verifConfig[verification];
    return (
      <span
        className={`inline-flex items-center font-semibold rounded-md border ${cfg.style} ${sizeStyles} ${className}`}
        {...props}
      >
        {cfg.icon}
        <span>{children || cfg.label}</span>
      </span>
    );
  }

  const variants = {
    primary: 'bg-sky-50 text-sky-700 border-sky-200',
    secondary: 'bg-teal-50 text-teal-700 border-teal-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${variants[variant]} ${sizeStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
