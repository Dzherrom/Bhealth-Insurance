'use client';

import type { LucideIcon } from 'lucide-react';
import { getStatusBadgeClass } from '@/components/polizas/polizaStatusUtils';

export function InfoRow({
  icon: Icon,
  label,
  value,
  action,
}: {
  icon: LucideIcon;
  label: string;
  value?: string | null;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[#f8fafc]">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <Icon className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">{label}</p>
          <p className="text-sm font-medium text-[#0f172a] break-words">{value || '—'}</p>
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StatusPill({ label }: { label?: string | null }) {
  const safeLabel = label || 'Pendiente';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${getStatusBadgeClass(safeLabel)}`}
    >
      {safeLabel}
    </span>
  );
}

export function PaymentItemCard({
  title,
  maskedNumber,
  subtitle,
  footer,
  action,
}: {
  title: string;
  maskedNumber: string;
  subtitle?: string | null;
  footer?: string | null;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3 mb-2 last:mb-0 transition-all hover:bg-white hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#0f172a]">{title}</p>
          <p className="text-xs font-mono text-[#64748b] mt-0.5">{maskedNumber}</p>
          {subtitle ? <p className="text-xs text-[#64748b] mt-1">{subtitle}</p> : null}
          {footer ? <p className="text-xs text-[#64748b] mt-0.5">{footer}</p> : null}
        </div>
        {action}
      </div>
    </div>
  );
}
