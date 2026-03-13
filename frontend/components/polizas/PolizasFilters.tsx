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
import React from 'react';
import { PolizaFilters } from './types';

interface PolizasFiltersProps {
  filters: PolizaFilters;
  onFiltersChange: (filters: PolizaFilters) => void;
}

export function PolizasFilters({
  filters,
  onFiltersChange,
}: PolizasFiltersProps) {
  const updateFilter = (key: keyof PolizaFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
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
                placeholder="Buscar por ID, cliente o agente..."
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
                Estado: {filters.status === 'all' ? 'Todos' : filters.status}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => updateFilter('status', 'all')}>
                Todos los estados
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('status', 'Activo')}>
                Activo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('status', 'Inactivo')}>
                Inactivo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('status', 'Pendiente')}>
                Pendiente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('status', 'Cancelado')}>
                Cancelado
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('status', 'Renovación')}>
                Renovación
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filtro por plan */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full lg:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Plan: {filters.plan === 'all' ? 'Todos' : filters.plan}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => updateFilter('plan', 'all')}>
                Todos los planes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('plan', 'Básico')}>
                Básico
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('plan', 'Premium')}>
                Premium
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('plan', 'VIP')}>
                VIP
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('plan', 'Familiar')}>
                Familiar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}