'use client';

import React, { useState } from 'react';
import { CambiosDeVidaPanel } from './CambiosDeVidaPanel';
import { RegistrosActividadModal } from './RegistrosActividadModal';
import { UltimaNotaCard } from './UltimaNotaCard';
import { EditEstatusPolizaModal } from './EditEstatusPolizaModal';
import { EditEtiquetasPolizaModal } from './EditEtiquetasPolizaModal';
import { EditAgenteAsignadoModal } from './EditAgenteAsignadoModal';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  formatCurrencyValue,
  formatDireccion,
  formatFechaDisplay,
  getPrincipalMember,
} from './polizaUtils';
import {
  getEstadoDocumentoLabel,
  getEstadoPagoLabel,
  RemovableEtiquetaBadge,
  StatusBadge,
} from './polizaStatusUtils';
import type { NotaApi } from './notaUtils';
import { 
  FileText, 
  Folder,
  StickyNote,
  Bell,
  FileSignature,
  DollarSign,
  ClipboardList,
  Users,
  Stethoscope,
  List,
  Settings,
  Menu,
} from 'lucide-react';

interface PolizaResumenProps {
  poliza: {
    id?: number;
    id_mercado: string;
    id_miembro?: string;
    agente?: number | null;
    agente_nombre: string;
    agente_registro?: number | null;
    agente_registro_nombre?: string | null;
    plan_nombre: string;
    estado_nombre: string;
    estado?: number;
    estado_documento?: string | null;
    estado_pago?: string | null;
    info_pago_id?: number | null;
    prima_mensual: string;
    fecha_efectiva: string;
    cliente_principal: string;
    etiquetas?: { id: number; nombre: string; color?: string }[];
  };
  polizaContext?: {
    clientes_info?: any[];
    direccion_fisica_details?: any;
    direccion_postal_details?: any;
    direccion_facturacion_details?: any;
    documentos?: any[];
    notas?: NotaApi[];
  };
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  onPolizaUpdate?: (updatedData?: any) => void;
  onOpenNotasChat?: () => void;
}

export function PolizaResumen({ poliza, polizaContext, activeSection = 'poliza', onSectionChange, onPolizaUpdate, onOpenNotasChat }: PolizaResumenProps) {
  const [isCambiosVidaOpen, setIsCambiosVidaOpen] = useState(false);
  const [isRegistrosModalOpen, setIsRegistrosModalOpen] = useState(false);
  const [isEstatusModalOpen, setIsEstatusModalOpen] = useState(false);
  const [isEtiquetasModalOpen, setIsEtiquetasModalOpen] = useState(false);
  const [isAgenteModalOpen, setIsAgenteModalOpen] = useState(false);
  const [removingEtiquetaId, setRemovingEtiquetaId] = useState<number | null>(null);
  const { toast } = useToast();

  const principalMember = getPrincipalMember(polizaContext?.clientes_info);
  const principalDetails = principalMember?.cliente_details;
  const aplicanteCount = (polizaContext?.clientes_info || []).filter((m) => m.es_solicitante_principal).length;

  const handleEstatusUpdated = () => {
    onPolizaUpdate?.();
  };

  const handleEtiquetasUpdated = () => {
    onPolizaUpdate?.();
  };

  const handleAgenteUpdated = () => {
    onPolizaUpdate?.();
  };

  const handleRemoveEtiqueta = async (etiquetaId: number) => {
    if (!poliza.id) return;
    const currentEtiquetas = poliza.etiquetas || [];
    const newEtiquetasIds = currentEtiquetas.filter(etq => etq.id !== etiquetaId).map(etq => etq.id);

    setRemovingEtiquetaId(etiquetaId);
    try {
      await api.polizas.patch(poliza.id, { etiquetas_ids: newEtiquetasIds });
      toast({ title: "Éxito", description: "Etiqueta removida." });
      if (onPolizaUpdate) {
        onPolizaUpdate({ etiquetas: currentEtiquetas.filter(etq => etq.id !== etiquetaId) });
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudo remover la etiqueta.", variant: "destructive" });
    } finally {
      setRemovingEtiquetaId(null);
    }
  };

  const navItems = [
    { id: 'poliza', icon: <i className="fa-duotone fa-shield-halved"></i>, label: 'Póliza' },
    { id: 'documentos', icon: <i className="fa-duotone fa-folder"></i>, label: 'Documentos', count: polizaContext?.documentos?.length ?? 0 },
    { id: 'notas', icon: <i className="fa-duotone fa-sticky-note"></i>, label: 'Notas', count: polizaContext?.notas?.length ?? 0, isChat: true },
    { id: 'recordatorios', icon: <i className="fa-duotone fa-bell-on"></i>, label: 'Recordatorios', count: 0 },
    { id: 'formularios', icon: <i className="fa-duotone fa-file-signature"></i>, label: 'Formularios de Firma', count: 0 },
    { id: 'direcciones', icon: <i className="fa-duotone fa-location-dot"></i>, label: 'Direcciones' },
    { id: 'cambios', icon: <i className="fa-duotone ml-0.5 fa-family"></i>, label: 'Cambios de vida', isPanel: true },
    { id: 'citas', icon: <i className="fa-duotone ml-0.5 fa-user-doctor-hair"></i>, label: 'Citas médicas' },
    { id: 'registros', icon: <i className="fa-duotone fa-list"></i>, label: 'Registros', isModal: true },
  ];

  return (
    <>
      <div className="flex flex-col lg:gap-4 lg:w-fit">
        <div className="relative w-auto">
          {/* Main Sidebar Card */}
          <div className="bg-white p-4 lg:p-6 shadow-sm border-[1px] border-slate-100 rounded-lg dark:bg-slate-800 dark:border-slate-800 dark:shadow-none hidden lg:flex flex-col w-full md:w-72 py-4 lg:py-4 lg:px-3 h-fit">
            
            {/* Resumen */}
            <div className="flex flex-col gap-1 py-3 pt-1">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-1 mb-1.5">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Resumen</p>
              </div>
              <div className="flex justify-between items-center w-full gap-2">
                <p className="text-gray-700 dark:text-white text-sm flex items-center gap-1 font-medium shrink-0">Registrado por:</p>
                <p
                  className="text-gray-700 dark:text-white text-sm font-normal truncate max-w-[140px]"
                  title={poliza.agente_registro_nombre || undefined}
                >
                  {poliza.agente_registro_nombre || 'Sin registrar'}
                </p>
              </div>
              <div className="relative flex items-center justify-between gap-4 w-full">
                <hr className="flex-1 mx-2 my-1 dark:border-slate-600 border-slate-100" />
              </div>
              <div className="flex flex-col w-full gap-2">
                <div className="flex justify-between items-center w-full gap-2">
                  <p className="text-gray-700 dark:text-white text-sm font-medium shrink-0">Asignado a:</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsAgenteModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    <i className="fa-solid fa-edit text-[10px]" />
                    Editar
                  </button>
                </div>
                <div className="flex items-center justify-end pl-0.5">
                  <p
                    className="text-[11px] font-semibold text-[#334155] dark:text-slate-200 uppercase truncate max-w-full"
                    title={poliza.agente_nombre || undefined}
                  >
                    {poliza.agente_nombre || 'Sin agente'}
                  </p>
                </div>
              </div>
              <div className="relative flex items-center justify-between gap-4 w-full">
                <hr className="flex-1 mx-2 my-1 dark:border-slate-600 border-slate-100" />
              </div>
              <div className="flex flex-wrap justify-between items-center w-full">
                <p className="text-gray-700 dark:text-white text-sm font-medium">Código interno:</p>
                <p className="text-gray-700 dark:text-white text-sm font-normal truncate max-w-[120px]" title={poliza.id_mercado}>{poliza.id_mercado || '-'}</p>
              </div>
              <div className="relative flex items-center justify-between gap-4 w-full">
                <hr className="flex-1 mx-2 my-1 dark:border-slate-600 border-slate-100" />
              </div>
              <div className="flex flex-wrap justify-between items-center w-full">
                <p className="text-gray-700 dark:text-white text-sm font-medium">Aseguradora:</p>
                <p className="text-gray-700 dark:text-white text-sm font-normal">{poliza.plan_nombre || '-'}</p>
              </div>
              <div className="relative flex items-center justify-between gap-4 w-full">
                <hr className="flex-1 mx-2 my-1 dark:border-slate-600 border-slate-100" />
              </div>
              <div className="flex flex-wrap justify-between items-center w-full">
                <p className="text-gray-700 dark:text-white text-sm font-medium">Efectividad:</p>
                <p className="text-gray-700 dark:text-white text-sm font-normal">{poliza.fecha_efectiva ? new Date(poliza.fecha_efectiva).toLocaleDateString() : '-'}</p>
              </div>
              <div className="relative flex items-center justify-between gap-4 w-full">
                <hr className="flex-1 mx-2 my-1 dark:border-slate-600 border-slate-100" />
              </div>
              <div className="flex flex-wrap justify-between items-center w-full">
                <p className="text-gray-700 dark:text-white text-sm font-medium">Número aplicantes:</p>
                <p className="text-gray-700 dark:text-white text-sm font-normal">{aplicanteCount || 0}</p>
              </div>
              <div className="relative flex items-center justify-between gap-4 w-full">
                <hr className="flex-1 mx-2 my-1 dark:border-slate-600 border-slate-100" />
              </div>
              <div className="flex flex-col w-full gap-2">
                <div className="flex justify-between items-center w-full gap-2">
                  <p className="text-gray-700 dark:text-white text-sm font-medium shrink-0">Estatus:</p>
                  <button
                    type="button"
                    onClick={() => setIsEstatusModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    <i className="fa-solid fa-edit text-[10px]" />
                    Editar
                  </button>
                </div>
                <div className="flex flex-col gap-1.5 pl-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#64748b] dark:text-slate-400">Póliza</span>
                    <StatusBadge label={poliza.estado_nombre || 'Sin estatus'} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#64748b] dark:text-slate-400">Documento</span>
                    <StatusBadge label={getEstadoDocumentoLabel(poliza.estado_documento)} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#64748b] dark:text-slate-400">Pago</span>
                    <StatusBadge label={getEstadoPagoLabel(poliza.estado_pago)} />
                  </div>
                </div>
              </div>
              <div className="relative flex items-center justify-between gap-4 w-full">
                <hr className="flex-1 mx-2 my-1 dark:border-slate-600 border-slate-100" />
              </div>
              <div className="flex flex-col w-full gap-2">
                <div className="flex justify-between items-center w-full gap-2">
                  <p className="text-gray-700 dark:text-white text-sm font-medium shrink-0">Etiquetas:</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsEtiquetasModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    <i className="fa-solid fa-edit text-[10px]" />
                    Editar
                  </button>
                </div>
                <div className="flex flex-col gap-1.5 pl-0.5">
                  {poliza.etiquetas && poliza.etiquetas.length > 0 ? (
                    poliza.etiquetas.map((etq) => (
                      <div key={etq.id} className="flex items-center justify-end">
                        <RemovableEtiquetaBadge
                          label={etq.nombre}
                          color={etq.color}
                          onRemove={() => handleRemoveEtiqueta(etq.id)}
                          removing={removingEtiquetaId === etq.id}
                        />
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-[#64748b] dark:text-slate-400 text-right">Sin etiquetas</p>
                  )}
                </div>
              </div>
              <div className="relative flex items-center justify-between gap-4 w-full">
                <hr className="flex-1 mx-2 my-1 dark:border-slate-600 border-slate-100" />
              </div>
              <div className="flex flex-wrap justify-between items-center w-full">
                <p className="text-gray-700 dark:text-white text-sm flex items-center gap-1 font-medium">Carpeta personal:</p>
                <p className="text-gray-700 dark:text-white text-sm font-normal">-</p>
              </div>
              <div className="relative flex items-center justify-between gap-4 w-full">
                <hr className="flex-1 mx-2 my-1 dark:border-slate-600 border-slate-100" />
              </div>
              <div className="flex flex-wrap justify-between items-center w-full">
                <p className="text-gray-700 dark:text-white text-sm font-medium">Última actualización:</p>
                <p className="text-gray-700 dark:text-white text-xs font-normal">Hoy</p>
              </div>
            </div>

            {/* Información del Hogar */}
            <div className="flex flex-col gap-1 py-3">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-1 mb-1.5">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Información del hogar</p>
              </div>
              <div className="flex flex-wrap justify-between items-center w-full">
                <div className="flex flex-wrap justify-between w-full">
                  <p className="text-gray-700 dark:text-white text-sm flex items-center gap-1 font-medium">Titular:</p>
                  <p className="text-gray-700 dark:text-white text-sm font-normal flex items-center gap-1 truncate max-w-[150px]">
                    {poliza.cliente_principal || '-'}
                  </p>
                </div>
              </div>
              <div className="relative flex items-center justify-between gap-4 w-full">
                <hr className="flex-1 mx-2 my-1 dark:border-slate-600 border-slate-100" />
              </div>
              <div className="flex flex-wrap justify-between items-center w-full">
                <div className="flex flex-wrap items-center justify-between w-full">
                  <div className="text-gray-700 dark:text-white text-sm font-medium flex items-center gap-1">Fecha nacimiento</div>
                  <div className="text-gray-700 dark:text-white text-sm font-normal flex items-center gap-1">
                    {formatFechaDisplay(principalDetails?.fecha_nacimiento)}
                  </div>
                </div>
              </div>
              <div className="relative flex items-center justify-between gap-4 w-full">
                <hr className="flex-1 mx-2 my-1 dark:border-slate-600 border-slate-100" />
              </div>
              <div className="flex flex-wrap justify-between items-center w-full">
                <div className="flex flex-wrap justify-between w-full">
                  <p className="text-gray-700 dark:text-white text-sm font-medium">Teléfono</p>
                  <p className="text-gray-700 dark:text-white text-sm font-normal">{principalDetails?.telefono || '-'}</p>
                </div>
              </div>
              <div className="relative flex items-center justify-between gap-4 w-full">
                <hr className="flex-1 mx-2 my-1 dark:border-slate-600 border-slate-100" />
              </div>
              <div className="flex flex-wrap justify-between items-center w-full">
                <div className="flex flex-wrap justify-between w-full">
                  <p className="text-gray-700 dark:text-white text-sm font-medium">Correo</p>
                  <p className="text-gray-700 dark:text-white text-sm font-normal break-all text-right max-w-[160px]">{principalDetails?.email || '-'}</p>
                </div>
              </div>
              <div className="relative flex items-center justify-between gap-4 w-full">
                <hr className="flex-1 mx-2 my-1 dark:border-slate-600 border-slate-100" />
              </div>
              <div className="flex flex-wrap justify-between items-center w-full">
                <p className="text-gray-700 dark:text-white text-sm font-medium">Ubicación:</p>
                <p className="text-gray-700 dark:text-white text-sm font-normal break-words max-w-[160px] text-right">
                  {formatDireccion(polizaContext?.direccion_fisica_details)}
                </p>
              </div>
              <div className="relative flex items-center justify-between gap-4 w-full">
                <hr className="flex-1 mx-2 my-1 dark:border-slate-600 border-slate-100" />
              </div>
              <div className="flex flex-wrap justify-between items-center w-full">
                <div className="flex flex-wrap justify-between w-full">
                  <p className="text-gray-700 dark:text-white text-sm font-medium">Ingresos anuales</p>
                  <div className="flex items-center">
                    <p className="text-gray-700 dark:text-white text-sm font-normal break-words max-w-full">
                      {formatCurrencyValue(principalDetails?.ingreso_anual)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative flex items-center justify-between gap-4 w-full">
                <hr className="flex-1 mx-2 my-1 dark:border-slate-600 border-slate-100" />
              </div>
              <div className="flex flex-wrap justify-between items-center w-full">
                <p className="text-gray-700 dark:text-white text-sm font-medium">ID miembro:</p>
                <p className="text-gray-700 dark:text-white text-sm font-normal break-words max-w-full">{poliza.id_miembro || '-'}</p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-col gap-1 mt-2">
              {navItems.map((item) => (
                <div 
                  key={item.id}
                  className={`flex items-center group font-normal rounded-lg transition-colors cursor-pointer ${
                    activeSection === item.id 
                      ? 'bg-blue-100 dark:bg-primary/20' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                  onClick={() => {
                    if (item.isChat) {
                      onOpenNotasChat?.();
                    } else if (item.isPanel) {
                      setIsCambiosVidaOpen(true);
                    } else if (item.isModal) {
                      setIsRegistrosModalOpen(true);
                    } else {
                      onSectionChange?.(item.id);
                    }
                  }}
                >
                  <div className="flex flex-1 items-center font-normal w-full">
                    <span className={`px-3 py-2 gap-4 w-11 h-10 flex justify-start items-center rounded-md ${
                      activeSection === item.id 
                        ? 'text-primary dark:text-blue-400' 
                        : 'text-slate-500 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-white'
                    }`}>
                      {item.icon}
                    </span>
                    <div className="flex justify-between items-center flex-1 pr-2">
                      <span className={`text-sm text-left ${
                        activeSection === item.id 
                          ? 'text-primary dark:text-white font-medium' 
                          : 'text-gray-700 dark:text-slate-300 group-hover:text-primary dark:group-hover:text-white'
                      }`}>
                        {item.label}
                      </span>
                      {item.count !== undefined && (
                        <span className="w-fit inline-flex gap-2 items-center justify-center rounded-md px-1 py-0.5 text-xs font-medium bg-slate-50 text-slate-500 ring-1 ring-inset ring-gray-600/20 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-600 ml-2">
                          {item.count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
          
          <button className="items-center w-fit cursor-pointer justify-center rounded-md transition-colors py-2 font-medium bg-primary text-white hover:bg-primary/90 h-[34px] px-2.5 text-xs fixed bottom-4 flex lg:hidden gap-1 left-4 z-20 shadow-lg" type="button">
            <Menu className="w-4 h-4" /> Menú
          </button>
        </div>

        {/* Última Nota */}
        <div className="bg-white p-4 lg:p-6 shadow-sm border-[1px] border-slate-100 rounded-lg dark:bg-slate-800 dark:border-slate-800 hidden lg:flex flex-col lg:w-72 py-4 lg:py-4 lg:px-3">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-1 mb-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Última nota</p>
          </div>
          <UltimaNotaCard notas={polizaContext?.notas} variant="sidebar" />
        </div>
      </div>

      {poliza.id && (
        <CambiosDeVidaPanel
          isOpen={isCambiosVidaOpen}
          onClose={() => setIsCambiosVidaOpen(false)}
          polizaId={poliza.id}
          polizaContext={polizaContext}
          polizaInfo={{
            cliente: poliza.cliente_principal,
            id_mercado: poliza.id_mercado,
          }}
        />
      )}
      
      <RegistrosActividadModal 
        isOpen={isRegistrosModalOpen}
        onClose={() => setIsRegistrosModalOpen(false)}
        polizaId={poliza.id_mercado}
      />

      {poliza.id ? (
        <EditEstatusPolizaModal
          open={isEstatusModalOpen}
          onOpenChange={setIsEstatusModalOpen}
          polizaId={poliza.id}
          estado={poliza.estado}
          estadoNombre={poliza.estado_nombre}
          estadoDocumento={poliza.estado_documento}
          infoPagoId={poliza.info_pago_id}
          estadoPago={poliza.estado_pago}
          onUpdated={handleEstatusUpdated}
        />
      ) : null}

      {poliza.id != null ? (
        <EditAgenteAsignadoModal
          open={isAgenteModalOpen}
          onOpenChange={setIsAgenteModalOpen}
          polizaId={poliza.id}
          agente={poliza.agente}
          agenteNombre={poliza.agente_nombre}
          onUpdated={handleAgenteUpdated}
        />
      ) : null}

      {poliza.id != null ? (
        <EditEtiquetasPolizaModal
          open={isEtiquetasModalOpen}
          onOpenChange={setIsEtiquetasModalOpen}
          polizaId={poliza.id}
          etiquetas={poliza.etiquetas}
          onUpdated={handleEtiquetasUpdated}
        />
      ) : null}
    </>
  );
}