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
  availableRoles: string[];
  availableStatuses: string[];
}

const formatFilterLabel = (value: string) => {
  if (!value) return 'N/A';
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export function UsersFilters({
  searchTerm,
  setSearchTerm,
  filterRole,
  setFilterRole,
  filterStatus,
  setFilterStatus,
  availableRoles,
  availableStatuses,
}: UsersFiltersProps) {
  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-[16px] p-[20px] mb-[24px] border border-[#f1f5f9] dark:border-[#334155] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)]">
      <div className="text-[16px] font-bold text-[#0f172a] dark:text-white mb-[16px]">Filtros</div>
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-x-4 lg:space-y-0">
        {/* Búsqueda */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8] dark:text-gray-500" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 border-[#e2e8f0] dark:border-[#334155] rounded-[10px] text-[13px] text-[#475569] dark:text-gray-200 bg-[#f8fafc] dark:bg-[#0f172a] focus-visible:ring-0 focus-visible:border-[#4f46e5]"
            />
          </div>
        </div>

        {/* Filtro por rol */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full lg:w-auto h-10 border-[#e2e8f0] dark:border-[#334155] rounded-[10px] text-[13px] text-[#475569] dark:text-gray-300 dark:bg-[#0f172a] dark:hover:bg-[#334155]">
              <Filter className="h-4 w-4 mr-2 text-[#94a3b8] dark:text-gray-500" />
              Rol: <span className="font-semibold text-[#0f172a] dark:text-white ml-1">{filterRole === 'all' ? 'Todos' : formatFilterLabel(filterRole)}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterRole('all')}>
              Todos
            </DropdownMenuItem>
            {availableRoles.map((role) => (
              <DropdownMenuItem key={role} onClick={() => setFilterRole(role)}>
                {formatFilterLabel(role)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filtro por estado */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full lg:w-auto h-10 border-[#e2e8f0] dark:border-[#334155] rounded-[10px] text-[13px] text-[#475569] dark:text-gray-300 dark:bg-[#0f172a] dark:hover:bg-[#334155]">
              <Filter className="h-4 w-4 mr-2 text-[#94a3b8] dark:text-gray-500" />
              Estado: <span className="font-semibold text-[#0f172a] dark:text-white ml-1">{filterStatus === 'all' ? 'Todos' : formatFilterLabel(filterStatus)}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterStatus('all')}>
              Todos
            </DropdownMenuItem>
            {availableStatuses.map((status) => (
              <DropdownMenuItem key={status} onClick={() => setFilterStatus(status)}>
                {formatFilterLabel(status)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
