export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';

export const ESTADO_DOCUMENTO_OPTIONS = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'EN_REVISION', label: 'En revisión' },
  { value: 'RECIBIDO', label: 'Recibido' },
  { value: 'APROBADO', label: 'Aprobado' },
  { value: 'RECHAZADO', label: 'Rechazado' },
] as const;

export const ESTADO_PAGO_OPTIONS = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'AL_DIA', label: 'Al día' },
  { value: 'VENCIDO', label: 'Vencido' },
] as const;

export function getStatusTone(label?: string | null): StatusTone {
  const value = (label || '').toLowerCase();

  if (
    value.includes('activ') ||
    value.includes('complet') ||
    value.includes('al d') ||
    value.includes('al_d') ||
    value.includes('recib') ||
    value.includes('aprobad') ||
    value.includes('firmado')
  ) {
    return 'success';
  }

  if (
    value.includes('pendien') ||
    value.includes('revision') ||
    value.includes('revis') ||
    value.includes('espera') ||
    value.includes('enviado') ||
    value.includes('verificaci')
  ) {
    return 'warning';
  }

  if (
    value.includes('cancel') ||
    value.includes('rechaz') ||
    value.includes('vencid') ||
    value.includes('robado') ||
    value.includes('inactiv')
  ) {
    return 'danger';
  }

  return 'neutral';
}

export function getStatusBadgeClass(label?: string | null): string {
  switch (getStatusTone(label)) {
    case 'success':
      return 'bg-[#d1fae5] text-[#10b981]';
    case 'warning':
      return 'bg-[#fef3c7] text-[#f59e0b]';
    case 'danger':
      return 'bg-[#fee2e2] text-[#ef4444]';
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  }
}

export function getEstadoDocumentoLabel(code?: string | null): string {
  return ESTADO_DOCUMENTO_OPTIONS.find((option) => option.value === code)?.label || 'Pendiente';
}

export function getEstadoPagoLabel(code?: string | null): string {
  return ESTADO_PAGO_OPTIONS.find((option) => option.value === code)?.label || 'Pendiente';
}

interface StatusBadgeProps {
  label: string;
  className?: string;
}

export function StatusBadge({ label, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`px-[8px] py-[2px] text-[11px] font-extrabold rounded-[5px] uppercase tracking-[0.5px] inline-flex items-center justify-center ${getStatusBadgeClass(label)} ${className}`}
    >
      {label}
    </span>
  );
}

interface RemovableEtiquetaBadgeProps {
  label: string;
  color?: string;
  onRemove?: () => void;
  removing?: boolean;
  className?: string;
}

export function RemovableEtiquetaBadge({
  label,
  color,
  onRemove,
  removing = false,
  className = '',
}: RemovableEtiquetaBadgeProps) {
  const baseClass =
    'px-[8px] py-[2px] text-[11px] font-extrabold rounded-[5px] uppercase tracking-[0.5px] inline-flex items-center gap-1';

  const toneClass = color ? '' : getStatusBadgeClass(label);

  return (
    <span
      className={`${baseClass} ${toneClass} ${className}`}
      style={
        color
          ? { backgroundColor: `${color}22`, color }
          : undefined
      }
    >
      {label}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={removing}
          className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-sm text-[10px] leading-none opacity-70 transition-opacity hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Eliminar etiqueta ${label}`}
        >
          ×
        </button>
      ) : null}
    </span>
  );
}
