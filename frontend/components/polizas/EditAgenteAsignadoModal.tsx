'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { AgenteAsignadoEditor } from './AgenteAsignadoEditor';

interface EditAgenteAsignadoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  polizaId: number;
  agente?: number | null;
  agenteNombre?: string;
  onUpdated?: () => void;
}

export function EditAgenteAsignadoModal({
  open,
  onOpenChange,
  polizaId,
  agente,
  agenteNombre,
  onUpdated,
}: EditAgenteAsignadoModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/50 z-[200]"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-agente-asignado-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 id="edit-agente-asignado-title" className="text-lg font-semibold text-slate-900 dark:text-white">
                Editar agente asignado
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Seleccione el agente responsable de esta póliza. Los cambios se aplican al guardar.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <AgenteAsignadoEditor
            polizaId={polizaId}
            agente={agente}
            agenteNombre={agenteNombre}
            onUpdated={onUpdated}
            onSaved={() => onOpenChange(false)}
          />
        </div>
      </div>
    </>,
    document.body,
  );
}
