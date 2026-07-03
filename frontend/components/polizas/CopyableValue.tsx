'use client';

import { copyToClipboard } from '@/lib/familyMemberUtils';
import { useToast } from '@/hooks/use-toast';

interface CopyableValueProps {
  value?: string | null;
  className?: string;
  fallback?: string;
  /** Solo muestra el icono de copiar sin repetir el texto */
  copyOnly?: boolean;
}

export function CopyableValue({ value, className, fallback = '-', copyOnly = false }: CopyableValueProps) {
  const { toast } = useToast();
  const display = value?.trim() ? value : fallback;
  const canCopy = Boolean(value?.trim()) && display !== fallback;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canCopy) return;
    const ok = await copyToClipboard(value!.trim());
    toast({
      title: ok ? 'Copiado al portapapeles' : 'No se pudo copiar',
      variant: ok ? 'default' : 'destructive',
    });
  };

  if (copyOnly) {
    if (!canCopy) return null;
    return (
      <button
        type="button"
        onClick={handleCopy}
        className={`text-slate-400 hover:text-primary shrink-0 ${className || ''}`}
        aria-label="Copiar"
      >
        <i className="fa-regular fa-copy text-xs" />
      </button>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 min-w-0 ${className || ''}`}>
      <span className="break-all">{display}</span>
      {canCopy ? (
        <button
          type="button"
          onClick={handleCopy}
          className="text-slate-400 hover:text-primary shrink-0"
          aria-label="Copiar"
        >
          <i className="fa-regular fa-copy text-xs" />
        </button>
      ) : null}
    </span>
  );
}
