'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PolizasHeader } from '@/components/polizas/PolizasHeader';
import { PolizasFilters } from '@/components/polizas/PolizasFilters';
import { PolizasDataTable } from '@/components/polizas/PolizasDataTable';
import BoxComponent from '@/components/boxes/BoxComponent';
import { Skeleton } from '@/components/ui/skeleton';
import { Poliza, PolizaFilters } from '@/components/polizas/types';
import { usePolizaStore } from '@/store/polizaStore';

export default function PolizasPage() {
  const router = useRouter();
  const { polizas: polizasData, isLoading, fetchPolizas, deletePoliza } = usePolizaStore();
  const [selectedPolizas, setSelectedPolizas] = useState<number[]>([]);
  const [filters, setFilters] = useState<PolizaFilters>({
    search: '',
    status: 'all',
    plan: 'all',
    agente: 'all'
  });

  // Cargar pólizas al montar
  useEffect(() => {
    fetchPolizas();
  }, [fetchPolizas]);

  // Mapear PolizaResponse → Poliza local (normalizar tipos numéricos y extraer cliente principal)
  const polizas: Poliza[] = polizasData.map(p => ({
    id: p.id!,
    id_mercado: p.id_mercado,
    id_miembro: p.id_miembro,
    agente_nombre: p.agente_nombre,
    plan_nombre: p.plan_nombre,
    estado_nombre: p.estado_nombre,
    prima_mensual: parseFloat(p.prima_mensual ?? '0'),
    fecha_efectiva: p.fecha_efectiva,
    costo_poliza: parseFloat(p.costo_poliza ?? '0'),
    cliente_principal: p.clientes_info?.find(c => c.es_solicitante_principal)
      ? `${p.clientes_info.find(c => c.es_solicitante_principal)!.cliente_details.primer_nombre} ${p.clientes_info.find(c => c.es_solicitante_principal)!.cliente_details.apellido_paterno}`
      : undefined,
    fecha_creacion: p.fecha_creacion ?? '',
  }));

  // Filtrar pólizas
  const filteredPolizas = polizas.filter(poliza => {
    const searchLower = filters.search.toLowerCase();
    const primaStr = poliza.prima_mensual ? poliza.prima_mensual.toString() : '';
    
    const matchesSearch = 
      (poliza.id_mercado && poliza.id_mercado.toLowerCase().includes(searchLower)) ||
      (poliza.cliente_principal && poliza.cliente_principal.toLowerCase().includes(searchLower)) ||
      (poliza.agente_nombre && poliza.agente_nombre.toLowerCase().includes(searchLower)) ||
      (primaStr.includes(searchLower));
    
    const matchesStatus = filters.status === 'all' || poliza.estado_nombre === filters.status;
    const matchesPlan = filters.plan === 'all' || poliza.plan_nombre === filters.plan;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const uniqueStatuses = Array.from(new Set(polizas.map(p => p.estado_nombre))).filter(Boolean) as string[];
  const uniquePlans = Array.from(new Set(polizas.map(p => p.plan_nombre))).filter(Boolean) as string[];

  // Handlers para acciones de la tabla
  const handleViewPoliza = (id: number) => {
    router.push(`/crm/polizas/${id}`);
  };

  const handleEditPoliza = (id: number) => {
    console.log('Editar póliza:', id);
  };

  const handleDeletePoliza = async (id: number) => {
    await deletePoliza(id);
  };

  // Calcular estadísticas
  const totalPolizas = polizas.length;
  const polizasActivas = polizas.filter(p => p.estado_nombre === 'Activo').length;
  const polizasPendientes = polizas.filter(p => p.estado_nombre === 'Pendiente').length;
  const primaPromedio = totalPolizas > 0
    ? polizas.reduce((sum, p) => sum + p.prima_mensual, 0) / totalPolizas
    : 0;

  if (isLoading && polizas.length === 0) {
    return (
      <div className="flex flex-col space-y-6 p-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24" /><Skeleton className="h-24" />
          <Skeleton className="h-24" /><Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 p-6">
      <PolizasHeader />
      
      {/* Estadísticas */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <BoxComponent 
          title="Total Pólizas" 
          value={totalPolizas} 
        />
        <BoxComponent 
          title="Pólizas Activas" 
          value={polizasActivas} 
        />
        <BoxComponent 
          title="Pendientes" 
          value={polizasPendientes} 
        />
        <BoxComponent 
          title="Prima Promedio" 
          value={`€${primaPromedio.toFixed(2)}`} 
        />
      </div>

      <PolizasFilters
        filters={filters}
        onFiltersChange={setFilters}
        uniqueStatuses={uniqueStatuses}
        uniquePlans={uniquePlans}
      />

      <PolizasDataTable
        polizas={filteredPolizas}
        selectedPolizas={selectedPolizas}
        onSelectionChange={setSelectedPolizas}
        onViewPoliza={handleViewPoliza}
        onEditPoliza={handleEditPoliza}
        onDeletePoliza={handleDeletePoliza}
      />
    </div>
  );
}
