import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'kiosk';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer';

  const variants = {
    primary: 'bg-sky-500 hover:bg-sky-600 text-white shadow-xs hover:shadow-sm border border-sky-600/20',
    secondary: 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs hover:shadow-sm border border-teal-700/20',
    outline: 'bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 hover:border-slate-300 shadow-xs',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white shadow-xs hover:shadow-sm border border-rose-600/20',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-sm border border-emerald-700/20',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs min-h-[36px] gap-1.5',
    md: 'px-4 py-2.5 text-sm min-h-[44px] gap-2',
    lg: 'px-6 py-3.5 text-base min-h-[52px] gap-2.5',
    // Kiosk touch-target sizing for accessibility (elderly, low-dexterity)
    kiosk: 'px-8 py-5 text-lg min-h-[68px] min-w-[140px] rounded-2xl gap-3 shadow-sm',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
