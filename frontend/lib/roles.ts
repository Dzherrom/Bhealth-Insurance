/**
 * Definición central de roles y departamentos (frontend).
 * Espejo de backend/api/roles.py
 */

import type { UserRole } from '@/types/auth';

export interface DepartmentOption {
  code: string;
  label: string;
}

export interface RoleOption {
  value: string;
  label: string;
  departmentCode?: string | null;
}

export const DEPARTMENTS: DepartmentOption[] = [
  { code: 'RECEPCION', label: 'Recepción' },
  { code: 'SOPORTE_CLIENTE', label: 'Soporte al Cliente' },
  { code: 'GESTION_RESOLUCION', label: 'Gestión y Resolución' },
  { code: 'AREA_COMERCIAL', label: 'Área Comercial' },
  { code: 'HEALTH_SHERPA', label: 'Health Sherpa' },
  { code: 'AGENTES', label: 'Agentes' },
  { code: 'COBRANZA', label: 'Cobranza' },
  { code: 'RECUPERACION', label: 'Recuperación' },
];

/** Mapeo legacy JWT / cookies → rol canónico frontend */
export const LEGACY_ROLE_ALIASES: Record<string, UserRole> = {
  admin: 'super_admin',
  manager: 'led',
  asistente: 'client_support',
  sherpa: 'health_sherpa',
  pagos: 'cobranza',
  citas: 'gestion_resolucion',
};

export const CRM_ROLE_OPTIONS: RoleOption[] = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'LED', label: 'Coordinador (LED)' },
  { value: 'CLIENT_SUPPORT', label: 'Client Support', departmentCode: 'AREA_COMERCIAL' },
  { value: 'GESTION_RESOLUCION', label: 'Gestión y Resolución', departmentCode: 'GESTION_RESOLUCION' },
  { value: 'HEALTH_SHERPA', label: 'Health Sherpa', departmentCode: 'HEALTH_SHERPA' },
  { value: 'AGENTE', label: 'Agente', departmentCode: 'AGENTES' },
  { value: 'COBRANZA', label: 'Cobranza', departmentCode: 'COBRANZA' },
  { value: 'RECUPERACION', label: 'Recuperación', departmentCode: 'RECUPERACION' },
  { value: 'RECEPCION', label: 'Recepción', departmentCode: 'RECEPCION' },
  { value: 'SOPORTE_CLIENTE', label: 'Soporte al Cliente', departmentCode: 'SOPORTE_CLIENTE' },
];

export const AGENT_LINK_ROLES = new Set([
  'SUPER_ADMIN',
  'LED',
  'CLIENT_SUPPORT',
  'GESTION_RESOLUCION',
  'HEALTH_SHERPA',
  'AGENTE',
  'COBRANZA',
  'RECUPERACION',
  'RECEPCION',
  'SOPORTE_CLIENTE',
]);

export const CRM_ROLES: UserRole[] = [
  'super_admin',
  'led',
  'client_support',
  'gestion_resolucion',
  'health_sherpa',
  'agente',
  'cobranza',
  'recuperacion',
  'recepcion',
  'soporte_cliente',
];

export const ROLE_RANK: Record<string, number> = {
  SUPER_ADMIN: 100,
  LED: 90,
  SOPORTE_CLIENTE: 65,
  RECEPCION: 60,
  CLIENT_SUPPORT: 70,
  GESTION_RESOLUCION: 70,
  HEALTH_SHERPA: 70,
  AGENTE: 70,
  COBRANZA: 70,
  RECUPERACION: 70,
  CLIENTE: 20,
  USER: 10,
};

export const USER_ADMIN_ROLES: UserRole[] = ['super_admin', 'led'];

export function normalizeRoleClaim(role?: string | null): UserRole | null {
  if (!role) return null;
  const lower = role.trim().toLowerCase().replace(/-/g, '_');
  if (LEGACY_ROLE_ALIASES[lower]) {
    return LEGACY_ROLE_ALIASES[lower];
  }
  if (CRM_ROLES.includes(lower as UserRole) || lower === 'cliente') {
    return lower as UserRole;
  }
  return null;
}

export function hasCRMAccess(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return CRM_ROLES.includes(role);
}

export function isSuperAdmin(role: UserRole | null | undefined): boolean {
  return role === 'super_admin';
}

export function isDepartmentLead(role: UserRole | null | undefined): boolean {
  return role === 'led';
}

export function canManageUsers(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return USER_ADMIN_ROLES.includes(role);
}

export function roleLabel(value?: string | null): string {
  if (!value) return '—';
  const upper = value.toUpperCase();
  return CRM_ROLE_OPTIONS.find((r) => r.value === upper)?.label ?? value;
}

export function departmentLabel(code?: string | null): string {
  if (!code) return '—';
  return DEPARTMENTS.find((d) => d.code === code)?.label ?? code;
}

export function defaultDepartmentCodeForRole(role?: string | null): string | null {
  if (!role) return null;
  const upper = role.toUpperCase();
  return CRM_ROLE_OPTIONS.find((r) => r.value === upper)?.departmentCode ?? null;
}
