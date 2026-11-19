'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Plus } from 'lucide-react';
import { StatusPoliza, StatusListFilters } from './statusTypes';
import { AgregarStatusModal } from './AgregarStatusModal';
import { StatusFilters } from './StatusFilters';
import { estadosPolizaApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { EstadoPoliza as EstadoPolizaApi } from '@/types/polizas';

const toStatus = (item: EstadoPolizaApi): StatusPoliza => ({
  id: item.id,
  titulo: item.nombre,
  color: item.color || '#64748b',
  habilitadoParaAgentes: Boolean(item.disponible_para_agentes),
});

const toApiStatus = (item: Omit<StatusPoliza, 'id'>): Omit<EstadoPolizaApi, 'id'> => ({
  nombre: item.titulo.trim(),
  color: item.color,
  disponible_para_agentes: item.habilitadoParaAgentes,
});

export function StatusList() {
  const { toast } = useToast();
  const [statusList, setStatusList] = useState<StatusPoliza[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<StatusListFilters>({
    search: '',
    itemsPerPage: 50,
    statusFilter: undefined
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<StatusPoliza | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadStatuses = useCallback(async () => {
    setIsLoading(true);
    try {
      setStatusList((await estadosPolizaApi.listAll()).map(toStatus));
    } catch {
      toast({ title: 'No se pudieron cargar los estatus de póliza', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadStatuses();
  }, [loadStatuses]);

  // Filtrar los status basado en la búsqueda
  const filteredStatus = useMemo(() => {
    let result = statusList;

    if (filters.search) {
      result = result.filter(status =>
        status.titulo.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Filtrar por habilitación para agentes
    if (filters.statusFilter === 'habilitado') {
      result = result.filter(status => status.habilitadoParaAgentes === true);
    } else if (filters.statusFilter === 'no-habilitado') {
      result = result.filter(status => status.habilitadoParaAgentes === false);
    }

    return result;
  }, [statusList, filters]);

  const handleAgregarStatus = () => {
    setIsModalOpen(true);
  };

  const handleSaveStatus = async (newStatus: Omit<StatusPoliza, 'id'>) => {
    const saved = await estadosPolizaApi.create(toApiStatus(newStatus));
    setStatusList((current) => [...current, toStatus(saved)]);
    setCurrentPage(Math.ceil((statusList.length + 1) / filters.itemsPerPage));
    setIsModalOpen(false);
  };

  const handleEditStatus = (status: StatusPoliza) => {
    setEditingStatus(status);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (updatedStatus: StatusPoliza) => {
    const saved = await estadosPolizaApi.patch(updatedStatus.id, toApiStatus(updatedStatus));
    setStatusList((current) => current.map((s) => s.id === updatedStatus.id ? toStatus(saved) : s));
    setEditingStatus(null);
    setIsModalOpen(false);
  };

  const handleDeleteStatus = async (id: number) => {
    try {
      await estadosPolizaApi.delete(id);
      setStatusList((current) => current.filter((s) => s.id !== id));
      toast({ title: 'Estatus eliminado' });
    } catch {
      toast({ title: 'No se pudo eliminar el estatus', variant: 'destructive' });
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredStatus.length / filters.itemsPerPage));
  const pageStatuses = filteredStatus.slice((currentPage - 1) * filters.itemsPerPage, currentPage * filters.itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header con título y botones */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Estatus de Poliza
        </h1>
        
        <div className="flex space-x-3">
          <Button 
            onClick={handleAgregarStatus}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear
          </Button>
        </div>
      </div>

      {/* Componente de filtros */}
      <StatusFilters
        filters={filters}
        onFiltersChange={(next) => {
          setFilters(next);
          setCurrentPage(1);
        }}
        totalItems={filteredStatus.length}
      />

      {/* Estadísticas */}
      <div className="text-sm text-gray-600 dark:text-gray-300">
        {isLoading ? 'Cargando estatus...' : `Mostrando ${filteredStatus.length ? (currentPage - 1) * filters.itemsPerPage + 1 : 0} a ${Math.min(currentPage * filters.itemsPerPage, filteredStatus.length)} de ${filteredStatus.length} estatus`}
      </div>

      {/* Tabla */}
      <Card className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-[#0f172a]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Titulo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Color
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Habilitado para agentes?
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#1e293b] divide-y divide-gray-200 dark:divide-[#334155]">
            {!isLoading && pageStatuses.map((status) => (
              <tr key={status.id} className="hover:bg-gray-50 dark:hover:bg-[#0f172a]">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {status.titulo}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: status.color }}
                  />
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    {status.habilitadoParaAgentes ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </td>
                
                <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button variant="ghost" size="sm" onClick={() => handleEditStatus(status)}>Editar</Button>
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteStatus(status.id)}>Eliminar</Button>
                </td>
              </tr>
            ))}
            {!isLoading && pageStatuses.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-muted-foreground">No hay estatus para mostrar.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {filteredStatus.length > filters.itemsPerPage && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>Anterior</Button>
            <Button variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)}>Siguiente</Button>
          </div>
        </div>
      )}

      {/* Modal para agregar status */}
      <AgregarStatusModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStatus(null);
        }}
        onSave={async (status) => {
          if ('id' in status && status.id) {
            await handleUpdateStatus(status as StatusPoliza);
          } else {
            await handleSaveStatus(status as Omit<StatusPoliza, 'id'>);
          }
        }}
        statusToEdit={editingStatus}
      />
    </div>
  );
}
