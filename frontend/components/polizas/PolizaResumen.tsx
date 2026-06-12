'use client';

import React, { useState, useEffect } from 'react';
import { NotasChat } from '@/components/notas/NotasChat';
import { RegistrosActividadModal } from './RegistrosActividadModal';
import { api, etiquetasApi, estadosPolizaApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
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
  Info
} from 'lucide-react';

interface PolizaResumenProps {
  poliza: {
    id?: number;
    id_mercado: string;
    agente_nombre: string;
    plan_nombre: string;
    estado_nombre: string;
    estado?: number;
    prima_mensual: string;
    fecha_efectiva: string;
    cliente_principal: string;
    etiquetas?: { id: number; nombre: string; color?: string }[];
  };
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  onPolizaUpdate?: (updatedData: any) => void;
}

export function PolizaResumen({ poliza, activeSection = 'poliza', onSectionChange, onPolizaUpdate }: PolizaResumenProps) {
  const [isNotasChatOpen, setIsNotasChatOpen] = useState(false);
  const [isRegistrosModalOpen, setIsRegistrosModalOpen] = useState(false);
  const [allEtiquetas, setAllEtiquetas] = useState<{id: number, nombre: string}[]>([]);
  const [allEstados, setAllEstados] = useState<{id: number, nombre: string}[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [etiquetasRes, estadosRes] = await Promise.all([
          etiquetasApi.list(),
          estadosPolizaApi.list()
        ]);
        setAllEtiquetas(etiquetasRes.filter((e: any) => e.tipo === 'POLIZA'));
        setAllEstados(estadosRes);
      } catch (error) {
        console.error("Error fetching data for resumen", error);
      }
    };
    fetchData();
  }, []);

  const handleEstadoChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!poliza.id) return;
    const newEstadoId = parseInt(e.target.value);
    try {
      await api.polizas.patch(poliza.id, { estado: newEstadoId });
      toast({ title: "Éxito", description: "Estado de póliza actualizado." });
      if (onPolizaUpdate) {
        const estadoObj = allEstados.find(est => est.id === newEstadoId);
        onPolizaUpdate({ estado: newEstadoId, estado_nombre: estadoObj?.nombre || poliza.estado_nombre });
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudo actualizar el estado.", variant: "destructive" });
    }
  };

  const handleEtiquetaChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!poliza.id) return;
    const newEtiquetaId = parseInt(e.target.value);
    if (!newEtiquetaId) return; // if they select empty
    
    // Check if it already has this label
    const currentEtiquetas = poliza.etiquetas || [];
    if (currentEtiquetas.some(etq => etq.id === newEtiquetaId)) {
      toast({ description: "La póliza ya tiene esta etiqueta." });
      return;
    }

    const newEtiquetasIds = [...currentEtiquetas.map(etq => etq.id), newEtiquetaId];
    
    try {
      await api.polizas.patch(poliza.id, { etiquetas_ids: newEtiquetasIds });
      toast({ title: "Éxito", description: "Etiqueta agregada." });
      if (onPolizaUpdate) {
        const newEtiquetaObj = allEtiquetas.find(etq => etq.id === newEtiquetaId);
        if (newEtiquetaObj) {
          onPolizaUpdate({ etiquetas: [...currentEtiquetas, newEtiquetaObj] });
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudo agregar la etiqueta.", variant: "destructive" });
    }
  };

  const handleRemoveEtiqueta = async (etiquetaId: number) => {
    if (!poliza.id) return;
    const currentEtiquetas = poliza.etiquetas || [];
    const newEtiquetasIds = currentEtiquetas.filter(etq => etq.id !== etiquetaId).map(etq => etq.id);
    
    try {
      await api.polizas.patch(poliza.id, { etiquetas_ids: newEtiquetasIds });
      toast({ title: "Éxito", description: "Etiqueta removida." });
      if (onPolizaUpdate) {
        onPolizaUpdate({ etiquetas: currentEtiquetas.filter(etq => etq.id !== etiquetaId) });
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudo remover la etiqueta.", variant: "destructive" });
    }
  };

  const formatCurrency = (amount: string) => {
    const numAmount = parseFloat(amount || '0');
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(numAmount);
  };

  const navItems = [
    { id: 'poliza', icon: <i className="fa-duotone fa-shield-halved"></i>, label: 'Póliza' },
    { id: 'documentos', icon: <i className="fa-duotone fa-folder"></i>, label: 'Documentos', count: 1 },
    { id: 'notas', icon: <i className="fa-duotone fa-sticky-note"></i>, label: 'Notas', count: 0, isChat: true },
    { id: 'recordatorios', icon: <i className="fa-duotone fa-bell-on"></i>, label: 'Recordatorios', count: 0 },
    { id: 'formularios', icon: <i className="fa-duotone fa-file-signature"></i>, label: 'Formularios de Firma', count: 0 },
    { id: 'comisiones', icon: <i className="fa-duotone fa-sack-dollar"></i>, label: 'Comisiones' },
    { id: 'tareas', icon: <i className="fa-duotone ml-0.5 fa-clipboard-list-check"></i>, label: 'Tareas' },
    { id: 'cambios', icon: <i className="fa-duotone ml-0.5 fa-family"></i>, label: 'Cambios de vida' },
    { id: 'citas', icon: <i className="fa-duotone ml-0.5 fa-user-doctor-hair"></i>, label: 'Citas médicas' },
    { id: 'registros', icon: <i className="fa-duotone fa-list"></i>, label: 'Registros', isModal: true },
    { id: 'configuracion', icon: <i className="fa-duotone fa-gear"></i>, label: 'Configuración' }
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
              <div className="flex flex-wrap justify-between items-center w-full">
                <p className="text-gray-700 dark:text-white text-sm flex items-center gap-1 font-medium">Agente:</p>
                <p className="text-gray-700 dark:text-white text-sm font-normal">{poliza.agente_nombre || '-'}</p>
              </div>
              <div className="relative flex items-center justify-between gap-4 w-full">
                <hr className="flex-1 mx-2 my-1 dark:border-slate-600 border-slate-100" />
              </div>
              <div className="flex flex-wrap justify-between items-center w-full">
                <p className="text-gray-700 dark:text-white text-sm flex items-center gap-1 font-medium">Asignado a:</p>
                <p className="text-gray-700 dark:text-white text-sm font-normal">-</p>
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
                <p className="text-gray-700 dark:text-white text-sm font-normal">1</p>
              </div>
              <div className="relative flex items-center justify-between gap-4 w-full">
                <hr className="flex-1 mx-2 my-1 dark:border-slate-600 border-slate-100" />
              </div>
              <div className="flex justify-between items-center w-full">
                <p className="text-gray-700 dark:text-white text-sm flex items-center gap-1 font-medium">Estatus:</p>
                <select 
                  value={poliza.estado || ''} 
                  onChange={handleEstadoChange}
                  className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-xs py-1 px-2 text-gray-700 dark:text-white w-[140px] outline-none focus:ring-1 focus:ring-primary h-[28px]"
                >
                  {poliza.estado ? null : <option value="" disabled>{poliza.estado_nombre || 'Seleccionar'}</option>}
                  {allEstados.map(est => (
                    <option key={est.id} value={est.id}>{est.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="relative flex items-center justify-between gap-4 w-full">
                <hr className="flex-1 mx-2 my-1 dark:border-slate-600 border-slate-100" />
              </div>
              <div className="flex flex-col w-full gap-2">
                <div className="flex justify-between items-center w-full">
                  <p className="text-gray-700 dark:text-white text-sm font-medium">Etiquetas:</p>
                  <select 
                    onChange={handleEtiquetaChange} 
                    value=""
                    className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-xs py-1 px-2 text-gray-700 dark:text-white w-[140px] outline-none focus:ring-1 focus:ring-primary h-[28px]"
                  >
                    <option value="" disabled>Seleccionar</option>
                    {allEtiquetas.map(etq => (
                      <option key={etq.id} value={etq.id}>{etq.nombre}</option>
                    ))}
                  </select>
                </div>
                {poliza.etiquetas && poliza.etiquetas.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {poliza.etiquetas.map((etq) => (
                      <span key={etq.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: etq.color || '#e2e8f0', color: '#1e293b' }}>
                        {etq.nombre}
                        <button type="button" onClick={() => handleRemoveEtiqueta(etq.id)} className="hover:text-red-500 ml-1">
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
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
                  <div className="text-gray-700 dark:text-white text-sm font-normal flex items-center gap-1">-</div>
                </div>
              </div>
              <div className="relative flex items-center justify-between gap-4 w-full">
                <hr className="flex-1 mx-2 my-1 dark:border-slate-600 border-slate-100" />
              </div>
              <div className="flex flex-wrap justify-between items-center w-full">
                <div className="flex flex-wrap justify-between w-full">
                  <p className="text-gray-700 dark:text-white text-sm font-medium">Teléfono</p>
                  <p className="text-gray-700 dark:text-white text-sm font-normal">-</p>
                </div>
              </div>
              <div className="relative flex items-center justify-between gap-4 w-full">
                <hr className="flex-1 mx-2 my-1 dark:border-slate-600 border-slate-100" />
              </div>
              <div className="flex flex-wrap justify-between items-center w-full">
                <div className="flex flex-wrap justify-between w-full">
                  <p className="text-gray-700 dark:text-white text-sm font-medium">Correo</p>
                  <p className="text-gray-700 dark:text-white text-sm font-normal">-</p>
                </div>
              </div>
              <div className="relative flex items-center justify-between gap-4 w-full">
                <hr className="flex-1 mx-2 my-1 dark:border-slate-600 border-slate-100" />
              </div>
              <div className="flex flex-wrap justify-between items-center w-full">
                <p className="text-gray-700 dark:text-white text-sm font-medium">Ubicación:</p>
                <p className="text-gray-700 dark:text-white text-sm font-normal break-words max-w-full">-</p>
              </div>
              <div className="relative flex items-center justify-between gap-4 w-full">
                <hr className="flex-1 mx-2 my-1 dark:border-slate-600 border-slate-100" />
              </div>
              <div className="flex flex-wrap justify-between items-center w-full">
                <div className="flex flex-wrap justify-between w-full">
                  <p className="text-gray-700 dark:text-white text-sm font-medium">Ingresos anuales</p>
                  <div className="flex items-center">
                    <p className="text-gray-700 dark:text-white text-sm font-normal break-words max-w-full">-</p>
                  </div>
                </div>
              </div>
              <div className="relative flex items-center justify-between gap-4 w-full">
                <hr className="flex-1 mx-2 my-1 dark:border-slate-600 border-slate-100" />
              </div>
              <div className="flex flex-wrap justify-between items-center w-full">
                <p className="text-gray-700 dark:text-white text-sm font-medium">ID miembro:</p>
                <p className="text-gray-700 dark:text-white text-sm font-normal break-words max-w-full">-</p>
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
                      setIsNotasChatOpen(true);
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
          <div className="p-3 shadow-sm border-[1px] border-slate-100 rounded-lg dark:bg-slate-800 dark:border-slate-700 !py-2 !px-3 w-full flex gap-3 bg-blue-50 dark:bg-slate-700">
            <Info className="w-4 h-4 mt-0.5 text-blue-500 dark:text-blue-400 shrink-0" />
            <p className="text-gray-700 dark:text-gray-300 text-xs font-normal">
              Todavía no se han creado notas para esta póliza.
            </p>
          </div>
        </div>
      </div>

      <NotasChat 
        isOpen={isNotasChatOpen}
        onClose={() => setIsNotasChatOpen(false)}
        polizaInfo={{
          cliente: poliza.cliente_principal,
          plan: poliza.plan_nombre,
          id: String(poliza.id || poliza.id_mercado)
        }}
      />
      
      <RegistrosActividadModal 
        isOpen={isRegistrosModalOpen}
        onClose={() => setIsRegistrosModalOpen(false)}
        polizaId={poliza.id_mercado}
      />
    </>
  );
}