import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { FinanceIcon } from './Icons';

export const Card = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => <section className={cn('glass-panel rounded-xl p-5 sm:p-6', className)}>{children}</section>;

export const SectionHeader = ({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) => (
  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <h2 className="section-title">{title}</h2>
      {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
    </div>
    {action}
  </div>
);

export const InfoTooltip = ({
  label = 'Info',
  children,
}: {
  label?: string;
  children: ReactNode;
}) => (
  <span className="group relative inline-flex">
    <button
      className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-slate-300 transition hover:border-forge-cyan/50 hover:text-forge-cyan light:border-slate-200 light:bg-white light:text-slate-600"
      type="button"
      aria-label={label}
    >
      <FinanceIcon name="info" size={14} />
    </button>
    <span className="pointer-events-none absolute right-0 top-9 z-50 w-72 rounded-lg border border-white/10 bg-slate-950/95 p-3 text-left text-xs leading-5 text-slate-200 opacity-0 shadow-glow backdrop-blur transition group-hover:opacity-100 group-focus-within:opacity-100 light:border-slate-200 light:bg-white light:text-slate-700">
      {children}
    </span>
  </span>
);

export const StatCard = ({
  label,
  value,
  icon,
  tone = 'cyan',
  detail,
}: {
  label: string;
  value: string;
  icon: string;
  tone?: 'cyan' | 'mint' | 'violet' | 'amber' | 'rose';
  detail?: string;
}) => {
  const toneClasses = {
    cyan: 'from-cyan-400/25 to-sky-500/5 text-cyan-200',
    mint: 'from-emerald-400/25 to-teal-500/5 text-emerald-200',
    violet: 'from-violet-400/25 to-fuchsia-500/5 text-violet-200',
    amber: 'from-amber-400/25 to-orange-500/5 text-amber-200',
    rose: 'from-rose-400/25 to-red-500/5 text-rose-200',
  }[tone];

  return (
    <div className="metric-card overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</p>
          <p className="mt-2 break-words text-2xl font-bold text-slate-50 light:text-slate-950">{value}</p>
        </div>
        <div className={cn('rounded-xl bg-gradient-to-br p-2.5', toneClasses)}>
          <FinanceIcon name={icon} size={20} />
        </div>
      </div>
      {detail ? <p className="mt-3 text-sm text-slate-400">{detail}</p> : null}
    </div>
  );
};

export const ProgressBar = ({
  value,
  max = 100,
  className,
}: {
  value: number;
  max?: number;
  className?: string;
}) => {
  const rawPercent = max > 0 ? (value / max) * 100 : 0;
  const percent = Math.min(100, Math.max(0, rawPercent));
  const color =
    rawPercent > 100
      ? 'bg-rose-400'
      : rawPercent > 90
        ? 'bg-rose-400'
        : rawPercent > 70
          ? 'bg-amber-300'
          : 'bg-gradient-to-r from-forge-cyan to-forge-mint';
  return (
    <div className={cn('h-2 overflow-hidden rounded-full bg-slate-800 light:bg-slate-200', className)}>
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${percent}%` }} />
    </div>
  );
};

export const EmptyState = ({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: ReactNode;
}) => (
  <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.03] p-6 text-center light:border-slate-300 light:bg-slate-50">
    <FinanceIcon name={icon} className="mx-auto text-slate-400" size={28} />
    <h3 className="mt-3 text-base font-semibold text-slate-100 light:text-slate-900">{title}</h3>
    <p className="mx-auto mt-1 max-w-xl text-sm text-slate-400">{children}</p>
  </div>
);

export const ConfirmDialog = ({
  open,
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur">
      <div className="glass-panel w-full max-w-md rounded-xl p-5">
        <h3 className="text-lg font-bold text-slate-50 light:text-slate-950">{title}</h3>
        <p className="mt-2 text-sm text-slate-300 light:text-slate-600">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn" type="button" onClick={onCancel}>
            Abbrechen
          </button>
          <button className="btn btn-danger" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
