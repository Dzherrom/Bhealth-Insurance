'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UsersHeader } from '@/components/users/UsersHeader';
import { UsersFilters } from '@/components/users/UsersFilters';
import BoxComponent from '@/components/boxes/BoxComponent';
import { UsersList } from '@/components/users/UsersList';
import { User } from '@/components/users/types';
import { authApi, resolveApiMediaUrl, usersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';

import { Users, UserCheck, UserX, Clock } from 'lucide-react';

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

interface CreateUserForm {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
  status: string;
  phone: string;
}

interface EditUserForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
}

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'ASISTENTE', label: 'Asistente' },
  { value: 'SHERPA', label: 'Sherpa' },
  { value: 'PAGOS', label: 'Pagos' },
  { value: 'CITAS', label: 'Citas' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
  { value: 'CANDIDATE', label: 'Candidato' },
];

const ROLE_RANK: Record<string, number> = {
  ADMIN: 100,
  MANAGER: 90,
  ASISTENTE: 70,
  SHERPA: 70,
  PAGOS: 70,
  CITAS: 70,
  USER: 10,
};

const toBackendRole = (role?: string | null): string => {
  if (!role) return 'USER';
  if (role.toLowerCase() === 'cliente') return 'USER';
  return role.toUpperCase();
};

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
    avatar: resolveApiMediaUrl(apiUser.profile?.avatar),
    lastLogin: apiUser.last_login || apiUser.date_joined || new Date().toISOString(),
    createdAt: apiUser.date_joined || new Date().toISOString(),
  };
};

export default function UsersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const currentUserRole = useAuthStore((state) => state.role);
  const [apiUsers, setApiUsers] = useState<ApiUser[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'USER',
    status: 'ACTIVE',
    phone: '',
  });
  const [editForm, setEditForm] = useState<EditUserForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'USER',
    status: 'ACTIVE',
  });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiUsers = await usersApi.list() as ApiUser[];
      // Filtramos para que solo pasen empleados (es decir, aquellos cuyo role no sea 'USER' ni 'CLIENTE')
      const employeeUsers = apiUsers.filter(u => {
        const role = (u.profile?.role || 'USER').toUpperCase();
        return role !== 'USER' && role !== 'CLIENTE';
      });
      setApiUsers(employeeUsers);
      setUsers(employeeUsers.map(mapApiUserToUIUser));
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  const maxAssignableRank = useMemo(() => {
    const backendRole = toBackendRole(currentUserRole);
    return ROLE_RANK[backendRole] ?? ROLE_RANK.USER;
  }, [currentUserRole]);

  const allowedRoleOptions = useMemo(
    () => ROLE_OPTIONS.filter((option) => (ROLE_RANK[option.value] ?? -1) <= maxAssignableRank),
    [maxAssignableRank]
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

  const handleOpenCreateModal = () => {
    setCreateError(null);
    const defaultRole = allowedRoleOptions[0]?.value ?? 'USER';
    setIsCreateModalOpen(true);
    setCreateForm((prev) => ({ ...prev, role: defaultRole }));
  };

  const handleOpenEditModal = (id: number) => {
    const current = apiUsers.find((user) => user.id === id);
    if (!current) return;
    setSelectedUser(current);
    setEditError(null);
    setEditForm({
      firstName: current.first_name || '',
      lastName: current.last_name || '',
      email: current.email || '',
      phone: current.profile?.telefono || '',
      role: current.profile?.role || 'USER',
      status: current.profile?.status || 'ACTIVE',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEditUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditError(null);
    setIsSavingEdit(true);
    try {
      const selectedRank = ROLE_RANK[editForm.role] ?? -1;
      if (selectedRank > maxAssignableRank) {
        throw new Error('No puedes asignar un rol superior al tuyo.');
      }

      await usersApi.patch(selectedUser.id, {
        first_name: editForm.firstName,
        last_name: editForm.lastName,
        email: editForm.email,
        profile: {
          role: editForm.role,
          status: editForm.status,
          telefono: editForm.phone,
        },
      } as any);

      await fetchUsers();
      setIsEditModalOpen(false);
      toast({ title: 'Usuario actualizado' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el usuario';
      setEditError(message);
      toast({ title: 'Error al editar', description: message, variant: 'destructive' });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleResetPassword = async (id: number) => {
    setActionBusyId(id);
    try {
      const result = await usersApi.resetPassword(id);
      toast({ title: 'Contraseña restablecida', description: `Temporal: ${result.temporary_password}` });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo resetear la contraseña', variant: 'destructive' });
    } finally {
      setActionBusyId(null);
    }
  };

  const handleDeactivateUser = async (id: number) => {
    setActionBusyId(id);
    try {
      await usersApi.deactivate(id);
      await fetchUsers();
      toast({ title: 'Usuario desactivado' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo desactivar el usuario', variant: 'destructive' });
    } finally {
      setActionBusyId(null);
    }
  };

  const handleCreateUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateError(null);
    setIsCreating(true);

    try {
      const registered = await authApi.register({
        username: createForm.username,
        email: createForm.email,
        password: createForm.password,
        first_name: createForm.firstName,
        last_name: createForm.lastName,
      });

      const selectedRank = ROLE_RANK[createForm.role] ?? -1;
      if (selectedRank > maxAssignableRank) {
        throw new Error('No puedes asignar un rol superior al tuyo.');
      }

      await usersApi.patch(registered.id, {
        profile: {
          role: createForm.role,
          status: createForm.status,
          telefono: createForm.phone || '',
        },
      } as any);

      await fetchUsers();
      setIsCreateModalOpen(false);
      setCreateForm({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        role: 'USER',
        status: 'ACTIVE',
        phone: '',
      });
      toast({
        title: 'Usuario creado',
        description: 'El usuario se creó correctamente.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear el usuario';
      setCreateError(message);
      toast({
        title: 'Error al crear usuario',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="app-page flex flex-col space-y-6">
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
    <div className="app-page flex flex-col space-y-6">
      <UsersHeader onNewUser={handleOpenCreateModal} isCreating={isCreating} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[20px] mb-[24px]">
        {/* KPI 1 : Total Usuarios */}
        <div className="bg-white rounded-[16px] p-[20px] border border-[#f1f5f9] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-transform hover:-translate-y-[2px]">
          <div className="flex items-center justify-between mb-[16px]">
            <span className="text-[12px] font-bold text-[#94a3b8] uppercase tracking-[0.5px]">Total Usuarios</span>
            <Users className="w-5 h-5 text-[#4f46e5]" />
          </div>
          <div className="text-[32px] font-bold text-[#0f172a] tracking-[-0.5px] leading-[1.2]">{users.length}</div>
          <div className="text-[12px] font-semibold text-[#64748b] mt-[8px]">Empleados en el sistema</div>
        </div>

        {/* KPI 2 : Usuarios Activos */}
        <div className="bg-white rounded-[16px] p-[20px] border border-[#f1f5f9] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-transform hover:-translate-y-[2px]">
          <div className="flex items-center justify-between mb-[16px]">
            <span className="text-[12px] font-bold text-[#94a3b8] uppercase tracking-[0.5px]">Usuarios Activos</span>
            <UserCheck className="w-5 h-5 text-[#10b981]" />
          </div>
          <div className="text-[32px] font-bold text-[#0f172a] tracking-[-0.5px] leading-[1.2]">{users.filter(u => u.status === 'activo').length}</div>
          <div className="text-[12px] font-semibold text-[#10b981] mt-[8px]">Empleados operativos</div>
        </div>

        {/* KPI 3 : Usuarios Inactivos */}
        <div className="bg-white rounded-[16px] p-[20px] border border-[#f1f5f9] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-transform hover:-translate-y-[2px]">
          <div className="flex items-center justify-between mb-[16px]">
            <span className="text-[12px] font-bold text-[#94a3b8] uppercase tracking-[0.5px]">Usuarios Inactivos</span>
            <UserX className="w-5 h-5 text-[#ef4444]" />
          </div>
          <div className="text-[32px] font-bold text-[#0f172a] tracking-[-0.5px] leading-[1.2]">{users.filter(u => u.status === 'inactivo').length}</div>
          <div className="text-[12px] font-semibold text-[#ef4444] mt-[8px]">Empleados suspendidos</div>
        </div>

        {/* KPI 4 : Pendientes */}
        <div className="bg-white rounded-[16px] p-[20px] border border-[#f1f5f9] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-transform hover:-translate-y-[2px]">
          <div className="flex items-center justify-between mb-[16px]">
            <span className="text-[12px] font-bold text-[#94a3b8] uppercase tracking-[0.5px]">Pendientes</span>
            <Clock className="w-5 h-5 text-[#f59e0b]" />
          </div>
          <div className="text-[32px] font-bold text-[#0f172a] tracking-[-0.5px] leading-[1.2]">{users.filter(u => u.status === 'pendiente').length}</div>
          <div className="text-[12px] font-semibold text-[#f59e0b] mt-[8px]">Por activar o validación</div>
        </div>
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
        onViewUser={(id) => router.push(`/crm/users/${id}`)}
        onEditUser={handleOpenEditModal}
        onResetPassword={handleResetPassword}
        onDeactivateUser={handleDeactivateUser}
        actionBusyId={actionBusyId}
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

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Completa la información para registrar un nuevo usuario en el sistema.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  value={createForm.username}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, username: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  value={createForm.firstName}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <select
                  id="role"
                  value={createForm.role}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {allowedRoleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <select
                  id="status"
                  value={createForm.status}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, status: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {createError && (
              <p className="text-sm text-red-600">{createError}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Creando...' : 'Crear usuario'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Actualiza la información del usuario seleccionado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEditUser} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="editFirstName">Nombre</Label>
                <Input id="editFirstName" value={editForm.firstName} onChange={(e) => setEditForm((prev) => ({ ...prev, firstName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">Apellido</Label>
                <Input id="editLastName" value={editForm.lastName} onChange={(e) => setEditForm((prev) => ({ ...prev, lastName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">Correo</Label>
                <Input id="editEmail" type="email" value={editForm.email} onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPhone">Teléfono</Label>
                <Input id="editPhone" value={editForm.phone} onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRole">Rol</Label>
                <select id="editRole" value={editForm.role} onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {allowedRoleOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStatus">Estado</Label>
                <select id="editStatus" value={editForm.status} onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {editError && <p className="text-sm text-red-600">{editError}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSavingEdit}>{isSavingEdit ? 'Guardando...' : 'Guardar cambios'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}