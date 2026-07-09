'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { portalClienteApi, type PortalClienteDashboard } from '@/lib/api';
import { CAMPO_LABELS } from '@/components/client/dashboard/constants';
import { MisDatosCard } from '@/components/client/dashboard/MisDatosCard';
import { MisPolizasCard } from '@/components/client/dashboard/MisPolizasCard';
import { GrupoFamiliarCard } from '@/components/client/dashboard/GrupoFamiliarCard';
import { SolicitudesCard } from '@/components/client/dashboard/SolicitudesCard';
import {
  SolicitudCambioModal,
  type SolicitudCambioMode,
} from '@/components/client/dashboard/SolicitudCambioModal';
import { cardClass } from '@/components/client/dashboard/constants';
import { Card, CardContent } from '@/components/ui/card';

function normalizeDashboard(dashboard: PortalClienteDashboard): PortalClienteDashboard {
  return {
    ...dashboard,
    grupo_familiar: dashboard.grupo_familiar ?? [],
    tarjetas_digitales: dashboard.tarjetas_digitales ?? [],
    cuentas_bancarias: dashboard.cuentas_bancarias ?? [],
    cambios_pendientes: dashboard.cambios_pendientes ?? [],
    documentos_solicitados: dashboard.documentos_solicitados ?? [],
    polizas: dashboard.polizas ?? (dashboard.poliza ? [dashboard.poliza] : []),
    campos_editables: dashboard.campos_editables ?? Object.keys(CAMPO_LABELS),
    elegibilidad: dashboard.elegibilidad ?? {},
    agente: dashboard.agente ?? {},
  };
}

export default function ClientDashboardPage() {
  const [data, setData] = useState<PortalClienteDashboard | null>(null);
  const [selectedPolizaId, setSelectedPolizaId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [solicitudMode, setSolicitudMode] = useState<SolicitudCambioMode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [miembroDocumento, setMiembroDocumento] = useState<{ clienteId: number; nombre: string } | null>(null);

  const loadDashboard = useCallback(async (options?: { silent?: boolean; polizaId?: number | null }) => {
    if (!options?.silent) setIsLoading(true);
    setError(null);
    try {
      const dashboard = await portalClienteApi.getDashboard(options?.polizaId ?? selectedPolizaId ?? undefined);
      const normalized = normalizeDashboard(dashboard);
      setData(normalized);
      if (normalized.poliza?.id) {
        setSelectedPolizaId(normalized.poliza.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar su información');
    } finally {
      if (!options?.silent) setIsLoading(false);
    }
  }, [selectedPolizaId]);

  useEffect(() => {
    void loadDashboard();
  }, []);

  const handleSelectPoliza = async (polizaId: number) => {
    setSelectedPolizaId(polizaId);
    await loadDashboard({ silent: true, polizaId });
  };

  const showSuccess = (message: string) => {
    setSuccessMsg(message);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const handleSolicitudSubmit = async ({
    nuevoValor,
    descripcion,
  }: {
    nuevoValor: string;
    descripcion: string;
  }) => {
    if (!solicitudMode || !data?.poliza?.id) return;
    setIsSubmitting(true);
    setError(null);
    try {
      if (solicitudMode.type === 'editar') {
        await portalClienteApi.actualizarSolicitud(solicitudMode.cambioId, {
          campos: { [solicitudMode.campo]: nuevoValor },
          descripcion: descripcion || undefined,
        });
        showSuccess('Solicitud actualizada correctamente.');
      } else if (solicitudMode.type === 'miembro') {
        await portalClienteApi.solicitarCambio({
          poliza_id: data.poliza.id,
          campos: {
            miembro_familiar: {
              cliente_id: solicitudMode.clienteId,
              campo: solicitudMode.campo,
              valor: nuevoValor,
            },
          },
          descripcion: descripcion || undefined,
        });
        showSuccess('Solicitud enviada para el familiar seleccionado.');
      } else {
        await portalClienteApi.solicitarCambio({
          poliza_id: data.poliza.id,
          campos: { [solicitudMode.campo]: nuevoValor },
          descripcion: descripcion || undefined,
        });
        showSuccess('Su solicitud fue enviada. Un agente revisará los cambios pronto.');
      }
      setSolicitudMode(null);
      await loadDashboard({ silent: true, polizaId: data.poliza.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive" className="bg-white border-red-200">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => loadDashboard()} className="bg-emerald-600 hover:bg-emerald-700">
          Reintentar
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0f172a]">Hola, {data.nombre_completo}</h1>
        <p className="text-sm text-[#64748b] mt-1">
          Consulta tus pólizas, actualiza tu información y gestiona solicitudes desde cualquier dispositivo.
        </p>
      </div>

      {successMsg ? (
        <Alert className="bg-emerald-50 border-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800">{successMsg}</AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive" className="bg-white border-red-200">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!data.poliza ? (
        <Card className={cardClass}>
          <CardContent className="py-10 text-center text-[#64748b]">
            {data.mensaje || 'No tiene pólizas registradas en este momento.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <MisDatosCard
            data={data}
            polizaId={data.poliza.id}
            onSolicitarCambio={(campo) => setSolicitudMode({ type: 'campo', campo })}
            onRefresh={() => loadDashboard({ silent: true, polizaId: data.poliza!.id })}
            onSuccess={showSuccess}
            onError={setError}
          />

          <MisPolizasCard
            data={data}
            selectedPolizaId={selectedPolizaId}
            onSelectPoliza={handleSelectPoliza}
          />

          <GrupoFamiliarCard
            data={data}
            onSolicitarCambioMiembro={(payload) =>
              setSolicitudMode({
                type: 'miembro',
                clienteId: payload.clienteId,
                miembroNombre: payload.miembroNombre,
                campo: payload.campo,
                campoLabel: payload.campoLabel,
              })
            }
            onSolicitarDocumentoMiembro={(clienteId, nombre) =>
              setMiembroDocumento({ clienteId, nombre })
            }
          />

          <SolicitudesCard
            data={data}
            polizaId={data.poliza.id}
            miembroDocumento={miembroDocumento}
            onClearMiembroDocumento={() => setMiembroDocumento(null)}
            onRefresh={() => loadDashboard({ silent: true, polizaId: data.poliza!.id })}
            onError={setError}
            onSuccess={showSuccess}
          />
        </div>
      )}

      <SolicitudCambioModal
        open={Boolean(solicitudMode)}
        mode={solicitudMode}
        onClose={() => setSolicitudMode(null)}
        onSubmit={handleSolicitudSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
