import React from 'react';

function TextField({ className = '', ...props }) {
  const base =
    'w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 ' +
    'placeholder:text-slate-500 shadow-inner shadow-slate-950/40 ' +
    'focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500 ' +
    'transition-colors duration-150 ease-out hover:border-slate-500';

  const combined = [base, className].filter(Boolean).join(' ');

  return <input className={combined} {...props} />;
}

export default TextField;
