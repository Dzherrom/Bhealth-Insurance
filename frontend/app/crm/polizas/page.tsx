'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePolizaStore } from '@/store/polizaStore';
import { Poliza, PolizaFilters } from '@/components/polizas/types';
import { CrearPolizaModal } from '@/components/polizas/formularios/CrearPolizaModal';
import { useAuthStore } from '@/store/authStore';
import { StatusBadge, getEstadoDocumentoLabel, getEstadoPagoLabel } from '@/components/polizas/polizaStatusUtils';
import { useToast } from '@/hooks/use-toast';
import { usePermission } from '@/hooks/use-permission';
import { polizasApi } from '@/lib/api';

import {
  Search,
  Settings,
  Plus,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronUp,
  Edit2,
  Copy,
  UserPlus,
  BellRing,
  FileSignature,
  FileClock,
  Archive,
  ArrowUpDown
} from 'lucide-react';
import { PagedNumberPagination } from '@/components/ui/paged-number-pagination';

export default function PolizasPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isManagerOrAbove } = usePermission();
  const canArchive = isManagerOrAbove;
  const { user, updateSelectedYears } = useAuthStore();
  const {
    polizas: polizasData,
    isLoading,
    fetchPolizas,
    page,
    pageSize,
    totalPolizas,
    setPage,
  } = usePolizaStore();
  
  const selectedYears = user?.profile?.settings?.selectedYears ?? [];
  const yearsString = selectedYears.join(',');

  const [filters, setFilters] = useState<PolizaFilters>({
    search: '', status: 'all', plan: 'all', agente: 'all', user: 'all',
    groupOfUsers: 'all', assignedTo: 'all', role: 'all', referredByAgency: 'all',
    referredToAgency: 'all', state: 'all', zipCode: '', carrier: 'all',
    memberId: 'all', productType: 'all', documentsStatus: 'all', paymentStatus: 'all', saleType: 'all',
  });

  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const fetchPolizasRef = useRef(fetchPolizas);
  useEffect(() => {
    fetchPolizasRef.current = fetchPolizas;
  }, [fetchPolizas]);

  useEffect(() => {
    fetchPolizasRef.current({
      effective_years: selectedYears.length > 0 ? selectedYears : undefined,
      incluir_archivadas: showArchived ? '1' : undefined,
      archivada: showArchived ? '1' : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, yearsString, showArchived]);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const safePolizasData = Array.isArray(polizasData) ? polizasData : [];
  const polizas: Poliza[] = safePolizasData.map(p => ({
    id: p.id!,
    id_mercado: p.id_mercado,
    id_miembro: p.id_miembro,
    agente_nombre: p.agente_nombre,
    agente_npn: p.agente_npn,
    asistente_nombre: p.asistente_nombre,
    asistente_npn: p.asistente_npn,
    plan_nombre: p.plan_nombre,
    estado_nombre: p.estado_nombre,
    estado_documento: p.estado_documento,
    estado_documento_display: p.estado_documento_display,
    estado_pago: p.estado_pago,
    estado_pago_display: p.estado_pago_display,
    prima_mensual: parseFloat(p.prima_mensual ?? '0'),
    fecha_efectiva: p.fecha_efectiva,
    costo_poliza: parseFloat(p.costo_poliza ?? '0'),
    cliente_principal: p.cliente_principal,
    fecha_creacion: p.fecha_creacion ?? '',
  }));

  const filteredPolizas = polizas.filter(poliza => {
    const searchLower = filters.search.toLowerCase();
    const str = (poliza.id_mercado || '') + ' ' + (poliza.cliente_principal || '') + ' ' + (poliza.agente_nombre || '');
    return str.toLowerCase().includes(searchLower);
  });

  const totalPages = Math.max(1, Math.ceil(totalPolizas / pageSize));
  
  const handleViewPoliza = (id: number) => {
    router.push(`/crm/polizas/${id}`);
  };

  const handleRefresh = async () => {
    await fetchPolizas({
      effective_years: selectedYears.length > 0 ? selectedYears : undefined,
      incluir_archivadas: showArchived ? '1' : undefined,
      archivada: showArchived ? '1' : undefined,
    });
  };

  const handleArchivePoliza = async (e: React.MouseEvent, polizaId: number) => {
    e.stopPropagation();
    setOpenDropdownId(null);
    if (!window.confirm('¿Archivar esta póliza? Permanece en el sistema pero se oculta del listado principal.')) {
      return;
    }
    try {
      await polizasApi.archivar(polizaId);
      toast({ title: 'Póliza archivada' });
      await handleRefresh();
    } catch (err) {
      toast({
        title: 'Error al archivar',
        description: err instanceof Error ? err.message : 'No se pudo archivar',
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    router.push('/crm/polizas/export');
  };
  
  const handleYearChange = (year: string) => {
    const newYears = selectedYears.includes(year)
      ? selectedYears.filter(y => y !== year)
      : [...selectedYears, year];
    updateSelectedYears(newYears);
  };

  const toggleDropdown = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setOpenDropdownId(prev => prev === id ? null : id);
  };

  return (
    <div className="app-page w-full h-full flex flex-col overflow-hidden">
      
      {/* Top Navbar */}
      <header className="px-[30px] md:px-[40px] py-[15px] flex items-center justify-end bg-white dark:bg-[#1e293b] border-b border-[#f1f5f9] dark:border-[#334155] shrink-0 sticky top-0 z-[1] shadow-sm">
        <div className="flex flex-wrap items-center justify-end gap-[10px]">
          <button onClick={() => router.push('/crm/polizas/nueva')} className="bg-[#4f46e5] hover:bg-[#4338ca] text-white border-none py-[8px] px-[16px] text-[13px] font-semibold rounded-[8px] cursor-pointer flex items-center gap-[6px] shadow-sm transition-all focus:ring-2 focus:ring-[#4f46e5] focus:outline-none">
            <Plus className="w-4 h-4" /> New policy
          </button>
          <button onClick={handleRefresh} disabled={isLoading} className="bg-[#4f46e5] hover:bg-[#4338ca] disabled:opacity-60 text-white border-none py-[8px] px-[16px] text-[13px] font-semibold rounded-[8px] cursor-pointer flex items-center gap-[6px] shadow-sm transition-all focus:ring-2 focus:ring-[#4f46e5] focus:outline-none">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={handleExport} className="bg-[#4f46e5] hover:bg-[#4338ca] text-white border-none py-[8px] px-[16px] text-[13px] font-semibold rounded-[8px] cursor-pointer flex items-center gap-[6px] shadow-sm transition-all focus:ring-2 focus:ring-[#4f46e5] focus:outline-none">
            <FileText className="w-4 h-4" /> Export
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="p-[20px] md:p-[40px] flex flex-col gap-[24px] overflow-y-auto h-full">
        <CrearPolizaModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={(polizaId) => router.push(`/crm/polizas/${polizaId}`)}
        />
        
        {/* KPI Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[20px]">
          <div className="bg-white dark:bg-[#1e293b] rounded-[16px] border border-[#f1f5f9] dark:border-[#334155] p-[20px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] hover:-translate-y-1 transition-transform">
            <div className="text-[12px] font-bold text-[#64748b] dark:text-gray-400 capitalize">Pólizas</div>
            <div className="text-[11px] text-[#64748b] dark:text-gray-400 mt-[2px] opacity-80">Número de pólizas</div>
            <div className="text-[26px] font-extrabold mt-[10px] tracking-[-0.5px] text-[#10b981]">{totalPolizas}</div>
          </div>
          <div className="bg-white dark:bg-[#1e293b] rounded-[16px] border border-[#f1f5f9] dark:border-[#334155] p-[20px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] hover:-translate-y-1 transition-transform">
            <div className="text-[12px] font-bold text-[#64748b] dark:text-gray-400 capitalize">Aplicantes</div>
            <div className="text-[11px] text-[#64748b] dark:text-gray-400 mt-[2px] opacity-80">Número de aplicantes calculados</div>
            <div className="text-[26px] font-extrabold mt-[10px] tracking-[-0.5px] text-[#4f46e5]">{totalPolizas * 2}</div>
          </div>
          <div className="bg-white dark:bg-[#1e293b] rounded-[16px] border border-[#f1f5f9] dark:border-[#334155] p-[20px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] opacity-60">
            <div className="text-[12px] font-bold text-[#64748b] dark:text-gray-400 capitalize">Pólizas Canceladas</div>
            <div className="text-[11px] text-[#64748b] dark:text-gray-400 mt-[2px] opacity-80">Planes anulados (Próximamente)</div>
            <div className="text-[26px] font-extrabold mt-[10px] tracking-[-0.5px] text-[#ef4444]">--</div>
          </div>
          <div className="bg-white dark:bg-[#1e293b] rounded-[16px] border border-[#f1f5f9] dark:border-[#334155] p-[20px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] opacity-60">
            <div className="text-[12px] font-bold text-[#64748b] dark:text-gray-400 capitalize">Renovaciones</div>
            <div className="text-[11px] text-[#64748b] dark:text-gray-400 mt-[2px] opacity-80">Tasa de renovación (Próximamente)</div>
            <div className="text-[26px] font-extrabold mt-[10px] tracking-[-0.5px] text-[#f59e0b]">--</div>
          </div>
        </section>

        {/* Toolbar */}
        <div className="bg-white dark:bg-[#1e293b] rounded-[16px] border border-[#f1f5f9] dark:border-[#334155] p-[20px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] flex flex-col gap-[12px]">
          <div className="flex justify-end w-full">
            <div className="flex items-center gap-[14px] text-[13px] font-medium text-[#0f172a] dark:text-white">
              <span className="text-[#64748b] dark:text-gray-400 font-semibold">Año de vigencia</span>
              {['2024', '2025', '2026'].map(year => (
                <label key={year} className="flex items-center gap-[5px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedYears.includes(year)}
                    onChange={() => handleYearChange(year)}
                  />
                  {year}
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-[16px] w-full">
            <div className="flex items-center bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] py-[4px] pl-[14px] pr-[6px] grow">
              <Search className="w-[14px] h-[14px] text-[#64748b] dark:text-gray-400 mr-[10px] shrink-0" />
              <input 
                type="text" 
                placeholder="Buscar por Nombre, FFM..." 
                className="border-none bg-transparent text-[14px] outline-none text-[#0f172a] dark:text-white grow py-[6px]"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
              <div className="flex items-center gap-[6px] shrink-0">
                <button className="bg-[#10b981] hover:bg-[#059669] text-white border-none py-[8px] px-[14px] text-[13px] font-semibold rounded-[6px] cursor-pointer flex items-center gap-[6px] transition-colors"><Search className="w-3.5 h-3.5 hidden sm:inline" /> Buscar</button>
                <button className="bg-[#4f46e5] hover:bg-[#4338ca] text-white border-none py-[8px] px-[14px] text-[13px] font-semibold rounded-[6px] cursor-pointer flex items-center gap-[6px] transition-colors"><Settings className="w-3.5 h-3.5 hidden sm:inline" /> Filtros</button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-3 text-[13px]">
            <div className="inline-flex rounded-lg border border-[#e2e8f0] dark:border-[#334155] p-1 bg-[#f8fafc] dark:bg-[#0f172a]">
              <button
                type="button"
                onClick={() => {
                  setShowArchived(false);
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded-md text-[13px] font-semibold transition-colors ${
                  !showArchived
                    ? 'bg-white dark:bg-[#1e293b] text-[#4f46e5] shadow-sm'
                    : 'text-[#64748b] dark:text-gray-400 hover:text-[#0f172a] dark:hover:text-white'
                }`}
              >
                Activas
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowArchived(true);
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded-md text-[13px] font-semibold transition-colors flex items-center gap-1.5 ${
                  showArchived
                    ? 'bg-white dark:bg-[#1e293b] text-[#4f46e5] shadow-sm'
                    : 'text-[#64748b] dark:text-gray-400 hover:text-[#0f172a] dark:hover:text-white'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                Archivadas
              </button>
            </div>
            <div className="text-[#64748b] dark:text-gray-400 font-medium">
              {showArchived ? 'Pólizas archivadas' : 'Pólizas activas'}: {filteredPolizas.length}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-[#1e293b] rounded-[16px] border border-[#f1f5f9] dark:border-[#334155] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] overflow-visible">
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[900px]">
              <thead>
                <tr>
                  <th className="bg-[#f8fafc] dark:bg-[#0f172a] p-[16px_24px] text-[12px] font-bold text-[#64748b] dark:text-gray-400 uppercase tracking-[0.5px] border-b border-[#f1f5f9] dark:border-[#334155] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-2">Cliente <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                  </th>
                  <th className="bg-[#f8fafc] dark:bg-[#0f172a] p-[16px_24px] text-[12px] font-bold text-[#64748b] dark:text-gray-400 uppercase tracking-[0.5px] border-b border-[#f1f5f9] dark:border-[#334155] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-2">Agente / Asistente <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                  </th>
                  <th className="bg-[#f8fafc] dark:bg-[#0f172a] p-[16px_24px] text-[12px] font-bold text-[#64748b] dark:text-gray-400 uppercase tracking-[0.5px] border-b border-[#f1f5f9] dark:border-[#334155] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-2">Estatus <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                  </th>
                  <th className="bg-[#f8fafc] dark:bg-[#0f172a] p-[16px_24px] text-[12px] font-bold text-[#64748b] dark:text-gray-400 uppercase tracking-[0.5px] border-b border-[#f1f5f9] dark:border-[#334155] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && filteredPolizas.length === 0 ? (
                  <tr><td colSpan={4} className="text-center p-8 text-[#94a3b8] dark:text-gray-500 font-medium">Cargando pólizas...</td></tr>
                ) : filteredPolizas.length === 0 ? (
                  <tr><td colSpan={4} className="text-center p-8 text-[#94a3b8] dark:text-gray-500 font-medium">No se encontraron resultados.</td></tr>
                ) : (
                  filteredPolizas.map((poliza) => {
                    const statusName = poliza.estado_nombre || 'Desconocido';
                    const documentoName = poliza.estado_documento_display || getEstadoDocumentoLabel(poliza.estado_documento);
                    const pagoName = poliza.estado_pago_display || getEstadoPagoLabel(poliza.estado_pago);
                    
                    return (
                    <tr 
                      key={poliza.id} 
                      onClick={() => handleViewPoliza(poliza.id)}
                      className="hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] dark:bg-[#0f172a] dark:hover:bg-[#0f172a] dark:bg-[#0f172a] group transition-colors cursor-pointer"
                    >
                      <td className="p-[18px_24px] border-b border-[#f1f5f9] dark:border-[#334155] align-top">
                        <div className="flex gap-[12px] items-start">
                          <div className="w-[32px] h-[32px] bg-[#eff6ff] text-[#4f46e5] font-extrabold text-[13px] flex items-center justify-center rounded-[8px] shrink-0">
                            {poliza.cliente_principal ? poliza.cliente_principal.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <h4 className="text-[14px] font-bold text-[#1e293b] dark:text-gray-100 uppercase leading-[1.4] m-0">{poliza.cliente_principal || 'Sin Nombre'}</h4>
                            <div className="text-[12px] font-semibold text-[#64748b] dark:text-gray-400 uppercase leading-[1.4] mt-[4px]">{poliza.plan_nombre || 'N/A Carrier'}</div>
                            <div className="text-[12px] font-medium text-[#94a3b8] dark:text-gray-500 leading-[1.4] mt-[2px]">FFM: {poliza.id_mercado || '---'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-[18px_24px] border-b border-[#f1f5f9] dark:border-[#334155] align-top">
                        <div>
                          <h5 className="text-[13px] font-bold text-[#334155] dark:text-gray-200 uppercase leading-[1.4] m-0">{poliza.agente_nombre || 'No Asignado'}</h5>
                          <p className="text-[12px] font-medium text-[#94a3b8] dark:text-gray-500 leading-[1.4] mt-[4px] m-0">NPN: <span className="text-[#64748b] dark:text-gray-400 font-semibold">{poliza.agente_npn || '---'}</span></p>
                          <p className="text-[12px] font-medium text-[#94a3b8] dark:text-gray-500 leading-[1.4] mt-[4px] m-0">Asistente: <span className="text-[#64748b] dark:text-gray-400 font-semibold">{poliza.asistente_nombre ? `${poliza.asistente_nombre}${poliza.asistente_npn ? ` (NPN: ${poliza.asistente_npn})` : ''}` : 'Sin Registrar'}</span></p>
                        </div>
                      </td>
                      <td className="p-[18px_24px] border-b border-[#f1f5f9] dark:border-[#334155] align-top">
                        <div className="flex flex-col items-start gap-[6px]">
                          <StatusBadge label={statusName} />
                          <StatusBadge label={documentoName} />
                          <StatusBadge label={pagoName} />
                        </div>
                      </td>
                      <td className="p-[18px_24px] border-b border-[#f1f5f9] dark:border-[#334155] align-top text-right">
                        <div className="inline-flex relative align-middle" onClick={(e) => e.stopPropagation()}>
                          <button onClick={(e) => { e.stopPropagation(); handleViewPoliza(poliza.id); }} className="bg-white dark:bg-[#1e293b] border border-[#cbd5e1] dark:border-[#475569] border-r-0 py-[7px] pl-[14px] pr-[10px] text-[13px] font-bold text-[#4f46e5] rounded-[8px_0_0_8px] cursor-pointer hover:bg-[#f1f5f9] dark:hover:bg-[#334155] dark:bg-[#1e293b] dark:hover:bg-[#334155] dark:bg-[#1e293b] transition-colors focus:outline-none">
                            Preview
                          </button>
                          <button onClick={(e) => toggleDropdown(e, poliza.id)} className={`bg-white dark:bg-[#1e293b] border border-[#cbd5e1] dark:border-[#475569] py-[7px] px-[10px] text-[11px] text-[#4f46e5] rounded-[0_8px_8px_0] cursor-pointer hover:bg-[#f1f5f9] dark:hover:bg-[#334155] dark:bg-[#1e293b] dark:hover:bg-[#334155] dark:bg-[#1e293b] transition-colors flex items-center justify-center focus:outline-none ${openDropdownId === poliza.id ? '!bg-[#4f46e5] !text-white !border-[#4f46e5]' : ''}`}>
                            {openDropdownId === poliza.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          
                          {openDropdownId === poliza.id && (
                            <ul className="absolute top-full right-0 mt-[4px] bg-white dark:bg-[#1e293b] border border-[#cbd5e1] dark:border-[#475569] rounded-[10px] shadow-[0_10px_20px_rgba(0,0,0,0.08)] list-none w-[200px] z-[100] p-0 overflow-hidden text-left animate-in fade-in zoom-in duration-150">
                              <li className="border-b border-[#f1f5f9] dark:border-[#334155]">
                                <button className="w-full flex items-center gap-[12px] p-[10px_14px] bg-transparent border-none text-[13px] font-semibold text-[#334155] dark:text-gray-200 cursor-pointer hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] dark:bg-[#0f172a] dark:hover:bg-[#0f172a] dark:bg-[#0f172a] hover:text-[#4f46e5] text-left">
                                  <Edit2 className="w-4 h-4 text-[#94a3b8] dark:text-gray-500 shrink-0" /> Manage
                                </button>
                              </li>
                              <li className="border-b border-[#f1f5f9] dark:border-[#334155]">
                                <button className="w-full flex items-center gap-[12px] p-[10px_14px] bg-transparent border-none text-[13px] font-semibold text-[#334155] dark:text-gray-200 cursor-pointer hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] dark:bg-[#0f172a] dark:hover:bg-[#0f172a] dark:bg-[#0f172a] hover:text-[#4f46e5] text-left">
                                  <FileSignature className="w-4 h-4 text-[#94a3b8] dark:text-gray-500 shrink-0" /> Quick update
                                </button>
                              </li>
                              <li className="border-b border-[#f1f5f9] dark:border-[#334155]">
                                <button className="w-full flex items-center gap-[12px] p-[10px_14px] bg-transparent border-none text-[13px] font-semibold text-[#334155] dark:text-gray-200 cursor-pointer hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] dark:bg-[#0f172a] dark:hover:bg-[#0f172a] dark:bg-[#0f172a] hover:text-[#4f46e5] text-left">
                                  <Copy className="w-4 h-4 text-[#94a3b8] dark:text-gray-500 shrink-0" /> Duplicate
                                </button>
                              </li>
                              <li className="border-b border-[#f1f5f9] dark:border-[#334155]">
                                <button className="w-full flex items-center gap-[12px] p-[10px_14px] bg-transparent border-none text-[13px] font-semibold text-[#334155] dark:text-gray-200 cursor-pointer hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] dark:bg-[#0f172a] dark:hover:bg-[#0f172a] dark:bg-[#0f172a] hover:text-[#4f46e5] text-left">
                                  <UserPlus className="w-4 h-4 text-[#94a3b8] dark:text-gray-500 shrink-0" /> Assign policy
                                </button>
                              </li>
                              <div className="h-[4px] bg-[#f8fafc] dark:bg-[#0f172a] border-b border-[#f1f5f9] dark:border-[#334155] border-t w-[100%]"></div>
                              <li className="border-b border-[#f1f5f9] dark:border-[#334155]">
                                <button className="w-full flex items-center gap-[12px] p-[10px_14px] bg-transparent border-none text-[13px] font-semibold text-[#334155] dark:text-gray-200 cursor-pointer hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] dark:bg-[#0f172a] dark:hover:bg-[#0f172a] dark:bg-[#0f172a] hover:text-[#4f46e5] text-left">
                                  <BellRing className="w-4 h-4 text-[#94a3b8] dark:text-gray-500 shrink-0" /> New reminder
                                </button>
                              </li>
                              <li className="border-b border-[#f1f5f9] dark:border-[#334155]">
                                <button className="w-full flex items-center gap-[12px] p-[10px_14px] bg-transparent border-none text-[13px] font-semibold text-[#334155] dark:text-gray-200 cursor-pointer hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] dark:bg-[#0f172a] dark:hover:bg-[#0f172a] dark:bg-[#0f172a] hover:text-[#4f46e5] text-left">
                                  <FileText className="w-4 h-4 text-[#94a3b8] dark:text-gray-500 shrink-0" /> Notes
                                </button>
                              </li>
                              <li className="border-b border-[#f1f5f9] dark:border-[#334155]">
                                <button className="w-full flex items-center gap-[12px] p-[10px_14px] bg-transparent border-none text-[13px] font-semibold text-[#334155] dark:text-gray-200 cursor-pointer hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] dark:bg-[#0f172a] dark:hover:bg-[#0f172a] dark:bg-[#0f172a] hover:text-[#4f46e5] text-left">
                                  <FileClock className="w-4 h-4 text-[#94a3b8] dark:text-gray-500 shrink-0" /> Logs
                                </button>
                              </li>
                              <li>
                                {canArchive && !showArchived ? (
                                  <button
                                    type="button"
                                    onClick={(e) => handleArchivePoliza(e, poliza.id)}
                                    className="w-full flex items-center gap-[12px] p-[10px_14px] bg-transparent border-none text-[13px] font-semibold text-[#ef4444] cursor-pointer hover:bg-[#fef2f2] text-left"
                                  >
                                    <Archive className="w-4 h-4 text-[#ef4444] shrink-0" /> Archivar
                                  </button>
                                ) : null}
                              </li>
                            </ul>
                          )}
                        </div>
                      </td>
                    </tr>
                   )}
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Info */}
        <div className="flex flex-col gap-[12px] sm:flex-row sm:justify-between sm:items-center text-[13px] font-medium text-[#64748b] dark:text-gray-400 bg-white dark:bg-[#1e293b] p-[16px] rounded-[16px] border border-[#f1f5f9] dark:border-[#334155] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.03)]">
          <span>Página {page} de {totalPages} &bull; Mostrando {filteredPolizas.length} resultados</span>
          <div className="flex flex-wrap items-center gap-[8px]">
            <button onClick={() => setPage(page - 1)} disabled={page <= 1 || isLoading} className="border border-[#e2e8f0] dark:border-[#334155] font-semibold text-[#475569] dark:text-gray-300 rounded-[8px] px-[12px] py-[6px] bg-white dark:bg-[#1e293b] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] disabled:opacity-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#e2e8f0]">Anterior</button>
            <PagedNumberPagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              disabled={isLoading}
            />
            <button onClick={() => setPage(page + 1)} disabled={page >= totalPages || isLoading} className="border border-[#e2e8f0] dark:border-[#334155] font-semibold text-[#475569] dark:text-gray-300 rounded-[8px] px-[12px] py-[6px] bg-white dark:bg-[#1e293b] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] disabled:opacity-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#e2e8f0]">Siguiente</button>
          </div>
        </div>

      </div>
    </div>
  );
}
