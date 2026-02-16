import React from 'react';

function Card({ className = '', children, ...props }) {
  const base =
    'relative z-0 overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-900/80 ' +
    'backdrop-blur-sm p-4 sm:p-5 shadow-xl shadow-slate-950/60 ' +
    'before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-br ' +
    'before:from-slate-50/5 before:via-slate-50/0 before:to-emerald-500/8';
  const combined = [base, className].filter(Boolean).join(' ');
  return (
    <div className={combined} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }) {
  const base = 'mb-4 flex items-start justify-between gap-3';
  const combined = [base, className].filter(Boolean).join(' ');
  return (
    <div className={combined} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...props }) {
  const base = 'text-lg font-semibold';
  const combined = [base, className].filter(Boolean).join(' ');
  return (
    <h2 className={combined} {...props}>
      {children}
    </h2>
  );
}

export function CardSubtitle({ className = '', children, ...props }) {
  const base = 'text-xs text-slate-400 mt-1';
  const combined = [base, className].filter(Boolean).join(' ');
  return (
    <p className={combined} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className = '', children, ...props }) {
  const base = '';
  const combined = [base, className].filter(Boolean).join(' ');
  return (
    <div className={combined} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }) {
  const base = 'mt-4 flex items-center justify-between gap-2';
  const combined = [base, className].filter(Boolean).join(' ');
  return (
    <div className={combined} {...props}>
      {children}
    </div>
  );
}

export default Card;
