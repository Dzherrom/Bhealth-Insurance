'use client';

import { useEffect, useMemo, useState } from 'react';
import { UsersHeader } from '@/components/users/UsersHeader';
import { UsersFilters } from '@/components/users/UsersFilters';
import BoxComponent from '@/components/boxes/BoxComponent';
import { UsersList } from '@/components/users/UsersList';
import { User } from '@/components/users/types';
import { usersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE_SIZE = 25;

interface ApiUserProfile {
  role?: string;
  status?: string;
  avatar?: string | null;
  telefono?: string | null;
}

interface ApiUser {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile?: ApiUserProfile;
  is_active?: boolean;
  date_joined?: string;
  last_login?: string | null;
}

const normalizeStatus = (rawStatus?: string, isActive?: boolean): string => {
  if (rawStatus) {
    if (rawStatus === 'ACTIVE') return 'activo';
    if (rawStatus === 'INACTIVE') return 'inactivo';
    if (rawStatus === 'CANDIDATE') return 'pendiente';
    return rawStatus.toLowerCase();
  }

  if (isActive === true) return 'activo';
  if (isActive === false) return 'inactivo';
  return 'pendiente';
};

const normalizeRole = (rawRole?: string): string => {
  if (!rawRole) return 'usuario';
  if (rawRole === 'USER') return 'usuario';
  return rawRole.toLowerCase();
};

const mapApiUserToUIUser = (apiUser: ApiUser): User => {
  const fullName = `${apiUser.first_name || ''} ${apiUser.last_name || ''}`.trim();
  const fallbackName = apiUser.username || apiUser.email || `Usuario ${apiUser.id}`;

  return {
    id: apiUser.id,
    name: fullName || fallbackName,
    email: apiUser.email || '',
    phone: apiUser.profile?.telefono || '-',
    role: normalizeRole(apiUser.profile?.role),
    status: normalizeStatus(apiUser.profile?.status, apiUser.is_active),
    avatar: apiUser.profile?.avatar || undefined,
    lastLogin: apiUser.last_login || apiUser.date_joined || new Date().toISOString(),
    createdAt: apiUser.date_joined || new Date().toISOString(),
  };
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const apiUsers = await usersApi.list();
        setUsers((apiUsers as ApiUser[]).map(mapApiUserToUIUser));
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole, filterStatus]);

  // Filtrar usuarios
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, currentPage]);

  const availableRoles = useMemo(
    () => Array.from(new Set(users.map((user) => user.role))).filter(Boolean),
    [users]
  );

  const availableStatuses = useMemo(
    () => Array.from(new Set(users.map((user) => user.status))).filter(Boolean),
    [users]
  );

  // Funciones utilitarias
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    return `Hace ${diffDays} días`;
  };
  const getRoleBadgeVariant = (role: User['role']) => {
    if (role === 'admin' || role === 'manager') return 'destructive';
    if (role === 'asistente' || role === 'sherpa' || role === 'pagos' || role === 'citas') return 'default';
    if (role === 'cliente' || role === 'usuario') return 'secondary';
    return 'outline';
  };
  const getStatusBadgeVariant = (status: User['status']) => {
    if (status === 'activo') return 'default';
    if (status === 'inactivo') return 'secondary';
    if (status === 'pendiente') return 'outline';
    return 'outline';
  };
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-6 p-6">
        <Skeleton className="h-10 w-56" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 p-6">
      <UsersHeader />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <BoxComponent 
          title="Total Usuarios" 
          value={users.length} 
        />
        <BoxComponent 
          title="Usuarios Activos" 
          value={users.filter(u => u.status === 'activo').length} 
        />
        <BoxComponent 
          title="Usuarios Inactivos" 
          value={users.filter(u => u.status === 'inactivo').length} 
        />
        <BoxComponent 
          title="Pendientes" 
          value={users.filter(u => u.status === 'pendiente').length} 
        />
      </div>
      <UsersFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterRole={filterRole}
        setFilterRole={setFilterRole}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        availableRoles={availableRoles}
        availableStatuses={availableStatuses}
      />
      <UsersList
        users={paginatedUsers}
        getRoleBadgeVariant={getRoleBadgeVariant}
        getStatusBadgeVariant={getStatusBadgeVariant}
        getInitials={getInitials}
        formatLastLogin={formatLastLogin}
        formatDate={formatDate}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {paginatedUsers.length} de {filteredUsers.length} usuarios filtrados
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground min-w-[120px] text-center">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}