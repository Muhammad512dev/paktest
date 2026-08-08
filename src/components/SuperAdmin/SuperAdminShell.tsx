import React, { ReactNode } from 'react';
import { Shield } from 'lucide-react';

interface SuperAdminShellProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

const SuperAdminShell: React.FC<SuperAdminShellProps> = ({ title, subtitle, icon, actions, children }) => {
  return (
    <div className="min-h-screen bg-[#080c14] text-white">
      {/* Page Header */}
      <div className="sticky top-0 z-20 bg-[#080c14]/80 backdrop-blur-xl border-b border-white/5 px-8 py-5">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              {icon ?? <Shield size={18} />}
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight leading-none">{title}</h1>
              {subtitle && <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-2xl mx-auto px-8 py-8">
        {children}
      </div>
    </div>
  );
};

export interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  up?: boolean;
  icon: ReactNode;
  accent: string;
}

export const SAStatCard: React.FC<StatCardProps> = ({ label, value, change, up = true, icon, accent }) => {
  const borderMap: Record<string, string> = {
    indigo: 'border-l-indigo-500',
    emerald: 'border-l-emerald-500',
    amber: 'border-l-amber-500',
    rose: 'border-l-rose-500',
    purple: 'border-l-purple-500',
    sky: 'border-l-sky-500',
  };
  const iconBgMap: Record<string, string> = {
    indigo: 'bg-indigo-500/15 text-indigo-400',
    emerald: 'bg-emerald-500/15 text-emerald-400',
    amber: 'bg-amber-500/15 text-amber-400',
    rose: 'bg-rose-500/15 text-rose-400',
    purple: 'bg-purple-500/15 text-purple-400',
    sky: 'bg-sky-500/15 text-sky-400',
  };

  return (
    <div className={`bg-[#0f1623] rounded-2xl border border-white/5 border-l-4 ${borderMap[accent] || borderMap.indigo} p-6 group hover:-translate-y-0.5 transition-all duration-200`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBgMap[accent] || iconBgMap.indigo}`}>
          {icon}
        </div>
        {change && (
          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${up ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {up ? '↑' : '↓'} {change}
          </span>
        )}
      </div>
      <p className="text-3xl font-black text-white tracking-tight">{value}</p>
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1.5">{label}</p>
    </div>
  );
};

export const SACard: React.FC<{ children: ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-[#0f1623] rounded-2xl border border-white/5 ${className}`}>
    {children}
  </div>
);

export const SABadge: React.FC<{ label: string; variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple' }> = ({ label, variant = 'neutral' }) => {
  const map: Record<string, string> = {
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
    info: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
    neutral: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${map[variant]}`}>
      {label}
    </span>
  );
};

export const SAPrimaryBtn: React.FC<{ onClick?: () => void; children: ReactNode; className?: string; type?: 'button' | 'submit' }> = ({ onClick, children, className = '', type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    className={`px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 ${className}`}
  >
    {children}
  </button>
);

export const SAGhostBtn: React.FC<{ onClick?: () => void; children: ReactNode; className?: string }> = ({ onClick, children, className = '' }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/8 text-slate-300 hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 ${className}`}
  >
    {children}
  </button>
);

export const SAInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</label>}
    <input
      {...props}
      className={`w-full px-4 py-3 bg-[#080c14] border border-white/8 rounded-xl text-sm text-white placeholder-slate-600 font-medium focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all ${className}`}
    />
  </div>
);

export const SASelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ label, className = '', children, ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</label>}
    <select
      {...props}
      className={`w-full px-4 py-3 bg-[#080c14] border border-white/8 rounded-xl text-sm text-white font-medium focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all appearance-none ${className}`}
      style={{ colorScheme: 'dark' }}
    >
      {children}
    </select>
  </div>
);

export const SATextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</label>}
    <textarea
      {...props}
      className={`w-full px-4 py-3 bg-[#080c14] border border-white/8 rounded-xl text-sm text-white placeholder-slate-600 font-medium focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none ${className}`}
    />
  </div>
);

export const SAModal: React.FC<{ open: boolean; onClose: () => void; children: ReactNode; title: string; subtitle?: string; footer?: ReactNode }> = ({ open, onClose, children, title, subtitle, footer }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xl flex items-center justify-center p-6">
      <div className="bg-[#0f1623] border border-white/8 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5">
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">{title}</h3>
            {subtitle && <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 flex items-center justify-center transition-all text-2xl font-bold leading-none">×</button>
        </div>
        <div className="p-8 space-y-5 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && <div className="px-8 py-6 border-t border-white/5 flex gap-3">{footer}</div>}
      </div>
    </div>
  );
};

export const SASearchBar: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string }> = ({ value, onChange, placeholder }) => (
  <div className="relative">
    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 16.65z" />
    </svg>
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder ?? 'Search...'}
      className="pl-10 pr-4 py-2.5 bg-[#0f1623] border border-white/8 rounded-xl text-sm text-white placeholder-slate-600 font-medium focus:outline-none focus:border-indigo-500/50 transition-all w-72"
    />
  </div>
);

export default SuperAdminShell;
