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

/* Mock data comentada — reemplazada por datos reales del API
const mockPolizas: Poliza[] = [
  {
    id: 1,
    id_mercado: 'POL-2024-001',
    id_miembro: 'MEM-001',
    agente_nombre: 'Ana García',
    plan_nombre: 'Premium',
    estado_nombre: 'Activo',
    prima_mensual: 89.99,
    fecha_efectiva: '2024-01-15',
    costo_poliza: 1079.88,
    cliente_principal: 'Juan Pérez',
    fecha_creacion: '2024-01-10'
  },
  {
    id: 2,
    id_mercado: 'POL-2024-002',
    id_miembro: 'MEM-002',
    agente_nombre: 'Carlos Rodríguez',
    plan_nombre: 'Básico',
    estado_nombre: 'Activo',
    prima_mensual: 45.50,
    fecha_efectiva: '2024-02-01',
    costo_poliza: 546.00,
    cliente_principal: 'María López',
    fecha_creacion: '2024-01-25'
  },
  {
    id: 3,
    id_mercado: 'POL-2024-003',
    id_miembro: 'MEM-003',
    agente_nombre: 'Laura Martínez',
    plan_nombre: 'VIP',
    estado_nombre: 'Pendiente',
    prima_mensual: 159.99,
    fecha_efectiva: '2024-01-20',
    costo_poliza: 1919.88,
    cliente_principal: 'Antonio Silva',
    fecha_creacion: '2024-01-18'
  },
  {
    id: 4,
    id_mercado: 'POL-2024-004',
    id_miembro: 'MEM-004',
    agente_nombre: 'Ana García',
    plan_nombre: 'Familiar',
    estado_nombre: 'Inactivo',
    prima_mensual: 120.00,
    fecha_efectiva: '2023-12-01',
    costo_poliza: 1440.00,
    cliente_principal: 'Carmen Ruiz',
    fecha_creacion: '2023-11-25'
  },
  {
    id: 5,
    id_mercado: 'POL-2024-005',
    id_miembro: 'MEM-005',
    agente_nombre: 'Carlos Rodríguez',
    plan_nombre: 'Premium',
    estado_nombre: 'Renovación',
    prima_mensual: 95.00,
    fecha_efectiva: '2024-03-01',
    costo_poliza: 1140.00,
    cliente_principal: 'Roberto Díaz',
    fecha_creacion: '2024-02-15'
  },
  {
    id: 6,
    id_mercado: 'POL-2024-006',
    id_miembro: 'MEM-006',
    agente_nombre: 'Laura Martínez',
    plan_nombre: 'Básico',
    estado_nombre: 'Cancelado',
    prima_mensual: 42.99,
    fecha_efectiva: '2024-01-05',
    costo_poliza: 515.88,
    cliente_principal: 'Sofia Morales',
    fecha_creacion: '2023-12-30'
  }
];
*/

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
    const matchesSearch = 
      poliza.id_mercado.toLowerCase().includes(filters.search.toLowerCase()) ||
      poliza.cliente_principal?.toLowerCase().includes(filters.search.toLowerCase()) ||
      poliza.agente_nombre.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || poliza.estado_nombre === filters.status;
    const matchesPlan = filters.plan === 'all' || poliza.plan_nombre === filters.plan;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

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
