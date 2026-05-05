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

interface UsersFiltersProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterRole: string;
  setFilterRole: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
}

export function UsersFilters({
  searchTerm,
  setSearchTerm,
  filterRole,
  setFilterRole,
  filterStatus,
  setFilterStatus,
}: UsersFiltersProps) {
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
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtro por rol */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full lg:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Rol: {filterRole === 'all' ? 'Todos' : filterRole}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterRole('all')}>
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterRole('admin')}>
                Administrador
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterRole('agente')}>
                Agente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterRole('cliente')}>
                Cliente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filtro por estado */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full lg:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Estado: {filterStatus === 'all' ? 'Todos' : filterStatus}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('activo')}>
                Activo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('inactivo')}>
                Inactivo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('pendiente')}>
                Pendiente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
