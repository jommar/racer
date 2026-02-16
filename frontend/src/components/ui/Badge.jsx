import React from 'react';

const variantClasses = {
  neutral: 'border-slate-700 bg-slate-900/70 text-slate-200',
  success: 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300',
  danger: 'border-rose-500/60 bg-rose-500/10 text-rose-300',
  warning: 'border-amber-400/60 bg-amber-300/10 text-amber-300',
  info: 'border-sky-500/60 bg-sky-500/10 text-sky-300',
};

function Badge({ variant = 'neutral', className = '', children, ...props }) {
  const base =
    'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-widest';
  const variantClass = variantClasses[variant] || variantClasses.neutral;
  const combined = [base, variantClass, className].filter(Boolean).join(' ');

  return (
    <span className={combined} {...props}>
      {children}
    </span>
  );
}

export default Badge;
