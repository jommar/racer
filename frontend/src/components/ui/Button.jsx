import React from 'react';

const variantClasses = {
  primary:
    'border-sky-500/80 bg-gradient-to-r from-sky-500 to-emerald-400 text-white ' +
    'hover:from-sky-400 hover:to-emerald-300 shadow-sky-500/40',
  secondary:
    'border-slate-700/80 bg-slate-900/80 text-slate-100 hover:bg-slate-800/80 shadow-slate-900/40',
  outline:
    'border-slate-700/80 bg-transparent text-slate-200 hover:bg-slate-900/60 shadow-none',
  ghost:
    'border-transparent bg-transparent text-slate-300 hover:bg-slate-800/70 shadow-none',
  danger:
    'border-rose-500/80 bg-gradient-to-r from-rose-500 to-amber-400 text-white ' +
    'hover:from-rose-400 hover:to-amber-300 shadow-rose-500/40',
};

const sizeClasses = {
  sm: 'px-3 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
};

function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center font-medium rounded-xl border shadow-md ' +
    'transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-offset-0 ' +
    'focus:ring-sky-500/70 hover:-translate-y-px hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed';

  const variantClass = variantClasses[variant] || variantClasses.primary;
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const widthClass = fullWidth ? 'w-full' : '';

  const combined = [base, variantClass, sizeClass, widthClass, className]
    .filter(Boolean)
    .join(' ');

  return <button className={combined} {...props} />;
}

export default Button;
