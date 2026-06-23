'use client';

import { useEffect, useState } from 'react';
import { FileText, ShieldCheck, Wallet } from 'lucide-react';
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
  onUpdated?: () => void;
}

export function EstatusPolizaCards({
  polizaId,
  estado,
  estadoNombre,
  estadoDocumento,
  infoPagoId,
  estadoPago,
  onUpdated,
}: EstatusPolizaCardsProps) {
  const { toast } = useToast();
  const [estadosPoliza, setEstadosPoliza] = useState<{ id: number; nombre: string }[]>([]);
  const [selectedEstado, setSelectedEstado] = useState(estado ? String(estado) : '');
  const [selectedDocumento, setSelectedDocumento] = useState(estadoDocumento || 'PENDIENTE');
  const [selectedPago, setSelectedPago] = useState(estadoPago || 'PENDIENTE');
  const [savingField, setSavingField] = useState<'poliza' | 'documento' | 'pago' | null>(null);

  useEffect(() => {
    estadosPolizaApi.list().then(setEstadosPoliza).catch(console.error);
  }, []);

  useEffect(() => {
    setSelectedEstado(estado ? String(estado) : '');
    setSelectedDocumento(estadoDocumento || 'PENDIENTE');
    setSelectedPago(estadoPago || 'PENDIENTE');
  }, [estado, estadoDocumento, estadoPago]);

  const handleEstadoPolizaChange = async (value: string) => {
    setSelectedEstado(value);
    setSavingField('poliza');
    try {
      await api.polizas.patch(polizaId, { estado: Number(value) });
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
    setSavingField('documento');
    try {
      await api.polizas.patch(polizaId, { estado_documento: value });
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
    setSavingField('pago');
    try {
      if (infoPagoId) {
        await infoPagoApi.patch(infoPagoId, { estado_pago: value });
      } else {
        await infoPagoApi.create({ poliza: polizaId, estado_pago: value, pago_recurrente: false });
      }
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

  const currentEstadoNombre =
    estadosPoliza.find((item) => item.id === Number(selectedEstado))?.nombre || estadoNombre || 'Sin estatus';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatusCard
        icon={<ShieldCheck className="h-5 w-5 text-indigo-600" />}
        title="Estatus de póliza"
        badge={<StatusBadge label={currentEstadoNombre} />}
      >
        <select
          value={selectedEstado}
          onChange={(e) => handleEstadoPolizaChange(e.target.value)}
          disabled={savingField === 'poliza'}
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
          disabled={savingField === 'documento'}
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
          disabled={savingField === 'pago'}
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
    <div className="bg-white shadow-sm border border-slate-100 rounded-lg dark:bg-slate-800 dark:border-slate-800 p-4 space-y-3">
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
