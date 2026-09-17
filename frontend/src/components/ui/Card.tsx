import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'interactive' | 'kiosk';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'kiosk';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'bg-white rounded-2xl border transition-all';

  const variants = {
    default: 'border-slate-200 shadow-xs',
    flat: 'border-slate-100 shadow-none bg-slate-50/50',
    interactive: 'border-slate-200 shadow-xs hover:shadow-md hover:border-sky-300 cursor-pointer active:scale-[0.99]',
    kiosk: 'border-2 border-slate-200 rounded-3xl shadow-sm hover:border-sky-400',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
    kiosk: 'p-6 sm:p-10',
  };

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
