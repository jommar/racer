import React, { useState, useEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { X } from 'lucide-react';

/**
 * Utility for merging tailwind classes safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- BUTTON ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  children, 
  disabled,
  ...props 
}) => {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(225,29,72,0.3)] italic font-black uppercase tracking-tighter',
    secondary: 'bg-secondary/80 text-white hover:bg-secondary border border-white/10 font-bold',
    outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary/10 font-black uppercase tracking-tighter',
    ghost: 'bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-bold',
    danger: 'bg-red-600/20 text-red-500 border border-red-500/30 hover:bg-red-600/30 font-bold',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base',
    xl: 'px-10 py-4 text-lg',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  );
};

// --- CARD ---
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, glass = true, hover = true, children, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/5 overflow-hidden',
        glass ? 'bg-secondary/60 backdrop-blur-xl' : 'bg-secondary',
        hover ? 'hover:border-primary/20 hover:bg-secondary/80 transition-all duration-300' : '',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// --- INPUT ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className, ...props }) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">
            {icon}
          </div>
        )}
        <input
          className={cn(
            'w-full bg-black/40 border border-white/5 rounded-lg py-3 outline-none transition-all text-sm font-medium focus:border-primary/50 focus:ring-1 focus:ring-primary/10',
            icon ? 'pl-11 pr-4' : 'px-4',
            error ? 'border-red-500/50' : '',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-[10px] font-bold text-red-500 ml-1 italic">{error}</p>}
    </div>
  );
};

// --- BADGE ---
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'info' | 'gray';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'gray' }) => {
  const variants = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-green-500/10 text-green-500 border-green-500/20',
    warning: 'bg-accent/10 text-accent border-accent/20',
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    gray: 'bg-white/5 text-gray-400 border-white/10',
  };

  return (
    <span className={cn('px-2 py-0.5 rounded text-[10px] font-black uppercase border', variants[variant])}>
      {children}
    </span>
  );
};

// --- MODAL ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative w-full max-w-lg z-10 shadow-3xl border-primary/20 animate-in fade-in zoom-in duration-200" glass>
        <div className="flex justify-between items-center p-6 border-b border-white/5">
          <h2 className="text-xl font-black uppercase italic tracking-tighter">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500 hover:text-white" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </Card>
    </div>
  );
};

// --- STATS PROGRESS ---
interface StatsProgressProps {
  label: string;
  value: number;
  max?: number;
  potential?: number; // Show predicted improvement
}

export const StatsProgress: React.FC<StatsProgressProps> = ({ label, value, max = 100, potential = 0 }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const potentialPercentage = Math.min(((value + potential) / max) * 100, 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{label}</span>
        <span className="text-xs font-bold italic">
          {value}
          {potential > 0 && <span className="text-primary ml-1">+{potential}</span>}
        </span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
        {/* Base Bar */}
        <div 
          className="h-full bg-primary/40 absolute top-0 left-0 transition-all duration-500"
          style={{ width: `${potentialPercentage}%` }}
        />
        <div 
          className="h-full bg-primary absolute top-0 left-0 transition-all duration-500 shadow-[0_0_8px_rgba(225,29,72,0.8)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// --- TABS ---
interface TabOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  options: TabOption[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ options, activeTab, onTabChange }) => {
  return (
    <div className="flex border-b border-white/5 bg-secondary/20 p-1 rounded-xl">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onTabChange(option.id)}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest rounded-lg transition-all',
            activeTab === option.id 
              ? 'bg-primary text-white shadow-lg' 
              : 'text-gray-500 hover:text-white hover:bg-white/5'
          )}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
};

// --- SKELETON ---
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse bg-white/5 rounded-lg', className)} />
);
