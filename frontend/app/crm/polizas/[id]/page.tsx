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
import { AddFamilyMemberCard } from '@/components/polizas/AddFamilyMemberCard';
import { EditFamilyMemberModal } from '@/components/polizas/EditFamilyMemberModal';
import { EditInfoPagoModal } from '@/components/polizas/EditInfoPagoModal';
import { EditMedicoPolizaModal } from '@/components/polizas/EditMedicoPolizaModal';
import { EditMedicamentoModal } from '@/components/polizas/EditMedicamentoModal';
import type { MedicoPoliza, MedicamentoPoliza } from '@/lib/api';
import { UltimaNotaCard } from '@/components/polizas/UltimaNotaCard';
import { CitasPoliza } from '@/components/polizas/CitasPoliza';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { formatDireccion, formatFechaDisplay } from '@/components/polizas/polizaUtils';
import { UsBankCombobox } from '@/components/polizas/UsBankCombobox';

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
  const { polizaSeleccionada: poliza, isLoading: loading, error, fetchPolizaById } = usePolizaStore();
  const [activeSection, setActiveSection] = useState('poliza');

  const [isBasicInfoModalOpen, setIsBasicInfoModalOpen] = useState(false);
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [showAddMemberCard, setShowAddMemberCard] = useState(false);
  const [currentFamilyMember, setCurrentFamilyMember] = useState<any>(null);
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [isEditInfoPagoOpen, setIsEditInfoPagoOpen] = useState(false);
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
  const [medicoModalOpen, setMedicoModalOpen] = useState(false);
  const [selectedMedico, setSelectedMedico] = useState<MedicoPoliza | null>(null);
  const [medicamentoModalOpen, setMedicamentoModalOpen] = useState(false);
  const [selectedMedicamento, setSelectedMedicamento] = useState<MedicamentoPoliza | null>(null);
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
  const aplicanteCount = clientesInfo.filter(c => c.es_solicitante_principal).length;
  const familiaresCount = clientesInfo.length;
  const dependientesCount = clientesInfo.filter(c => !c.es_solicitante_principal).length;
  const infoPago = (poliza as any).info_pago ?? null;
  const tarjetasPago = (poliza as any).tarjetas_credito || [];
  const cuentasBancarias = (poliza as any).cuentas_bancarias || [];
  const polizaNotas = (poliza as any).notas || [];
  const medicosPrincipales: MedicoPoliza[] = (poliza as any).medicos_principales ?? [];
  const medicamentosLista: MedicamentoPoliza[] = (poliza as any).medicamentos ?? [];

  const openAddMedico = () => {
    setSelectedMedico(null);
    setMedicoModalOpen(true);
  };

  const openEditMedico = (medico: MedicoPoliza) => {
    setSelectedMedico(medico);
    setMedicoModalOpen(true);
  };

  const openAddMedicamento = () => {
    setSelectedMedicamento(null);
    setMedicamentoModalOpen(true);
  };

  const openEditMedicamento = (medicamento: MedicamentoPoliza) => {
    setSelectedMedicamento(medicamento);
    setMedicamentoModalOpen(true);
  };

  const maskCardNumber = (numero?: string) => {
    if (!numero) return '****';
    const digits = numero.replace(/\D/g, '');
    return `****${digits.slice(-4) || numero.slice(-4)}`;
  };

  const refreshPoliza = () => poliza.id && fetchPolizaById(poliza.id, { silent: true });

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
          <button className="flex gap-2 items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium transition-colors">
            <i className="fa-solid fa-check-circle"></i> Enviar Póliza
          </button>
          <button className="flex gap-2 items-center px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md text-sm font-medium transition-colors" onClick={() => router.push('/crm/polizas')}>
            <i className="fa-solid fa-magnifying-glass"></i> Buscar pólizas
          </button>
          <button className="flex gap-2 items-center px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md text-sm font-medium transition-colors">
            <i className="fa-solid fa-gear"></i> Opciones <i className="fa-solid fa-chevron-down text-xs ml-1"></i>
          </button>
        </div>
      </div>

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
                        <i className="fa-solid fa-magnifying-glass"></i>Detalles del plan
                      </button>
                      <button className="flex gap-2 items-center w-fit cursor-pointer justify-center rounded-md transition-colors py-2 font-medium bg-primary text-white hover:bg-primary/90 h-[30px] px-2 text-xs" type="button" onClick={() => setIsFinancialModalOpen(true)}>
                        <i className="fa-duotone fa-edit"></i>Editar
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
                    <div className="text-gray-700 dark:text-white text-sm font-normal break-all">-</div>
                  </div>
                  <div className="col-span-1 md:col-span-4 flex-col">
                    <div className="text-gray-700 dark:text-gray-300 text-sm font-medium">FFM utilizado en el mercado</div>
                    <div className="text-gray-700 dark:text-white text-sm font-normal break-all">-</div>
                  </div>
                  <div className="col-span-1 md:col-span-4 flex-col">
                    <div className="text-gray-700 dark:text-gray-300 text-sm font-medium">Fecha de cancelación</div>
                    <div className="text-gray-700 dark:text-white text-sm font-normal">-</div>
                  </div>
                  <div className="col-span-1 md:col-span-4 flex-col">
                    <div className="text-gray-700 dark:text-gray-300 text-sm font-medium">Nueva venta / Renovación</div>
                    <div className="text-gray-700 dark:text-white text-sm font-normal break-all">Venta nueva</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Family Members */}
            <div className="bg-white shadow-sm border-[1px] border-slate-100 rounded-lg dark:bg-slate-800 dark:border-slate-800 dark:shadow-none flex w-auto flex-col p-4 lg:p-4">
              <div className="flex items-center flex-wrap justify-between mb-2">
                <h2 className="text-gray-700 dark:text-white text-base font-semibold">Miembros de la familia</h2>
                <button
                  className="flex gap-2 items-center w-fit cursor-pointer justify-center rounded-md transition-colors py-1.5 font-medium bg-primary text-white hover:bg-primary/90 px-2 text-xs"
                  type="button"
                  onClick={() => {
                    setShowAddMemberCard((prev) => !prev);
                    setCurrentFamilyMember(null);
                  }}
                >
                  <i className="fa-solid fa-plus"></i>Agregar miembro
                </button>
              </div>
              <hr className="border-slate-200 dark:border-slate-600 flex-1 mx-2 mb-4" />

              {showAddMemberCard && poliza && (
                <AddFamilyMemberCard
                  poliza={poliza}
                  onClose={() => setShowAddMemberCard(false)}
                  onSaved={() => poliza.id && fetchPolizaById(poliza.id)}
                />
              )}
              
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex flex-col">
                    <h2 className="text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center gap-2">Total de aplicantes</h2>
                    <p className="dark:text-white text-base flex items-center gap-1 text-primary font-semibold">{aplicanteCount}</p>
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center gap-2">Total de miembros</h2>
                    <p className="dark:text-white text-base flex items-center gap-1 text-primary font-semibold">{familiaresCount}</p>
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center gap-2">Total de dependientes</h2>
                    <p className="dark:text-white text-base flex items-center gap-1 text-primary font-semibold">{dependientesCount}</p>
                  </div>
                </div>
              </div>

              {/* Miembros list - Using map based on API data */}
              <div className="flex flex-col gap-4">
                {clientesInfo.map((member) => (
                  <div key={member.id} className="border border-slate-200 dark:border-slate-700 rounded-md p-3 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center rounded-lg bg-blue-100 dark:bg-primary/20 w-10 h-10">
                        <i className="text-blue-500 dark:text-blue-400 fas fa-lg fa-user"></i>
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-primary font-medium">{member.cliente_details.primer_nombre} {member.cliente_details.apellido_paterno}</span>
                            <span className="text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded">
                              {member.relacion}
                            </span>
                            {member.es_solicitante_principal && (
                              <span className="text-xs flex items-center gap-1 text-green-600 dark:text-green-400">
                                <i className="fa-solid fa-check-circle"></i> Aplicante
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-7 text-xs border-primary text-primary hover:bg-primary/10 gap-1" onClick={() => { setCurrentFamilyMember(member); setIsFamilyModalOpen(true); }}>
                              <i className="fa-solid fa-edit text-[10px]"></i>Editar
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 w-7 p-0 border-primary text-primary hover:bg-primary/10">
                              <i className="fa-solid fa-chevron-down"></i>
                            </Button>
                          </div>
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                          {member.cliente_details.email || 'Sin correo'} • {member.cliente_details.telefono || 'Sin teléfono'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

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

            {/* Payment Info */}
            <div className="bg-white shadow-sm border-[1px] border-slate-100 rounded-lg dark:bg-slate-800 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-gray-700 dark:text-white text-base font-semibold">Información de pago</h2>
                <button
                  className="flex gap-2 items-center bg-primary text-white hover:bg-primary/90 h-[30px] px-2 text-xs rounded-md"
                  type="button"
                  onClick={() => setIsEditInfoPagoOpen(true)}
                >
                  <i className="fa-duotone fa-edit"></i>{infoPago ? 'Editar' : 'Agregar'}
                </button>
              </div>
              <hr className="border-slate-200 dark:border-slate-600 mx-2 mb-3" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Pago recurrente</div>
                  <div className="text-sm dark:text-white">{infoPago ? (infoPago.pago_recurrente ? 'Sí' : 'No') : '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Fecha del primer pago</div>
                  <div className="text-sm dark:text-white">{formatFechaDisplay(infoPago?.fecha_primer_pago)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Día de pago preferido</div>
                  <div className="text-sm dark:text-white">{infoPago?.dia_pago_preferido ?? '-'}</div>
                </div>
              </div>
            </div>

            {/* Payment Cards */}
            <div className="bg-white shadow-sm border-[1px] border-slate-100 rounded-lg dark:bg-slate-800 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-gray-700 dark:text-white text-base font-semibold">Tarjetas de pago</h2>
                <button className="flex gap-2 items-center bg-primary text-white hover:bg-primary/90 h-[30px] px-2 text-xs rounded-md" type="button" onClick={() => setIsAddCardModalOpen(true)}>
                  <i className="fa-solid fa-plus"></i>Agregar
                </button>
              </div>
              <hr className="border-slate-200 dark:border-slate-600 mx-2 mb-3" />
              {tarjetasPago.length === 0 ? (
                <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-md py-8 text-center flex flex-col items-center">
                  <i className="fa-solid fa-credit-card text-2xl text-gray-400 mb-2"></i>
                  <p className="font-medium dark:text-white">No se encontró información de la tarjeta</p>
                  <p className="text-sm dark:text-gray-400 mt-1">Aún no tienes ninguna tarjeta de crédito o débito asociada.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tarjetasPago.map((tarjeta: any) => (
                    <div key={tarjeta.id} className="border border-slate-200 dark:border-slate-700 rounded-md p-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-primary dark:text-white">
                          {tarjeta.tipo_tarjeta} {maskCardNumber(tarjeta.numero)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {tarjeta.nombre_titular} · Vence {tarjeta.fecha_vencimiento || 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bank Accounts */}
            <div className="bg-white shadow-sm border-[1px] border-slate-100 rounded-lg dark:bg-slate-800 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-gray-700 dark:text-white text-base font-semibold">Cuentas bancarias</h2>
                <button className="flex gap-2 items-center bg-primary text-white hover:bg-primary/90 h-[30px] px-2 text-xs rounded-md" type="button" onClick={() => setIsAddBankModalOpen(true)}>
                  <i className="fa-solid fa-plus"></i>Agregar
                </button>
              </div>
              <hr className="border-slate-200 dark:border-slate-600 mx-2 mb-3" />
              {cuentasBancarias.length === 0 ? (
                <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-md py-8 text-center flex flex-col items-center">
                  <i className="fa-solid fa-building-columns text-2xl text-gray-400 mb-2"></i>
                  <p className="font-medium dark:text-white">No se encontró información de la cuenta bancaria</p>
                  <p className="text-sm dark:text-gray-400 mt-1">Aún no tienes ninguna cuenta bancaria asociada.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cuentasBancarias.map((cuenta: any) => (
                    <div key={cuenta.id} className="border border-slate-200 dark:border-slate-700 rounded-md p-3">
                      <p className="text-sm font-medium text-primary dark:text-white">
                        {cuenta.nombre_banco} ****{String(cuenta.numero_cuenta || '').slice(-4)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {cuenta.titular_cuenta} · ABA {cuenta.aba_routing || 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

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

            {/* Doctors */}
            <div className="bg-white shadow-sm border-[1px] border-slate-100 rounded-lg dark:bg-slate-800 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-gray-700 dark:text-white text-base font-semibold">Información del médico principal</h2>
                <button
                  className="flex gap-2 items-center bg-primary text-white hover:bg-primary/90 h-[30px] px-2 text-xs rounded-md"
                  type="button"
                  onClick={openAddMedico}
                >
                  <i className="fa-duotone fa-plus"></i>
                  Agregar médico
                </button>
              </div>
              <hr className="border-slate-200 dark:border-slate-600 mx-2 mb-3" />

              {medicosPrincipales.length > 0 ? (
                <div className="space-y-3">
                  {medicosPrincipales.map((medico) => (
                    <div
                      key={medico.id}
                      className="rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/20 dark:to-slate-900/40 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          <i className="fa-solid fa-user-doctor text-lg"></i>
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <p className="text-sm font-medium text-slate-900 dark:text-white whitespace-pre-wrap">
                            {medico.nombre}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {medico.especializacion ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 dark:bg-slate-800 px-2.5 py-1 text-xs text-emerald-800 dark:text-emerald-200 border border-emerald-100 dark:border-emerald-900/50">
                                <i className="fa-solid fa-stethoscope text-[10px]"></i>
                                {medico.especializacion}
                              </span>
                            ) : null}
                            {medico.hospital ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                <i className="fa-solid fa-hospital text-[10px]"></i>
                                {medico.hospital}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openEditMedico(medico)}
                          className="flex gap-1.5 items-center text-primary hover:text-primary/80 text-xs font-medium shrink-0"
                        >
                          <i className="fa-duotone fa-edit"></i>
                          Editar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-md py-8 text-center">
                  <i className="fa-solid fa-user-doctor text-2xl text-emerald-300 dark:text-emerald-800 mb-2 block"></i>
                  <p className="text-sm font-medium dark:text-white">No hay médicos registrados</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Agrega el médico principal u otros especialistas.</p>
                </div>
              )}
            </div>

            {/* Medications */}
            <div className="bg-white shadow-sm border-[1px] border-slate-100 rounded-lg dark:bg-slate-800 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-gray-700 dark:text-white text-base font-semibold">Medicamentos necesarios</h2>
                <button
                  className="flex gap-2 items-center bg-primary text-white hover:bg-primary/90 h-[30px] px-2 text-xs rounded-md"
                  type="button"
                  onClick={openAddMedicamento}
                >
                  <i className="fa-duotone fa-plus"></i>
                  Agregar medicamento
                </button>
              </div>
              <hr className="border-slate-200 dark:border-slate-600 mx-2 mb-3" />

              {medicamentosLista.length > 0 ? (
                <div className="space-y-3">
                  {medicamentosLista.map((medicamento) => (
                    <div
                      key={medicamento.id}
                      className="relative overflow-hidden rounded-xl border border-violet-100 dark:border-violet-900/40 bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-violet-950/30 dark:via-slate-900 dark:to-indigo-950/20 p-5 shadow-sm"
                    >
                      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-violet-200/30 dark:bg-violet-800/20 blur-2xl" />
                      <div className="relative flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-md shadow-violet-200 dark:shadow-none">
                          <i className="fa-solid fa-pills text-xl"></i>
                        </div>
                        <div className="min-w-0 flex-1 space-y-3">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-300 mb-1">
                              Medicamento
                            </p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                              {medicamento.nombre}
                            </p>
                          </div>
                          {medicamento.dosis ? (
                            <div className="inline-flex items-center gap-2 rounded-lg bg-white/70 dark:bg-slate-800/80 border border-violet-100 dark:border-violet-900/50 px-3 py-2">
                              <i className="fa-solid fa-syringe text-violet-500 text-xs"></i>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-500 dark:text-violet-300">
                                  Dosis
                                </p>
                                <p className="text-sm text-slate-700 dark:text-slate-200">{medicamento.dosis}</p>
                              </div>
                            </div>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => openEditMedicamento(medicamento)}
                          className="flex gap-1.5 items-center text-primary hover:text-primary/80 text-xs font-medium shrink-0 relative z-10"
                        >
                          <i className="fa-duotone fa-edit"></i>
                          Editar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-violet-200 dark:border-violet-900/40 rounded-xl py-8 text-center bg-violet-50/30 dark:bg-violet-950/10">
                  <i className="fa-solid fa-pills text-2xl text-violet-300 dark:text-violet-700 mb-2 block"></i>
                  <p className="text-sm font-medium dark:text-white">No hay medicamentos registrados</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Agrega los medicamentos cubiertos por el seguro.</p>
                </div>
              )}
            </div>

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
      <EditFamilyMemberModal
        open={isFamilyModalOpen}
        onOpenChange={setIsFamilyModalOpen}
        member={currentFamilyMember}
        onSaved={() => poliza.id && fetchPolizaById(poliza.id)}
      />
      <AddCardModal
        open={isAddCardModalOpen}
        onOpenChange={setIsAddCardModalOpen}
        polizaId={poliza.id}
        onSaved={refreshPoliza}
      />
      <AddBankAccountModal
        open={isAddBankModalOpen}
        onOpenChange={setIsAddBankModalOpen}
        polizaId={poliza.id}
        onSaved={refreshPoliza}
      />
      <EditInfoPagoModal
        open={isEditInfoPagoOpen}
        onOpenChange={setIsEditInfoPagoOpen}
        polizaId={poliza.id}
        infoPago={infoPago}
        onSaved={refreshPoliza}
      />
      <EditMedicoPolizaModal
        open={medicoModalOpen}
        onOpenChange={setMedicoModalOpen}
        polizaId={poliza.id}
        medico={selectedMedico}
        onSaved={refreshPoliza}
      />
      <EditMedicamentoModal
        open={medicamentoModalOpen}
        onOpenChange={setMedicamentoModalOpen}
        polizaId={poliza.id}
        medicamento={selectedMedicamento}
        onSaved={refreshPoliza}
      />
      <EditFinancialModal open={isFinancialModalOpen} onOpenChange={setIsFinancialModalOpen} poliza={poliza} />
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

function AddCardModal({ open, onOpenChange, polizaId, onSaved }: { open: boolean, onOpenChange: (open: boolean) => void, polizaId: number, onSaved?: () => void }) {
  const { toast } = useToast();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      tipo_tarjeta: formData.get("tipo_tarjeta")?.toString() || 'VISA',
      numero: formData.get("numero")?.toString(),
      fecha_vencimiento: formData.get("fecha_vencimiento")?.toString(),
      cvv: formData.get("cvv")?.toString(),
      nombre_titular: formData.get("nombre_titular")?.toString(),
      poliza: polizaId,
    };
    try {
        await api.tarjetasCredito.create(data);
        toast({ title: "Éxito", description: "Tarjeta agregada correctamente." });
        onOpenChange(false);
        onSaved?.();
    } catch (error) {
        toast({ title: "Error", description: "Error al agregar la tarjeta.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Agregar Tarjeta de Pago</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="tipo_tarjeta">Tipo de tarjeta</Label>
            <select id="tipo_tarjeta" name="tipo_tarjeta" className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-slate-800 px-3 py-1 text-sm" defaultValue="VISA">
              <option value="VISA">VISA</option>
              <option value="MASTERCARD">Mastercard</option>
              <option value="AMEX">American Express</option>
              <option value="DISCOVER">Discover</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="nombre_titular">Nombre del Titular</Label>
            <Input id="nombre_titular" name="nombre_titular" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="numero">Número de Tarjeta</Label>
            <Input id="numero" name="numero" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fecha_vencimiento">Expiración (MM/YY)</Label>
              <Input id="fecha_vencimiento" name="fecha_vencimiento" placeholder="MM/YY" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input id="cvv" name="cvv" required />
            </div>
          </div>
          <DialogFooter><Button type="submit">Guardar Tarjeta</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddBankAccountModal({ open, onOpenChange, polizaId, onSaved }: { open: boolean, onOpenChange: (open: boolean) => void, polizaId: number, onSaved?: () => void }) {
  const { toast } = useToast();
  const [nombreBanco, setNombreBanco] = useState('');

  useEffect(() => {
    if (!open) setNombreBanco('');
  }, [open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nombre_banco: formData.get("nombre_banco")?.toString(),
      numero_cuenta: formData.get("numero_cuenta")?.toString(),
      aba_routing: formData.get("aba_routing")?.toString(),
      titular_cuenta: formData.get("titular_cuenta")?.toString(),
      poliza: polizaId,
    };
    try {
      await api.cuentasBancarias.create(data);
      toast({ title: "Éxito", description: "Cuenta bancaria agregada correctamente." });
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      toast({ title: "Error", description: "Error al agregar la cuenta bancaria.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Agregar Cuenta Bancaria</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="nombre_banco">Nombre del banco</Label>
            <UsBankCombobox
              id="nombre_banco"
              name="nombre_banco"
              value={nombreBanco}
              onChange={setNombreBanco}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="numero_cuenta">Número de cuenta</Label>
            <Input id="numero_cuenta" name="numero_cuenta" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="aba_routing">ABA / Routing</Label>
            <Input id="aba_routing" name="aba_routing" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="titular_cuenta">Titular de la cuenta</Label>
            <Input id="titular_cuenta" name="titular_cuenta" required />
          </div>
          <DialogFooter><Button type="submit">Guardar Cuenta</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditFinancialModal({ open, onOpenChange, poliza }: { open: boolean, onOpenChange: (open: boolean) => void, poliza: any }) {
  const { toast } = useToast();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updates = {
      prima_mensual: Number(formData.get('prima_mensual')),
      subsidio: Number(formData.get('subsidio')),
      costo_poliza: Number(formData.get('costo_poliza')),
    };
    try {
      await api.polizas.patch(poliza.id, updates);
      toast({ title: "Éxito", description: "Datos financieros actualizados correctamente." });
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron actualizar los datos.", variant: "destructive" });
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar Información Financiera</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2"><Label>Prima Mensual</Label><Input type="number" step="0.01" name="prima_mensual" defaultValue={poliza.prima_mensual} /></div>
          <div className="grid gap-2"><Label>Subsidio</Label><Input type="number" step="0.01" name="subsidio" defaultValue={poliza.subsidio} /></div>
          <div className="grid gap-2"><Label>Costo de la Póliza</Label><Input type="number" step="0.01" name="costo_poliza" defaultValue={poliza.costo_poliza} /></div>
          <DialogFooter><Button type="submit">Guardar</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

