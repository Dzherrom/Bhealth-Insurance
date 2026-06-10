'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Plus } from 'lucide-react';
import { StatusPoliza, StatusListFilters } from './statusTypes';
import { AgregarStatusModal } from './AgregarStatusModal';
import { StatusFilters } from './StatusFilters';

// Datos hardcodeados basados en la imagen
const mockStatusData: StatusPoliza[] = [
  { id: 1, titulo: 'Estatus Personalizados', color: '#f3f4f6', habilitadoParaAgentes: false },
  { id: 2, titulo: 'EN PROCESO', color: '#14b8a6', habilitadoParaAgentes: true },
  { id: 3, titulo: 'BAJA', color: '#eab308', habilitadoParaAgentes: true },
  { id: 4, titulo: 'BAJA NUMERO', color: '#3b82f6', habilitadoParaAgentes: true },
  { id: 5, titulo: 'CAMBIO DE VIDA', color: '#ef4444', habilitadoParaAgentes: true },
  { id: 6, titulo: 'CAMBIO DE VIDA-FREE WAY', color: '#ef4444', habilitadoParaAgentes: true },
  { id: 7, titulo: 'CAMBIO NO REALIZADO', color: '#ef4444', habilitadoParaAgentes: true },
  { id: 8, titulo: 'CAMBIO REALIZADO SHERPA', color: '#3b82f6', habilitadoParaAgentes: true },
  { id: 9, titulo: 'CITA GINECOLOGICA', color: '#3b82f6', habilitadoParaAgentes: true },
  { id: 10, titulo: 'CITA NO PROCESADA', color: '#ef4444', habilitadoParaAgentes: true },
  { id: 11, titulo: 'CITA PROCESADA', color: '#3b82f6', habilitadoParaAgentes: true },
  { id: 12, titulo: 'CITAS', color: '#eab308', habilitadoParaAgentes: true },
  { id: 13, titulo: 'CONTACTADO', color: '#10b981', habilitadoParaAgentes: true },
  { id: 14, titulo: 'CONTACTADO JESUS DUQUE 2026', color: '#10b981', habilitadoParaAgentes: true },
  { id: 15, titulo: 'CONTACTADO LEONISA CARNEIRO 2025', color: '#10b981', habilitadoParaAgentes: true }
];

export function StatusList() {
  const [statusList, setStatusList] = useState<StatusPoliza[]>(mockStatusData);
  const [filters, setFilters] = useState<StatusListFilters>({
    search: '',
    itemsPerPage: 50,
    statusFilter: undefined
  });
  const [activeTab, setActiveTab] = useState<'poliza' | 'copago'>('poliza');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<StatusPoliza | null>(null);

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

  const handleSaveStatus = (newStatus: Omit<StatusPoliza, 'id'>) => {
    const newId = Math.max(...statusList.map(s => s.id)) + 1;
    setStatusList([...statusList, { ...newStatus, id: newId }]);
    setIsModalOpen(false);
  };

  const handleEditStatus = (status: StatusPoliza) => {
    setEditingStatus(status);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = (updatedStatus: StatusPoliza) => {
    setStatusList(statusList.map(s => s.id === updatedStatus.id ? updatedStatus : s));
    setEditingStatus(null);
    setIsModalOpen(false);
  };

  const handleDeleteStatus = (id: number) => {
    setStatusList(statusList.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header con título y botones */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
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
        onFiltersChange={setFilters}
        totalItems={statusList.length}
      />

      {/* Estadísticas */}
      <div className="text-sm text-gray-600">
        Mostrando 1 a {Math.min(filters.itemsPerPage, filteredStatus.length)} de {filteredStatus.length} formularios
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
            {filteredStatus.slice(0, filters.itemsPerPage).map((status) => (
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
          </tbody>
        </table>
      </Card>

      {/* Modal para agregar status */}
      <AgregarStatusModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStatus(null);
        }}
        onSave={editingStatus ? handleUpdateStatus : handleSaveStatus}
        statusToEdit={editingStatus}
      />
    </div>
  );
}