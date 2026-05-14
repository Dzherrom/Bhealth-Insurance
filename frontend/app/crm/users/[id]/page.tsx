'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CalendarDays, Clock, Mail, Phone, Shield, User as UserIcon } from 'lucide-react';
import { usersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

interface ApiUserProfile {
  role?: string;
  status?: string;
  avatar?: string | null;
  telefono?: string | null;
  agente?: number | null;
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

const mapRoleLabel = (role?: string) => {
  if (!role) return 'Usuario';
  return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

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
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!params.id) return;
      setIsLoading(true);
      try {
        const data = await usersApi.get(Number(params.id));
        setUser(data as ApiUser);
      } catch (error) {
        console.error('Error al cargar detalle de usuario:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [params.id]);

  const fullName = useMemo(() => {
    if (!user) return '';
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return name || user.username;
  }, [user]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
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
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Usuario no encontrado</h1>
        <p className="text-muted-foreground">No se pudo cargar la información del usuario solicitado.</p>
        <Button variant="outline" onClick={() => router.push('/crm/users')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a usuarios
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.push('/crm/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{fullName}</h1>
            <p className="text-muted-foreground">@{user.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
              <p className="text-sm text-muted-foreground">Nombre completo</p>
              <p className="font-medium">{fullName}</p>
            </div>
            <Separator />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Nombre de usuario</p>
              <p className="font-medium">{user.username}</p>
            </div>
            <Separator />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Correo</p>
              <p className="font-medium flex items-center gap-2"><Mail className="h-4 w-4" />{user.email}</p>
            </div>
            <Separator />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Teléfono</p>
              <p className="font-medium flex items-center gap-2"><Phone className="h-4 w-4" />{user.profile?.telefono || 'Sin teléfono'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Permisos y Actividad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Rol del sistema</p>
              <p className="font-medium">{mapRoleLabel(user.profile?.role || 'USER')}</p>
            </div>
            <Separator />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Estado del perfil</p>
              <p className="font-medium">{mapStatusLabel(user.profile?.status)}</p>
            </div>
            <Separator />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Fecha de alta</p>
              <p className="font-medium flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDate(user.date_joined)}</p>
            </div>
            <Separator />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Último inicio de sesión</p>
              <p className="font-medium flex items-center gap-2"><Clock className="h-4 w-4" />{formatDateTime(user.last_login)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
