'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CalendarDays, Clock, Mail, Phone, Shield, User as UserIcon, Pencil } from 'lucide-react';
import { agentesApi, departamentosApi, resolveApiMediaUrl, usersApi, type Departamento } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { AGENT_LINK_ROLES, CRM_ROLE_OPTIONS, ROLE_RANK, defaultDepartmentCodeForRole, roleLabel } from '@/lib/roles';
import { useAuthStore } from '@/store/authStore';

interface ApiUserProfile {
  role?: string;
  status?: string;
  avatar?: string | null;
  telefono?: string | null;
  npn?: string | null;
  ssn?: string | null;
  agente?: number | null;
  agente_npn?: string | null;
  agente_ffm?: string | null;
  departamento?: number | null;
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

interface EditProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  npn: string;
  ssn: string;
  role: string;
  status: string;
  departamento: number | null;
}

const AGENT_ROLES = AGENT_LINK_ROLES;
const ROLE_OPTIONS = [...CRM_ROLE_OPTIONS, { value: 'USER', label: 'Usuario' }];

const resolveDepartamentoForRole = (
  role: string,
  departments: Departamento[],
  current?: number | null,
): number | null => {
  const code = defaultDepartmentCodeForRole(role);
  if (!code) return current ?? null;
  const dept = departments.find((d) => d.codigo === code);
  return dept?.id ?? current ?? null;
};

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
  { value: 'CANDIDATE', label: 'Candidato' },
];

const toBackendRole = (role?: string | null): string => {
  if (!role) return 'USER';
  if (role.toLowerCase() === 'cliente') return 'USER';
  return role.toUpperCase();
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Sin registro';
  return new Date(value).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Sin registro';
  return new Date(value).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const mapRoleLabel = (role?: string) => roleLabel(role);

const mapStatusLabel = (status?: string) => {
  if (!status) return 'Pendiente';
  if (status === 'ACTIVE') return 'Activo';
  if (status === 'INACTIVE') return 'Inactivo';
  if (status === 'CANDIDATE') return 'Candidato';
  return status;
};

const statusVariant = (status?: string): 'default' | 'secondary' | 'outline' => {
  if (status === 'ACTIVE') return 'default';
  if (status === 'INACTIVE') return 'secondary';
  return 'outline';
};

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const currentUserRole = useAuthStore((state) => state.role);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [agentNpn, setAgentNpn] = useState('');
  const [agentFfm, setAgentFfm] = useState('');
  const [isSavingAgent, setIsSavingAgent] = useState(false);
  const [agentPolizas, setAgentPolizas] = useState<any[]>([]);
  const [agentClientes, setAgentClientes] = useState<any[]>([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [departments, setDepartments] = useState<Departamento[]>([]);
  const [form, setForm] = useState<EditProfileForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    npn: '',
    ssn: '',
    role: 'USER',
    status: 'ACTIVE',
    departamento: null,
  });

  const fetchUser = async () => {
    if (!params.id) return;
    setIsLoading(true);
    try {
      const data = await usersApi.get(Number(params.id));
      const typedData = data as ApiUser;
      setUser(typedData);
      setForm({
        firstName: typedData.first_name || '',
        lastName: typedData.last_name || '',
        email: typedData.email || '',
        phone: typedData.profile?.telefono || '',
        npn: typedData.profile?.npn || typedData.profile?.agente_npn || '',
        ssn: typedData.profile?.ssn || '',
        role: typedData.profile?.role || 'USER',
        status: typedData.profile?.status || 'ACTIVE',
        departamento: typedData.profile?.departamento ?? null,
      });
      setAgentNpn(typedData.profile?.npn || typedData.profile?.agente_npn || '');
      setAgentFfm(typedData.profile?.agente_ffm || '');
    } catch (error) {
      console.error('Error al cargar detalle de usuario:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    departamentosApi.list().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    const agenteId = user?.profile?.agente;
    if (!agenteId) {
      setAgentPolizas([]);
      setAgentClientes([]);
      return;
    }

    let cancelled = false;
    setLoadingPortfolio(true);
    Promise.all([agentesApi.listPolizas(agenteId), agentesApi.listClientes(agenteId)])
      .then(([polizas, clientes]) => {
        if (!cancelled) {
          setAgentPolizas(Array.isArray(polizas) ? polizas : []);
          setAgentClientes(Array.isArray(clientes) ? clientes : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAgentPolizas([]);
          setAgentClientes([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPortfolio(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.profile?.agente]);

  const fullName = useMemo(() => {
    if (!user) return '';
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return name || user.username;
  }, [user]);

  const maxAssignableRank = useMemo(() => {
    const backendRole = toBackendRole(currentUserRole);
    return ROLE_RANK[backendRole] ?? ROLE_RANK.USER;
  }, [currentUserRole]);

  const allowedRoleOptions = useMemo(
    () => ROLE_OPTIONS.filter((option) => (ROLE_RANK[option.value] ?? -1) <= maxAssignableRank),
    [maxAssignableRank]
  );

  const displayAvatar = avatarPreview || resolveApiMediaUrl(user?.profile?.avatar) || undefined;

  const departmentName = useMemo(() => {
    const deptId = user?.profile?.departamento;
    if (!deptId) return 'Sin asignar';
    return departments.find((d) => d.id === deptId)?.nombre ?? 'Sin asignar';
  }, [user?.profile?.departamento, departments]);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAvatarFile(file);
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
    } else {
      setAvatarPreview(null);
    }
  };

  const handleSaveAgentCredentials = async () => {
    if (!user?.id) return;

    setIsSavingAgent(true);
    try {
      await usersApi.patch(user.id, {
        profile: {
          npn: agentNpn.trim() || null,
        },
      } as any);
      if (user.profile?.agente && agentFfm.trim()) {
        await agentesApi.patch(user.profile.agente, {
          ffm: agentFfm.trim(),
        } as any);
      }
      await fetchUser();
      toast({ title: 'Credenciales actualizadas', description: 'NPN y FFM del empleado guardados correctamente.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudieron guardar las credenciales';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsSavingAgent(false);
    }
  };

  const handleEditSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.id) return;

    setSaveError(null);
    setIsSaving(true);
    try {
      const selectedRank = ROLE_RANK[form.role] ?? -1;
      if (selectedRank > maxAssignableRank) {
        throw new Error('No puedes asignar un rol superior al tuyo.');
      }

      await usersApi.patch(user.id, {
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        profile: {
          role: form.role,
          status: form.status,
          telefono: form.phone,
          npn: form.npn.trim() || null,
          ssn: form.ssn.trim() || null,
          departamento: form.departamento,
        },
      } as any);

      if (avatarFile) {
        await usersApi.uploadAvatar(user.id, avatarFile);
      }

      await fetchUser();
      setIsEditOpen(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast({ title: 'Perfil actualizado', description: 'Los cambios se guardaron correctamente.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el perfil';
      setSaveError(message);
      toast({ title: 'Error al actualizar', description: message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="app-page space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-[420px]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-page space-y-4">
        <h1 className="text-2xl font-semibold">Usuario no encontrado</h1>
        <p className="text-muted-foreground dark:text-gray-400">No se pudo cargar la información del usuario solicitado.</p>
        <Button variant="outline" onClick={() => router.push('/crm/users')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a usuarios
        </Button>
      </div>
    );
  }

  return (
    <div className="app-page space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.push('/crm/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Avatar className="h-12 w-12 border">
            <AvatarImage src={displayAvatar} />
            <AvatarFallback>{(fullName || user.username).slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{fullName}</h1>
            <p className="text-muted-foreground dark:text-gray-400">@{user.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar Perfil
          </Button>
          <Badge variant={statusVariant(user.profile?.status)}>{mapStatusLabel(user.profile?.status)}</Badge>
          <Badge variant="outline">{mapRoleLabel(user.profile?.role || 'USER')}</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{mapStatusLabel(user.profile?.status)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rol</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{mapRoleLabel(user.profile?.role || 'USER')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Departamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{departmentName}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Registro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{formatDate(user.date_joined)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Último Acceso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{formatDateTime(user.last_login)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground dark:text-gray-400">Nombre completo</p>
              <p className="font-medium">{fullName}</p>
            </div>
            <Separator />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground dark:text-gray-400">Nombre de usuario</p>
              <p className="font-medium">{user.username}</p>
            </div>
            <Separator />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground dark:text-gray-400">Correo</p>
              <p className="font-medium flex items-center gap-2"><Mail className="h-4 w-4" />{user.email}</p>
            </div>
            <Separator />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground dark:text-gray-400">Teléfono</p>
              <p className="font-medium flex items-center gap-2"><Phone className="h-4 w-4" />{user.profile?.telefono || 'Sin teléfono'}</p>
            </div>
            <Separator />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground dark:text-gray-400">NPN</p>
              <p className="font-medium">{user.profile?.npn || user.profile?.agente_npn || 'Sin NPN'}</p>
            </div>
            <Separator />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground dark:text-gray-400">SSN</p>
              <p className="font-medium">{user.profile?.ssn || 'Sin SSN'}</p>
            </div>
          </CardContent>
        </Card>

        {AGENT_ROLES.has(user.profile?.role || '') && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Credenciales de Mercado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="agentNpn">NPN</Label>
                  <Input
                    id="agentNpn"
                    value={agentNpn}
                    onChange={(e) => setAgentNpn(e.target.value)}
                    placeholder="Número NPN del empleado"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agentFfm">FFM</Label>
                  <Input
                    id="agentFfm"
                    value={agentFfm}
                    onChange={(e) => setAgentFfm(e.target.value)}
                    placeholder="FFM usado en el mercado"
                    disabled={!user.profile?.agente}
                  />
                </div>
              </div>
              {!user.profile?.agente && (
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  Al guardar el NPN se vinculará automáticamente un registro de agente para este empleado.
                </p>
              )}
              <Button type="button" onClick={handleSaveAgentCredentials} disabled={isSavingAgent || !agentNpn.trim()}>
                {isSavingAgent ? 'Guardando...' : 'Guardar credenciales'}
              </Button>
            </CardContent>
          </Card>
        )}

        {AGENT_ROLES.has(user.profile?.role || '') && user.profile?.agente ? (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Cartera del agente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingPortfolio ? (
                <p className="text-sm text-muted-foreground">Cargando cartera...</p>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-semibold mb-2">Clientes vinculados ({agentClientes.length})</p>
                    {agentClientes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sin clientes asignados.</p>
                    ) : (
                      <ul className="space-y-2 max-h-40 overflow-y-auto">
                        {agentClientes.map((cliente) => (
                          <li key={cliente.id} className="text-sm border rounded-md px-3 py-2">
                            {[cliente.primer_nombre, cliente.apellido_paterno].filter(Boolean).join(' ') || `Cliente #${cliente.id}`}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2">Pólizas vinculadas ({agentPolizas.length})</p>
                    {agentPolizas.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sin pólizas asignadas.</p>
                    ) : (
                      <ul className="space-y-2 max-h-48 overflow-y-auto">
                        {agentPolizas.map((poliza) => (
                          <li key={poliza.id}>
                            <button
                              type="button"
                              className="w-full text-left text-sm border rounded-md px-3 py-2 hover:bg-muted"
                              onClick={() => router.push(`/crm/polizas/${poliza.id}`)}
                            >
                              <span className="font-medium">{poliza.id_mercado}</span>
                              <span className="text-muted-foreground"> · {poliza.estado_nombre || 'Sin estatus'}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Permisos y Actividad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground dark:text-gray-400">Rol del sistema</p>
              <p className="font-medium">{mapRoleLabel(user.profile?.role || 'USER')}</p>
            </div>
            <Separator />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground dark:text-gray-400">Departamento</p>
              <p className="font-medium">{departmentName}</p>
            </div>
            <Separator />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground dark:text-gray-400">Estado del perfil</p>
              <p className="font-medium">{mapStatusLabel(user.profile?.status)}</p>
            </div>
            <Separator />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground dark:text-gray-400">Fecha de alta</p>
              <p className="font-medium flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDate(user.date_joined)}</p>
            </div>
            <Separator />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground dark:text-gray-400">Último inicio de sesión</p>
              <p className="font-medium flex items-center gap-2"><Clock className="h-4 w-4" />{formatDateTime(user.last_login)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Perfil de Usuario</DialogTitle>
            <DialogDescription>
              Actualiza los datos del usuario y su avatar.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="npn">NPN</Label>
                <Input
                  id="npn"
                  value={form.npn}
                  onChange={(e) => setForm((prev) => ({ ...prev, npn: e.target.value }))}
                  placeholder="Número NPN del empleado"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ssn">SSN</Label>
                <Input
                  id="ssn"
                  value={form.ssn}
                  onChange={(e) => setForm((prev) => ({ ...prev, ssn: e.target.value }))}
                  placeholder="XXX-XX-XXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <select
                  id="role"
                  value={form.role}
                  onChange={(e) => {
                    const nextRole = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      role: nextRole,
                      departamento: resolveDepartamentoForRole(nextRole, departments, prev.departamento),
                    }));
                  }}
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
                <Label htmlFor="departamento">Departamento</Label>
                <select
                  id="departamento"
                  value={form.departamento ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      departamento: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Sin asignar</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
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

            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar</Label>
              <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} />
            </div>

            {saveError && <p className="text-sm text-red-600">{saveError}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
