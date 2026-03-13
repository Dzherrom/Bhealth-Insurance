'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Filter } from 'lucide-react';
import { FormulariosFirmasFilters } from './types';

interface FormulariosFirmasFiltersComponentProps {
  filters: FormulariosFirmasFilters;
  onFiltersChange: (filters: FormulariosFirmasFilters) => void;
}

export function FormulariosFirmasFiltersComponent({ 
  filters, 
  onFiltersChange 
}: FormulariosFirmasFiltersComponentProps) {
  const updateFilter = (key: keyof FormulariosFirmasFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const getStatusLabel = (status: string | undefined) => {
    if (!status || status === 'all') return 'Todos';
    switch (status) {
      case 'activo':
        return 'Activo';
      case 'pendiente':
        return 'Pendiente';
      case 'validado':
        return 'Validado';
      case 'revisión':
        return 'Revisión';
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-x-4 lg:space-y-0">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, creador o ID..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtro por estado */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full lg:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Estado: {getStatusLabel(filters.status)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => updateFilter('status', 'all')}>
                Todos los estados
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('status', 'activo')}>
                Activo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('status', 'pendiente')}>
                Pendiente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('status', 'validado')}>
                Validado
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('status', 'revisión')}>
                Revisión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}