'use client';

import { useEffect, useState } from 'react';
import { FileText, Loader2, ShieldCheck, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import api, { estadosPolizaApi, infoPagoApi } from '@/lib/api';
import {
  ESTADO_DOCUMENTO_OPTIONS,
  ESTADO_PAGO_OPTIONS,
  getEstadoDocumentoLabel,
  getEstadoPagoLabel,
  StatusBadge,
} from './polizaStatusUtils';

interface EstatusPolizaCardsProps {
  polizaId: number;
  estado?: number | null;
  estadoNombre?: string;
  estadoDocumento?: string | null;
  infoPagoId?: number | null;
  estadoPago?: string | null;
  layout?: 'row' | 'column';
  deferSave?: boolean;
  showSaveButton?: boolean;
  onUpdated?: () => void;
  onSaved?: () => void;
}

export function EstatusPolizaCards({
  polizaId,
  estado,
  estadoNombre,
  estadoDocumento,
  infoPagoId,
  estadoPago,
  layout = 'row',
  deferSave = false,
  showSaveButton = false,
  onUpdated,
  onSaved,
}: EstatusPolizaCardsProps) {
  const { toast } = useToast();
  const [estadosPoliza, setEstadosPoliza] = useState<{ id: number; nombre: string }[]>([]);
  const [selectedEstado, setSelectedEstado] = useState(estado ? String(estado) : '');
  const [selectedDocumento, setSelectedDocumento] = useState(estadoDocumento || 'PENDIENTE');
  const [selectedPago, setSelectedPago] = useState(estadoPago || 'PENDIENTE');
  const [savingField, setSavingField] = useState<'poliza' | 'documento' | 'pago' | 'all' | null>(null);

  useEffect(() => {
    estadosPolizaApi.list().then(setEstadosPoliza).catch(console.error);
  }, []);

  useEffect(() => {
    setSelectedEstado(estado ? String(estado) : '');
    setSelectedDocumento(estadoDocumento || 'PENDIENTE');
    setSelectedPago(estadoPago || 'PENDIENTE');
  }, [estado, estadoDocumento, estadoPago]);

  const saveEstadoPoliza = async (value: string) => {
    await api.polizas.patch(polizaId, { estado: Number(value) });
  };

  const saveEstadoDocumento = async (value: string) => {
    await api.polizas.patch(polizaId, { estado_documento: value });
  };

  const saveEstadoPago = async (value: string) => {
    if (infoPagoId) {
      await infoPagoApi.patch(infoPagoId, { estado_pago: value });
    } else {
      await infoPagoApi.create({ poliza: polizaId, estado_pago: value, pago_recurrente: false });
    }
  };

  const handleEstadoPolizaChange = async (value: string) => {
    setSelectedEstado(value);
    if (deferSave) return;

    setSavingField('poliza');
    try {
      await saveEstadoPoliza(value);
      toast({ title: 'Estatus de póliza actualizado' });
      onUpdated?.();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudo actualizar el estatus de póliza.', variant: 'destructive' });
      setSelectedEstado(estado ? String(estado) : '');
    } finally {
      setSavingField(null);
    }
  };

  const handleEstadoDocumentoChange = async (value: string) => {
    setSelectedDocumento(value);
    if (deferSave) return;

    setSavingField('documento');
    try {
      await saveEstadoDocumento(value);
      toast({ title: 'Estatus de documento actualizado' });
      onUpdated?.();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudo actualizar el estatus de documento.', variant: 'destructive' });
      setSelectedDocumento(estadoDocumento || 'PENDIENTE');
    } finally {
      setSavingField(null);
    }
  };

  const handleEstadoPagoChange = async (value: string) => {
    setSelectedPago(value);
    if (deferSave) return;

    setSavingField('pago');
    try {
      await saveEstadoPago(value);
      toast({ title: 'Estatus de pago actualizado' });
      onUpdated?.();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudo actualizar el estatus de pago.', variant: 'destructive' });
      setSelectedPago(estadoPago || 'PENDIENTE');
    } finally {
      setSavingField(null);
    }
  };

  const handleSaveAll = async () => {
    if (!selectedEstado) {
      toast({ title: 'Seleccione el estatus de póliza', variant: 'destructive' });
      return;
    }

    setSavingField('all');
    try {
      const tasks: Promise<unknown>[] = [];

      if (Number(selectedEstado) !== Number(estado || 0)) {
        tasks.push(saveEstadoPoliza(selectedEstado));
      }
      if (selectedDocumento !== (estadoDocumento || 'PENDIENTE')) {
        tasks.push(saveEstadoDocumento(selectedDocumento));
      }
      if (selectedPago !== (estadoPago || 'PENDIENTE')) {
        tasks.push(saveEstadoPago(selectedPago));
      }

      if (tasks.length === 0) {
        toast({ description: 'No hay cambios por guardar.' });
        onSaved?.();
        return;
      }

      await Promise.all(tasks);
      toast({ title: 'Cambios guardados', description: 'Los estatus se actualizaron correctamente.' });
      onUpdated?.();
      onSaved?.();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudieron guardar los cambios.', variant: 'destructive' });
    } finally {
      setSavingField(null);
    }
  };

  const currentEstadoNombre =
    estadosPoliza.find((item) => item.id === Number(selectedEstado))?.nombre || estadoNombre || 'Sin estatus';

  const gridClass = layout === 'column' ? 'flex flex-col gap-4' : 'grid grid-cols-1 md:grid-cols-3 gap-4';

  return (
    <div className="space-y-4">
      <div className={gridClass}>
        <StatusCard
          icon={<ShieldCheck className="h-5 w-5 text-indigo-600" />}
          title="Estatus de póliza"
          badge={<StatusBadge label={currentEstadoNombre} />}
        >
          <select
            value={selectedEstado}
            onChange={(e) => handleEstadoPolizaChange(e.target.value)}
            disabled={savingField !== null}
            className="w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Seleccionar estatus</option>
            {estadosPoliza.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
              </option>
            ))}
          </select>
        </StatusCard>

        <StatusCard
          icon={<FileText className="h-5 w-5 text-amber-600" />}
          title="Estatus de documento"
          badge={<StatusBadge label={getEstadoDocumentoLabel(selectedDocumento)} />}
        >
          <select
            value={selectedDocumento}
            onChange={(e) => handleEstadoDocumentoChange(e.target.value)}
            disabled={savingField !== null}
            className="w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          >
            {ESTADO_DOCUMENTO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </StatusCard>

        <StatusCard
          icon={<Wallet className="h-5 w-5 text-emerald-600" />}
          title="Estatus de pago"
          badge={<StatusBadge label={getEstadoPagoLabel(selectedPago)} />}
        >
          <select
            value={selectedPago}
            onChange={(e) => handleEstadoPagoChange(e.target.value)}
            disabled={savingField !== null}
            className="w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          >
            {ESTADO_PAGO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </StatusCard>
      </div>

      {showSaveButton ? (
        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-700">
          <Button
            className="bg-primary hover:bg-primary/90 min-w-[140px]"
            onClick={handleSaveAll}
            disabled={savingField !== null}
          >
            {savingField === 'all' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar cambios'
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function StatusCard({
  icon,
  title,
  badge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  badge: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white shadow-sm border border-slate-100 rounded-lg dark:bg-slate-800 dark:border-slate-800 p-4 space-y-3 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">{title}</h3>
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}
