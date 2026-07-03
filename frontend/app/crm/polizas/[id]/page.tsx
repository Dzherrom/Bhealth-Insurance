'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { usePolizaStore } from '@/store/polizaStore';

import { PolizaResumen } from '@/components/polizas/PolizaResumen';
import { EditPlanDetailsModal } from '@/components/polizas/EditPlanDetailsModal';
import { DocumentosPoliza } from '@/components/polizas/DocumentosPoliza';
import { RecordatoriosPoliza } from '@/components/recordatorios';
import { InfoPagoPoliza } from '@/components/polizas/InfoPagoPoliza';
import { DireccionesPoliza } from '@/components/polizas/DireccionesPoliza';
import { MetadatosPoliza } from '@/components/polizas/MetadatosPoliza';
import { CalendarioPrimasPoliza } from '@/components/polizas/CalendarioPrimasPoliza';
import { NotasChat } from '@/components/notas/NotasChat';
import { RegistrosActividadModal } from '@/components/polizas/RegistrosActividadModal';
import { FamilyMembersSection } from '@/components/polizas/FamilyMembersSection';
import { EditInfoPagoModal } from '@/components/polizas/EditInfoPagoModal';
import { UltimaNotaCard } from '@/components/polizas/UltimaNotaCard';
import { CitasPoliza } from '@/components/polizas/CitasPoliza';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { formatDireccion, formatFechaDisplay } from '@/components/polizas/polizaUtils';
import { polizaIsQuote, previewPolizaEnvioErrors } from '@/lib/polizaEnvioUtils';
import { PaymentMethodsSection } from '@/components/polizas/PaymentMethodsSection';
import { MedicosMedicamentosSection } from '@/components/polizas/MedicosMedicamentosSection';

const formatCurrency = (amount: string | number) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount || '0') : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(numAmount);
};

export default function PolizaDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { polizaSeleccionada: poliza, isLoading: loading, error, fetchPolizaById } = usePolizaStore();
  const [activeSection, setActiveSection] = useState('poliza');
  const [enviandoPoliza, setEnviandoPoliza] = useState(false);
  const [envioRequisitosOpen, setEnvioRequisitosOpen] = useState(false);

  const [isBasicInfoModalOpen, setIsBasicInfoModalOpen] = useState(false);
  const [isEditInfoPagoOpen, setIsEditInfoPagoOpen] = useState(false);
  const [isNotasChatOpen, setIsNotasChatOpen] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchPolizaById(Number(params.id));
    }
  }, [params.id, fetchPolizaById]);

  if (loading) {
    return (
      <div className="pb-10 min-h-screen pt-6 flex-col md:flex-row px-3 flex gap-4">
        <div className="flex flex-col lg:w-72 space-y-4">
          <Skeleton className="h-96 w-full" />
        </div>
        <div className="flex-1 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!loading && error && !poliza) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <i className="fa-duotone fa-triangle-exclamation text-4xl text-amber-500"></i>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">No se pudo cargar la póliza</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => params.id && fetchPolizaById(Number(params.id))} variant="default">
              Reintentar
            </Button>
            <Button onClick={() => router.push('/crm/polizas')} variant="outline">
              Volver a pólizas
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!poliza) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <i className="fa-duotone fa-file-xmark text-4xl text-gray-400"></i>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Póliza no encontrada</h2>
          <Button onClick={() => router.push('/crm/polizas')} variant="outline">
            Volver a pólizas
          </Button>
        </div>
      </div>
    );
  }

  const clientesInfo = poliza.clientes_info || [];
  const clientePrincipal = clientesInfo.find(c => c.es_solicitante_principal);
  const infoPago = (poliza as any).info_pago ?? null;
  const tarjetasPago = (poliza as any).tarjetas_credito || [];
  const cuentasBancarias = (poliza as any).cuentas_bancarias || [];
  const polizaNotas = (poliza as any).notas || [];
  const medicosPrincipales = (poliza as any).medicos_principales ?? [];
  const medicamentosLista = (poliza as any).medicamentos ?? [];

  const refreshPoliza = () => poliza.id && fetchPolizaById(poliza.id, { silent: true });

  const esCotizacion = poliza ? polizaIsQuote(poliza) : false;
  const erroresEnvioPreview = poliza ? previewPolizaEnvioErrors(poliza) : [];
  const puedeEnviarPoliza = esCotizacion && erroresEnvioPreview.length === 0;

  const handleEnviarPoliza = async () => {
    if (!poliza?.id || enviandoPoliza) return;

    const erroresLocales = previewPolizaEnvioErrors(poliza);
    if (erroresLocales.length > 0) {
      setEnvioRequisitosOpen(true);
      return;
    }

    setEnviandoPoliza(true);
    try {
      const result = await api.polizas.enviar(poliza.id);
      await refreshPoliza();
      toast({
        title: 'Póliza enviada',
        description: result.detail || 'La póliza aparecerá como activa en el listado de pólizas.',
      });
    } catch (err: unknown) {
      const payload = err as { errores?: string[]; message?: string };
      const errores = payload.errores?.length
        ? payload.errores.join(' ')
        : (payload.message || 'No se pudo enviar la póliza.');
      toast({
        title: 'Error al enviar',
        description: errores,
        variant: 'destructive',
      });
    } finally {
      setEnviandoPoliza(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-transparent">
      {/* Header Top Navbar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button 
            className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            onClick={() => router.push('/crm/polizas')}
          >
            <i className="fa-solid fa-chevron-left text-slate-600 dark:text-slate-300"></i>
          </button>
          <h1 className="text-lg font-semibold text-slate-800 dark:text-white">
            Resumen de póliza - Pólizas
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {esCotizacion ? (
            <button
              type="button"
              onClick={handleEnviarPoliza}
              disabled={enviandoPoliza}
              title={
                !puedeEnviarPoliza
                  ? 'Hay requisitos pendientes. Haz clic para ver el detalle.'
                  : 'Enviar póliza como activa'
              }
              className={`flex gap-2 items-center px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                puedeEnviarPoliza
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              <i className={`fa-solid ${puedeEnviarPoliza ? 'fa-check-circle' : 'fa-triangle-exclamation'}`}></i>
              {enviandoPoliza ? 'Enviando...' : puedeEnviarPoliza ? 'Enviar Póliza' : 'Requisitos pendientes'}
            </button>
          ) : (
            <span className="flex gap-2 items-center px-4 py-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 rounded-md text-sm font-medium">
              <i className="fa-solid fa-circle-check"></i>
              Póliza enviada
            </span>
          )}
          <button className="flex gap-2 items-center px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md text-sm font-medium transition-colors" onClick={() => router.push('/crm/polizas')}>
            <i className="fa-solid fa-magnifying-glass"></i> Buscar pólizas
          </button>
        </div>
      </div>

      {esCotizacion && erroresEnvioPreview.length > 0 && (
        <div className="mx-6 mt-3 px-4 py-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40">
          <div className="flex items-start gap-3">
            <i className="fa-solid fa-triangle-exclamation text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                Esta cotización aún no se puede enviar como póliza activa
              </p>
              <p className="text-xs text-amber-800/90 dark:text-amber-200/80 mt-1">
                Completa los siguientes requisitos antes de enviar:
              </p>
              <ul className="mt-2 space-y-1.5">
                {erroresEnvioPreview.map((error) => (
                  <li
                    key={error}
                    className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-100"
                  >
                    <i className="fa-solid fa-circle-xmark text-red-500 dark:text-red-400 mt-0.5 shrink-0 text-xs" />
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setEnvioRequisitosOpen(true)}
                className="mt-3 text-xs font-medium text-amber-800 dark:text-amber-200 underline underline-offset-2 hover:text-amber-950 dark:hover:text-white"
              >
                Ver detalle de requisitos
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={envioRequisitosOpen} onOpenChange={setEnvioRequisitosOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Requisitos para enviar la póliza</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            La cotización debe cumplir todos estos puntos para pasar a estatus de póliza activa enviada:
          </p>
          <ul className="my-4 space-y-2">
            {erroresEnvioPreview.map((error) => (
              <li key={error} className="flex items-start gap-2 text-sm">
                <i className="fa-solid fa-circle-xmark text-red-500 mt-0.5 shrink-0" />
                <span>{error}</span>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnvioRequisitosOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="pb-10 flex-1 pt-6 flex-col md:flex-row px-3 flex gap-4">

      {/* Sidebar Left */}
      <PolizaResumen 
        poliza={{
          id: poliza.id,
          id_mercado: poliza.id_mercado,
          id_miembro: poliza.id_miembro,
          agente: poliza.agente,
          agente_nombre: poliza.agente_nombre,
          agente_registro: (poliza as any).agente_registro,
          agente_registro_nombre: (poliza as any).agente_registro_nombre,
          plan_nombre: poliza.plan_nombre,
          estado_nombre: poliza.estado_nombre,
          estado: poliza.estado,
          estado_documento: (poliza as any).estado_documento,
          estado_pago: infoPago?.estado_pago ?? null,
          info_pago_id: infoPago?.id ?? null,
          etiquetas: poliza.etiquetas,
          prima_mensual: poliza.prima_mensual?.toString() || '0',
          fecha_efectiva: poliza.fecha_efectiva,
          cliente_principal: clientePrincipal ? `${clientePrincipal.cliente_details.primer_nombre} ${clientePrincipal.cliente_details.apellido_paterno}` : 'No asignado'
        }}
        polizaContext={{
          clientes_info: poliza.clientes_info,
          direccion_fisica_details: poliza.direccion_fisica_details,
          direccion_postal_details: poliza.direccion_postal_details,
          direccion_facturacion_details: poliza.direccion_facturacion_details,
          documentos: (poliza as any).documentos,
          notas: polizaNotas,
        }}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onPolizaUpdate={() => poliza.id && fetchPolizaById(poliza.id)}
        onOpenNotasChat={() => setIsNotasChatOpen(true)}
      />

      {/* Floating right buttons */}
      <div className="fixed h-screen transition-all top-0 right-0 flex justify-center z-[20]">
        <div className="flex flex-col my-auto shadow-lg p-1 bg-white dark:bg-slate-800 gap-1 rounded-l-lg border dark:border-slate-700">
          <button className="flex gap-2 items-center cursor-pointer justify-center rounded-md py-2 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 text-primary dark:hover:bg-slate-100 dark:hover:bg-opacity-10 dark:text-primary-300 dark:hover:text-primary-50 h-[30px] px-2 text-xs bg-slate-50 dark:bg-slate-700 w-full hover:bg-primary transition-colors hover:text-white" type="button" title="Póliza">
            <i className="lg:text-base fa-solid fa-shield-halved"></i>
          </button>
          <button className="flex gap-2 items-center cursor-pointer justify-center rounded-md py-2 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 text-primary dark:hover:bg-slate-100 dark:hover:bg-opacity-10 dark:text-primary-300 dark:hover:text-primary-50 h-[30px] px-2 text-xs bg-slate-50 dark:bg-slate-700 w-full hover:bg-primary transition-colors hover:text-white" type="button" title="Familia">
            <i className="lg:text-base fa-solid fa-family"></i>
          </button>
          <button className="flex gap-2 items-center cursor-pointer justify-center rounded-md py-2 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 text-primary dark:hover:bg-slate-100 dark:hover:bg-opacity-10 dark:text-primary-300 dark:hover:text-primary-50 h-[30px] px-2 text-xs bg-slate-50 dark:bg-slate-700 w-full hover:bg-primary transition-colors hover:text-white" type="button" title="Dirección" onClick={() => setActiveSection('direcciones')}>
            <i className="lg:text-base fa-solid fa-location-arrow"></i>
          </button>
          <button className="flex gap-2 items-center cursor-pointer justify-center rounded-md py-2 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 text-primary dark:hover:bg-slate-100 dark:hover:bg-opacity-10 dark:text-primary-300 dark:hover:text-primary-50 h-[30px] px-2 text-xs bg-slate-50 dark:bg-slate-700 w-full hover:bg-primary transition-colors hover:text-white" type="button" title="Tarjetas">
            <i className="lg:text-base fa-solid fa-credit-card"></i>
          </button>
          <button className="flex gap-2 items-center cursor-pointer justify-center rounded-md py-2 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 text-primary dark:hover:bg-slate-100 dark:hover:bg-opacity-10 dark:text-primary-300 dark:hover:text-primary-50 h-[30px] px-2 text-xs bg-slate-50 dark:bg-slate-700 w-full hover:bg-primary transition-colors hover:text-white" type="button" title="Documentos">
            <i className="lg:text-base fa-solid fa-book"></i>
          </button>
          <button className="flex gap-2 items-center cursor-pointer justify-center rounded-md py-2 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 text-primary dark:hover:bg-slate-100 dark:hover:bg-opacity-10 dark:text-primary-300 dark:hover:text-primary-50 h-[30px] px-2 text-xs bg-slate-50 dark:bg-slate-700 w-full hover:bg-primary transition-colors hover:text-white" type="button" title="Otras pólizas">
            <i className="lg:text-base fa-solid fa-shield-plus"></i>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex max-w-full lg:max-w-[calc(100%-308px)] flex-col gap-4 w-full" id="summary">
        {activeSection === 'poliza' && (
          <>
            {/* Header Insurance Card */}
            <div className="relative">
              <div className="bg-white shadow-sm border-[1px] border-slate-100 rounded-lg dark:bg-slate-800 dark:border-slate-800 dark:shadow-none flex w-auto flex-col gap-2 p-4 lg:p-4">
                <div className="flex flex-wrap items-start md:items-center justify-between">
                  <div className="flex flex-wrap flex-col md:flex-row gap-3 md:gap-4">
                    <div className="flex items-center justify-center rounded-lg overflow-hidden bg-blue-100 dark:bg-primary/20 w-8 h-8 md:w-11 md:h-11">
                      <i className="text-blue-500 dark:text-blue-400 fas fa-house-chimney-medical"></i>
                    </div>
                    <div className="flex flex-col">
                      <h2 className="text-gray-700 dark:text-white text-base font-semibold flex items-center gap-1">
                        {poliza.plan_nombre || 'No se ha seleccionado aseguradora'}
                      </h2>
                      <div className="flex gap-2 items-center">
                        <h2 className="text-gray-700 dark:text-gray-300 text-sm font-normal flex items-center gap-1">
                          Health Insurance (ACA)
                        </h2>
                        <button className="gap-2 w-fit cursor-pointer justify-center rounded-md transition-colors font-medium text-xs text-primary p-0.5 h-fit flex items-center" type="button">
                          <i className="fa-solid fa-edit"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap">
                    <div className="flex gap-2">
                      <button className="items-center w-fit cursor-pointer justify-center rounded-md transition-colors py-2 font-medium text-primary bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700 h-[30px] px-2 text-xs flex gap-2 border border-primary dark:border-primary/50" type="button" onClick={() => setIsBasicInfoModalOpen(true)}>
                        <i className="fa-solid fa-edit"></i>Editar detalles del plan
                      </button>
                    </div>
                  </div>
                </div>
                <div className="relative flex items-center justify-between gap-4 w-full">
                  <hr className="border-slate-200 dark:border-slate-600 flex-1 mx-2 my-2" />
                </div>
                <div className="grid grid-cols-12 mb-2">
                  <div className="col-span-12 flex flex-col pb-2">
                    <h2 className="dark:text-white text-base font-normal text-primary flex items-center gap-1">
                      {poliza.plan_nombre || 'No se ha seleccionado un plan'}
                    </h2>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-700 dark:text-gray-300 text-xs font-normal flex items-center gap-1">
                        {poliza.metal
                          ? `Metal ${({ BRONCE: 'Bronce', PLATA: 'Plata', ORO: 'Oro', PLATINO: 'Platino' } as Record<string, string>)[poliza.metal] || poliza.metal}`
                          : 'Metal no seleccionado'}
                      </span>
                      <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                      <span className="text-gray-700 dark:text-gray-300 text-xs font-medium flex items-center gap-1">
                        ID del plan CMS: <span className="font-normal">{poliza.id_plan_cms || 'No se proporcionó ID del plan'}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full mb-2">
                  <div className="flex col-span-1 md:col-span-4 flex-col gap-1 rounded-md">
                    <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">Prima mensual</span>
                    <div className="flex items-start justify-start">
                      <span className="text-gray-700 dark:text-white text-sm font-medium leading-none mt-1">$</span>
                      <span className="text-gray-700 dark:text-white text-2xl font-semibold leading-none">{poliza.prima_mensual?.toString().split('.')[0] || '0'}</span>
                      <span className="text-gray-700 dark:text-white text-sm font-medium leading-none mt-1">.{poliza.prima_mensual?.toString().split('.')[1] || '00'}</span>
                    </div>
                  </div>
                  <div className="flex col-span-1 md:col-span-4 flex-col gap-1 rounded-md">
                    <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">Total de ahorros</span>
                    <div className="flex items-start justify-start">
                      <span className="text-gray-700 dark:text-white text-sm font-medium leading-none mt-1">$</span>
                      <span className="text-gray-700 dark:text-white text-2xl font-semibold leading-none">{poliza.subsidio?.toString().split('.')[0] || '0'}</span>
                      <span className="text-gray-700 dark:text-white text-sm font-medium leading-none mt-1">.{poliza.subsidio?.toString().split('.')[1] || '00'}</span>
                    </div>
                  </div>
                  <div className="flex col-span-1 md:col-span-4 flex-col gap-1 rounded-md">
                    <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">Costo Total</span>
                    <div className="flex items-start justify-start">
                      <span className="text-gray-700 dark:text-white text-sm font-medium leading-none mt-1">$</span>
                      <span className="text-gray-700 dark:text-white text-2xl font-semibold leading-none">{poliza.costo_poliza?.toString().split('.')[0] || '0'}</span>
                      <span className="text-gray-700 dark:text-white text-sm font-medium leading-none mt-1">.{poliza.costo_poliza?.toString().split('.')[1] || '00'}</span>
                    </div>
                  </div>
                </div>
                <div className="relative flex items-center justify-between gap-4 w-full">
                  <hr className="border-slate-200 dark:border-slate-600 flex-1 mx-2 my-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 gap-y-2 w-full">
                  <div className="col-span-1 md:col-span-4 flex-col">
                    <div className="text-gray-700 dark:text-gray-300 text-sm font-medium">ID del miembro</div>
                    <div className="text-gray-700 dark:text-white text-sm font-normal break-all">{poliza.id_miembro || '-'}</div>
                  </div>
                  <div className="col-span-1 md:col-span-4 flex-col">
                    <div className="text-gray-700 dark:text-gray-300 text-sm font-medium">ID del mercado</div>
                    <div className="text-gray-700 dark:text-white text-sm font-normal break-all">{poliza.id_mercado || '-'}</div>
                  </div>
                  <div className="col-span-1 md:col-span-4 flex-col">
                    <div className="text-gray-700 dark:text-gray-300 text-sm font-medium">Fecha de efectividad</div>
                    <div className="text-gray-700 dark:text-white text-sm font-normal">{poliza.fecha_efectiva ? new Date(poliza.fecha_efectiva).toLocaleDateString() : '-'}</div>
                  </div>
                  <div className="col-span-1 md:col-span-4 flex-col">
                    <div className="text-gray-700 dark:text-gray-300 text-sm font-medium">NPN utilizado en ID del mercado</div>
                    <div className="text-gray-700 dark:text-white text-sm font-normal break-all">{poliza.npn_mercado || '-'}</div>
                  </div>
                  <div className="col-span-1 md:col-span-4 flex-col">
                    <div className="text-gray-700 dark:text-gray-300 text-sm font-medium">FFM utilizado en el mercado</div>
                    <div className="text-gray-700 dark:text-white text-sm font-normal break-all">{poliza.ffm_mercado || '-'}</div>
                  </div>
                  <div className="col-span-1 md:col-span-4 flex-col">
                    <div className="text-gray-700 dark:text-gray-300 text-sm font-medium">Fecha de cancelación</div>
                    <div className="text-gray-700 dark:text-white text-sm font-normal">{formatFechaDisplay(poliza.fecha_cancelacion)}</div>
                  </div>
                  <div className="col-span-1 md:col-span-4 flex-col">
                    <div className="text-gray-700 dark:text-gray-300 text-sm font-medium">Nueva venta / Renovación</div>
                    <div className="text-gray-700 dark:text-white text-sm font-normal break-all">Venta nueva</div>
                  </div>
                </div>
              </div>
            </div>

            <FamilyMembersSection
              poliza={poliza}
              onRefresh={() => poliza.id && fetchPolizaById(poliza.id)}
            />

            {/* Addresses */}
            <div className="flex w-full gap-4 flex-col lg:flex-row">
              <div className="bg-white shadow-sm border-[1px] border-slate-100 rounded-lg dark:bg-slate-800 dark:border-slate-800 flex-1 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-gray-700 dark:text-white text-base font-semibold">Dirección física</h2>
                  <button className="flex gap-2 items-center bg-primary text-white hover:bg-primary/90 h-[30px] px-2 text-xs rounded-md" type="button" onClick={() => setActiveSection('direcciones')}>
                    <i className="fa-duotone fa-edit"></i>Editar
                  </button>
                </div>
                <hr className="border-slate-200 dark:border-slate-600 mx-2 mb-3" />
                {poliza.direccion_fisica_details ? (
                  <p className="text-sm dark:text-gray-300">{formatDireccion(poliza.direccion_fisica_details)}</p>
                ) : (
                  <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-md py-4 text-center">
                    <p className="text-sm dark:text-gray-400">No hay una dirección asociada con esta póliza.</p>
                  </div>
                )}
              </div>
              <div className="bg-white shadow-sm border-[1px] border-slate-100 rounded-lg dark:bg-slate-800 dark:border-slate-800 flex-1 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-gray-700 dark:text-white text-base font-semibold">Dirección postal</h2>
                  <button className="flex gap-2 items-center bg-primary text-white hover:bg-primary/90 h-[30px] px-2 text-xs rounded-md" type="button" onClick={() => setActiveSection('direcciones')}>
                    <i className="fa-duotone fa-edit"></i>Editar
                  </button>
                </div>
                <hr className="border-slate-200 dark:border-slate-600 mx-2 mb-3" />
                {poliza.direccion_postal_details ? (
                  <p className="text-sm dark:text-gray-300">{formatDireccion(poliza.direccion_postal_details)}</p>
                ) : (
                  <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-md py-4 text-center">
                    <p className="text-sm dark:text-gray-400">No hay una dirección asociada con esta póliza.</p>
                  </div>
                )}
              </div>
              <div className="bg-white shadow-sm border-[1px] border-slate-100 rounded-lg dark:bg-slate-800 dark:border-slate-800 flex-1 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-gray-700 dark:text-white text-base font-semibold">Dirección de facturación</h2>
                  <button className="flex gap-2 items-center bg-primary text-white hover:bg-primary/90 h-[30px] px-2 text-xs rounded-md" type="button" onClick={() => setActiveSection('direcciones')}>
                    <i className="fa-duotone fa-edit"></i>Editar
                  </button>
                </div>
                <hr className="border-slate-200 dark:border-slate-600 mx-2 mb-3" />
                {poliza.direccion_facturacion_details ? (
                  <p className="text-sm dark:text-gray-300">{formatDireccion(poliza.direccion_facturacion_details)}</p>
                ) : (
                  <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-md py-4 text-center">
                    <p className="text-sm dark:text-gray-400">No hay una dirección asociada con esta póliza.</p>
                  </div>
                )}
              </div>
            </div>

            <PaymentMethodsSection
              polizaId={poliza.id}
              infoPago={infoPago}
              tarjetas={tarjetasPago}
              cuentas={cuentasBancarias}
              onRefresh={refreshPoliza}
              onEditInfoPago={() => setIsEditInfoPagoOpen(true)}
              formatFechaDisplay={formatFechaDisplay}
            />

            {/* Notes */}
            <div className="bg-white shadow-sm border-[1px] border-slate-100 rounded-lg dark:bg-slate-800 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-gray-700 dark:text-white text-base font-semibold">Notas</h2>
                <button
                  className="flex gap-2 items-center bg-primary text-white hover:bg-primary/90 h-[30px] px-2 text-xs rounded-md"
                  type="button"
                  onClick={() => setIsNotasChatOpen(true)}
                >
                  <i className="fa-duotone fa-plus"></i>Agregar nota
                </button>
              </div>
              <hr className="border-slate-200 dark:border-slate-600 mx-2 mb-3" />
              <UltimaNotaCard notas={polizaNotas} variant="section" />
            </div>

            <MedicosMedicamentosSection
              polizaId={poliza.id}
              medicos={medicosPrincipales}
              medicamentos={medicamentosLista}
              onRefresh={refreshPoliza}
            />

            {/* Other policies */}
            <div className="bg-white shadow-sm border-[1px] border-slate-100 rounded-lg dark:bg-slate-800 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <h2 className="text-gray-700 dark:text-white text-base font-semibold">Otras pólizas del aplicante</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm dark:text-gray-300">Año de efectividad:</span>
                  <div className="flex gap-3 text-sm dark:text-gray-300">
                    <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="rounded" /> 2026</label>
                    <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="rounded" /> 2025</label>
                    <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="rounded" /> 2024</label>
                  </div>
                </div>
              </div>
              <hr className="border-slate-200 dark:border-slate-600 mx-2 mb-3" />
              
              <div className="border border-slate-100 dark:border-slate-700 rounded-md overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300">
                    <tr>
                      <th className="px-4 py-3 font-medium">Agente</th>
                      <th className="px-4 py-3 font-medium">Cliente</th>
                      <th className="px-4 py-3 font-medium">Póliza</th>
                      <th className="px-4 py-3 font-medium">Estatus</th>
                      <th className="px-4 py-3 font-medium">Asignado a</th>
                      <th className="px-4 py-3 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={6} className="text-center py-10 dark:bg-slate-800">
                        <i className="fa-solid fa-shield-halved text-2xl text-gray-400 mb-2 block"></i>
                        <p className="font-medium dark:text-white">No hay registros para mostrar aquí.</p>
                        <p className="text-xs text-gray-500 mt-1">Por favor, inicie una nueva búsqueda</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Other Tabs Rendering (Keep old component mounting for other tabs) */}
        {activeSection === 'documentos' && (
          <DocumentosPoliza
            polizaId={params.id as string}
            onDocumentsChange={refreshPoliza}
          />
        )}
        {activeSection === 'recordatorios' && <RecordatoriosPoliza polizaId={params.id as string} />}
        {activeSection === 'citas' && poliza.id && (
          <CitasPoliza polizaId={poliza.id} clientesInfo={clientesInfo} />
        )}
        {activeSection === 'pagos' && <InfoPagoPoliza poliza={poliza} />}
        {activeSection === 'direcciones' && (
          <DireccionesPoliza
            poliza={poliza}
            onRefresh={() => poliza.id && fetchPolizaById(poliza.id)}
          />
        )}
        {activeSection === 'metadatos' && <MetadatosPoliza poliza={poliza} />}
        {activeSection === 'calendario' && <CalendarioPrimasPoliza polizaId={poliza.id} />}
        
        {/* If note or signature form logic is needed later, just standard placeholders */}
      </div>

    </div>
    {/* Footer */}
    <div className="flex flex-col md:flex-row py-6 md:py-0 items-start md:items-center justify-between min-h-14 w-full bg-white dark:bg-slate-800 px-6 mt-4">
      <span className="text-sm pl-2 md:pl-0 mb-4 md:mb-0 font-light text-gray-700 dark:text-gray-300">
        Copyrights © <a href="https://apizeal.com" className="text-blue-500 hover:underline">Apizeal</a> , 2026. Todos los derechos reservados.
      </span>
      <div className="flex flex-col md:flex-row md:items-center gap-2">
        <button className="flex gap-2 items-center w-fit cursor-pointer rounded-md transition-colors py-2 font-medium text-primary bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700 h-[34px] px-2.5 text-xs justify-start" type="button">Privacidad</button>
        <button className="flex gap-2 items-center w-fit cursor-pointer rounded-md transition-colors py-2 font-medium text-primary bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700 h-[34px] px-2.5 text-xs justify-end" type="button">Acuerdo de licencia</button>
        <button className="flex gap-2 items-center w-fit cursor-pointer rounded-md transition-colors py-2 font-medium text-primary bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700 h-[34px] px-2.5 text-xs justify-end" type="button">Términos y condiciones</button>
      </div>
    </div>
      <EditInfoPagoModal
        open={isEditInfoPagoOpen}
        onOpenChange={setIsEditInfoPagoOpen}
        polizaId={poliza.id}
        infoPago={infoPago}
        onSaved={refreshPoliza}
      />
      <EditPlanDetailsModal
        open={isBasicInfoModalOpen}
        onOpenChange={setIsBasicInfoModalOpen}
        poliza={poliza}
        onSaved={() => poliza.id && fetchPolizaById(poliza.id)}
      />
      <NotasChat
        isOpen={isNotasChatOpen}
        onClose={() => setIsNotasChatOpen(false)}
        onClosed={refreshPoliza}
        polizaInfo={{
          cliente: clientePrincipal
            ? `${clientePrincipal.cliente_details.primer_nombre} ${clientePrincipal.cliente_details.apellido_paterno}`
            : 'No asignado',
          plan: poliza.plan_nombre || '',
          id: String(poliza.id),
          estado: poliza.estado_nombre,
          etiquetas: poliza.etiquetas,
        }}
      />
  </div>
  );
}
