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
import { StatusListFilters } from './statusTypes';

interface StatusFiltersProps {
  filters: StatusListFilters;
  onFiltersChange: (filters: StatusListFilters) => void;
  totalItems: number;
}

export function StatusFilters({
  filters,
  onFiltersChange,
  totalItems
}: StatusFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      search: value
    });
  };

  const handleItemsPerPageChange = (value: number) => {
    onFiltersChange({
      ...filters,
      itemsPerPage: value
    });
  };

  const handleStatusFilterChange = (value: string) => {
    onFiltersChange({
      ...filters,
      statusFilter: value === 'all' ? undefined : value
    });
  };

  const getItemsPerPageText = () => {
    if (filters.itemsPerPage === totalItems) return 'Todos';
    return filters.itemsPerPage.toString();
  };

  const getStatusFilterText = () => {
    if (!filters.statusFilter || filters.statusFilter === 'all') return 'Todos';
    return filters.statusFilter === 'habilitado' ? 'Habilitado para agentes' : 'No habilitado';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-x-4 lg:space-y-0">
          {/* Busqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground dark:text-gray-400" />
              <Input
                placeholder="Buscar por titulo de estatus..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtro por habilitacion para agentes */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full lg:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Agentes: {getStatusFilterText()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleStatusFilterChange('all')}>
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusFilterChange('habilitado')}>
                Habilitado para agentes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusFilterChange('no-habilitado')}>
                No habilitado
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filtro de elementos por página */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full lg:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Mostrar: {getItemsPerPageText()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleItemsPerPageChange(10)}>
                10
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleItemsPerPageChange(25)}>
                25
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleItemsPerPageChange(50)}>
                50
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleItemsPerPageChange(100)}>
                100
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleItemsPerPageChange(totalItems)}>
                Todos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}