'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { historialApi, type HistorialPoliza } from '@/lib/api';

interface RegistrosActividadModalProps {
  isOpen: boolean;
  onClose: () => void;
  polizaId: string;
  historialInicial?: HistorialPoliza[];
}

type RegistroTipo = 'create' | 'update' | 'complete' | 'assign' | 'transfer';

const mapAccionToTipo = (accion: string): RegistroTipo => {
  switch (accion) {
    case 'CREACION':
      return 'create';
    case 'TRANSFERENCIA':
      return 'transfer';
    case 'DOCUMENTO_SUBIDO':
    case 'NOTA_AGREGADA':
      return 'complete';
    default:
      return 'update';
  }
};

const getTipoColor = (tipo: RegistroTipo) => {
  switch (tipo) {
    case 'create':
      return 'bg-blue-500';
    case 'update':
      return 'bg-blue-500';
    case 'complete':
      return 'bg-green-500';
    case 'assign':
      return 'bg-purple-500';
    case 'transfer':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
};

const formatFecha = (fecha: string) => {
  const date = new Date(fecha);
  return {
    fecha: date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: '2-digit' }),
    hora: date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
  };
};

export function RegistrosActividadModal({
  isOpen,
  onClose,
  polizaId,
  historialInicial,
}: RegistrosActividadModalProps) {
  const [registros, setRegistros] = useState<HistorialPoliza[]>(historialInicial || []);
  const [loading, setLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isOpen || !polizaId) return;

    if (historialInicial && historialInicial.length > 0) {
      setRegistros(historialInicial);
      return;
    }

    let cancelled = false;
    setLoading(true);
    historialApi
      .listByPoliza(polizaId)
      .then((data) => {
        if (!cancelled) setRegistros(data);
      })
      .catch(() => {
        if (!cancelled) setRegistros([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, polizaId, historialInicial]);

  const toggleExpanded = (id: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[calc(100vw-2rem)] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="text-lg font-semibold">
            Registros de actividad de póliza
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Cargando historial...
          </div>
        ) : (
          <ScrollArea className="flex-1 min-h-0 max-h-[min(600px,calc(90vh-5rem))]">
            <div className="space-y-2 px-6 py-4">
              {registros.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-12">
                  No hay registros de actividad para esta póliza.
                </p>
              ) : (
                registros.map((registro) => {
                  const tipo = mapAccionToTipo(registro.accion);
                  const { fecha, hora } = formatFecha(registro.fecha);
                  const usuario = registro.usuario_username || 'Sistema';
                  const accionLabel = registro.accion_display || registro.accion;
                  const isExpanded = expandedItems.has(registro.id!);
                  const hasDetalles = Boolean(registro.detalles?.trim());

                  return (
                    <Collapsible
                      key={registro.id}
                      open={isExpanded}
                      onOpenChange={() => hasDetalles && toggleExpanded(registro.id!)}
                    >
                      <div className="border rounded-lg overflow-hidden w-full max-w-full">
                        <CollapsibleTrigger
                          className="w-full text-left disabled:cursor-default"
                          disabled={!hasDetalles}
                        >
                          <div className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors w-full max-w-full overflow-hidden">
                            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${getTipoColor(tipo)}`} />
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium text-blue-600 break-words min-w-0">
                                  {usuario}
                                </p>
                                <div className="flex items-center gap-1 shrink-0 text-xs text-gray-500 whitespace-nowrap">
                                  <span>{fecha} {hora}</span>
                                  {hasDetalles ? (
                                    isExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-gray-400" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-gray-400" />
                                    )
                                  ) : null}
                                </div>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-200 mt-0.5 break-words">
                                {accionLabel}
                              </p>
                              {hasDetalles && !isExpanded ? (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 break-words">
                                  {registro.detalles}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        {hasDetalles ? (
                          <CollapsibleContent className="border-t bg-gray-50 dark:bg-slate-900/40">
                            <div className="p-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words overflow-hidden">
                              {registro.detalles}
                            </div>
                          </CollapsibleContent>
                        ) : null}
                      </div>
                    </Collapsible>
                  );
                })
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
