import type { UserRole } from '@/types/auth';

/** Perfiles del backend que pueden usar el portal si tienen cliente vinculado. */
const PORTAL_PROFILE_ROLES = new Set(['CLIENTE', 'USER']);

export interface PortalAccessInput {
  role?: string | null;
  clienteId?: number | null;
  profileRole?: string | null;
  profileClienteId?: number | null;
}

export function hasLinkedCliente(input: PortalAccessInput): boolean {
  return Boolean(input.clienteId || input.profileClienteId);
}

export function isPortalProfileRole(role?: string | null): boolean {
  if (!role) return false;
  return PORTAL_PROFILE_ROLES.has(role.trim().toUpperCase());
}

/** Determina si la cuenta puede usar el portal del cliente. */
export function canAccessClientPortal(input: PortalAccessInput): boolean {
  if (hasLinkedCliente(input)) {
    return true;
  }

  const normalized = (input.role || input.profileRole || '').trim().toLowerCase();
  return normalized === 'cliente';
}

/** Normaliza cualquier señal de portal a `cliente` para rutas y permisos del frontend. */
export function resolvePortalRole(input: PortalAccessInput): UserRole | null {
  if (canAccessClientPortal(input)) {
    return 'cliente';
  }

  const normalized = (input.role || input.profileRole || '').trim().toLowerCase() as UserRole;
  const crmRoles: UserRole[] = [
    'admin',
    'manager',
    'asistente',
    'sherpa',
    'pagos',
    'citas',
  ];

  return crmRoles.includes(normalized) ? normalized : null;
}

export function getClientDashboardPath(): string {
  return '/client/dashboard';
}
