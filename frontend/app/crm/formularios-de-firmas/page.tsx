
'use client';

import React, { useState, useMemo } from 'react';
import {
  FormulariosFirmasHeader,
  FormulariosFirmasFiltersComponent,
  FormulariosFirmasDataTable,
  FormulariosFirmasStats,
  mockFormulariosFirmas,
  FormulariosFirmasFilters,
  FormularioFirma
} from '@/components/formularios-de-firmas';

const FormulariosDeFirmasPage = () => {
  const [filters, setFilters] = useState<FormulariosFirmasFilters>({
    search: '',
    status: undefined
  });

  // Filtrar los formularios basado en los filtros aplicados
  const filteredFormularios = useMemo(() => {
    let result = mockFormulariosFirmas;

    // Filtrar por búsqueda
    if (filters.search) {
      result = result.filter(formulario =>
        formulario.nombre.toLowerCase().includes(filters.search.toLowerCase()) ||
        formulario.creadoPor.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Filtrar por status
    if (filters.status && filters.status !== 'all') {
      result = result.filter(formulario => formulario.status === filters.status);
    }

    return result;
  }, [filters]);

  const handleNuevoFormulario = () => {
    // Lógica para crear nuevo formulario
    console.log('Crear nuevo formulario de firma');
  };

  const handleAvanzado = () => {
    // Lógica para configuraciones avanzadas
    console.log('Abrir configuraciones avanzadas');
  };

  const handleAction = (formulario: FormularioFirma) => {
    // Lógica para acciones de formulario
    console.log('Acción en formulario:', formulario);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header con título y botones */}
      <FormulariosFirmasHeader
        onNuevoFormulario={handleNuevoFormulario}
        onAvanzado={handleAvanzado}
      />

      {/* Filtros */}
      <FormulariosFirmasFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Tabla de datos */}
      <FormulariosFirmasDataTable
        formularios={filteredFormularios}
        onAction={handleAction}
      />

      {/* Stats y paginación */}
      <FormulariosFirmasStats
        total={filteredFormularios.length}
        currentPage={1}
        itemsPerPage={15}
      />
    </div>
  );
};

export default FormulariosDeFirmasPage;