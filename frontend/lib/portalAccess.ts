import { CRM_ROLES, normalizeRoleClaim, hasCRMAccess } from '@/lib/roles';

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
  const employeeRole = normalizeRoleClaim(input.role || input.profileRole);
  if (employeeRole && hasCRMAccess(employeeRole)) {
    return false;
  }

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

  const normalized = normalizeRoleClaim(input.role || input.profileRole);
  if (normalized && CRM_ROLES.includes(normalized)) {
    return normalized;
  }

  return null;
}

export function getClientDashboardPath(): string {
  return '/client/dashboard';
}

export function canUseEmployeeLogin(input: PortalAccessInput): boolean {
  return !canAccessClientPortal(input);
}

export function getPortalAuthSnapshot(input: {
  role?: UserRole | null;
  profileRole?: string | null;
  profileClienteId?: number | null;
}): PortalAccessInput {
  return {
    role: input.role ?? undefined,
    profileRole: input.profileRole,
    profileClienteId: input.profileClienteId,
  };
}
