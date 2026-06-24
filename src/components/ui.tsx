import type { ReactNode } from 'react';

const BADGE_STYLES: Record<string, string> = {
  'badge-purple': 'bg-[rgba(124,58,237,0.2)] text-[var(--purple-neon)] border-[rgba(124,58,237,0.4)]',
  'badge-green': 'bg-[rgba(0,255,136,0.1)] text-[var(--green-ok)] border-[rgba(0,255,136,0.3)]',
  'badge-red': 'bg-[rgba(255,51,102,0.1)] text-[var(--red-alert)] border-[rgba(255,51,102,0.3)]',
  'badge-cyan': 'bg-[rgba(0,212,255,0.1)] text-[var(--cyan-accent)] border-[rgba(0,212,255,0.3)]',
  'badge-yellow': 'bg-[rgba(255,204,0,0.1)] text-[var(--yellow-warn)] border-[rgba(255,204,0,0.3)]',
  'badge-gray': 'bg-[rgba(139,125,181,0.1)] text-[var(--text-secondary)] border-[rgba(139,125,181,0.3)]',
};

export function Badge({ kind, children }: { kind: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wide uppercase border ${BADGE_STYLES[kind] || BADGE_STYLES['badge-gray']}`}>
      {children}
    </span>
  );
}

type BtnVariant = 'primary' | 'secondary' | 'danger';
const BTN_STYLES: Record<BtnVariant, string> = {
  primary: 'text-white bg-gradient-to-br from-[var(--purple-mid)] to-[var(--purple-bright)] hover:opacity-85',
  secondary: 'bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--purple-mid)] hover:text-[var(--purple-neon)]',
  danger: 'bg-[rgba(255,51,102,0.15)] text-[var(--red-alert)] border border-[rgba(255,51,102,0.3)] hover:bg-[rgba(255,51,102,0.25)]',
};

export function Button({
  variant = 'primary', size = 'md', children, className = '', ...props
}: {
  variant?: BtnVariant; size?: 'md' | 'sm' | 'xs'; children: ReactNode; className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizes = { md: 'px-3.5 py-2 text-xs', sm: 'px-2.5 py-1.5 text-[11px]', xs: 'px-1.5 py-1 text-[10px]' };
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-md font-semibold cursor-pointer transition-all whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${BTN_STYLES[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = '', noPad = false }: { children: ReactNode; className?: string; noPad?: boolean }) {
  return (
    <div className={`bg-[var(--bg-card)] border border-[var(--border)] rounded-[10px] ${noPad ? '' : 'p-5'} mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, children }: { title: ReactNode; children?: ReactNode | false }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="text-[13px] font-bold text-[var(--purple-glow)] uppercase tracking-wide font-mono flex items-center gap-2">{title}</div>
      {children}
    </div>
  );
}

export function Modal({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[500] p-4 max-md:items-end max-md:p-0"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[var(--bg-panel)] border border-[var(--border-glow)] rounded-[10px] w-full max-w-[640px] max-h-[90vh] overflow-y-auto shadow-[0_0_20px_rgba(168,85,247,0.3)] max-md:max-w-full max-md:rounded-t-[10px] max-md:rounded-b-none">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="text-sm font-bold text-[var(--purple-glow)] font-mono">{title}</div>
          <button className="text-[var(--text-muted)] hover:text-[var(--purple-neon)] text-base p-1" onClick={onClose}>✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, span2, children }: { label: string; span2?: boolean; children: ReactNode }) {
  return (
    <div className={`flex flex-col gap-1.5 ${span2 ? 'sm:col-span-2' : ''}`}>
      <label className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-mono">{label}</label>
      {children}
    </div>
  );
}

const INPUT_CLS = 'px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-md text-[var(--text-primary)] text-[13px] outline-none transition-all focus:border-[var(--purple-bright)] focus:shadow-[0_0_10px_rgba(124,58,237,0.2)]';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${INPUT_CLS} ${props.className || ''}`} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${INPUT_CLS} resize-y min-h-[80px] ${props.className || ''}`} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${INPUT_CLS} ${props.className || ''}`} />;
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">{children}</div>;
}

export function FormActions({ children }: { children: ReactNode }) {
  return <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-[var(--border)]">{children}</div>;
}

export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="text-center py-12 px-5 text-[var(--text-muted)]">
      <div className="text-[40px] mb-3 opacity-50">{icon}</div>
      <p className="text-[13px]">{text}</p>
    </div>
  );
}

export function SectionHeader({ title, count, children }: { title: string; count?: number; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4 flex-wrap gap-2.5">
      <div className="text-lg font-extrabold text-[var(--text-primary)]">
        {title}
        {count !== undefined && <span className="text-[11px] text-[var(--purple-neon)] font-mono font-normal ml-2">#{count}</span>}
      </div>
      <div className="flex items-center gap-2 flex-wrap">{children}</div>
    </div>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto"><table className="w-full border-collapse">{children}</table></div>;
}

export function Th({ children }: { children?: ReactNode }) {
  return <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-mono border-b border-[var(--border)] whitespace-nowrap">{children}</th>;
}
