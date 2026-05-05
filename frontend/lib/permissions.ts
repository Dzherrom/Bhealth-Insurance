/**
 * Sistema de permisos basado en roles (RBAC).
 *
 * Fuente de verdad: Task_roles.md — Matriz de Cumplimiento por Rol.
 * El rol del usuario se obtiene del claim `role` en el JWT access token.
 */

import type { UserRole } from '@/types/auth';

// ===============================
// PERMISOS DISPONIBLES
// ===============================

/**
 * Claves de permiso del sistema. Cada clave representa una funcionalidad
 * descrita en la Matriz de Cumplimiento (Task_roles.md).
 */
export type Permission =
  /** Administración Global: gestión de usuarios, roles y configuración del sistema */
  | 'admin_global'
  /** Configuración de API y Webhooks */
  | 'config_api_webhooks'
  /** Edición de datos sensibles: SSN, fecha de nacimiento, datos bancarios */
  | 'edit_sensitive_data'
  /** Acciones masivas sobre pólizas (hasta 50) */
  | 'bulk_actions'
  /** Creación de prospectos y nuevos clientes */
  | 'create_prospects'
  /** Descarga de documentos técnicos de pólizas */
  | 'download_docs'
  /** Conciliación de pagos y carga de comprobantes */
  | 'payment_reconciliation'
  /** Gestión de calendario y citas */
  | 'manage_calendar'
  /** Lectura del estatus de póliza (vista CRM) */
  | 'read_policy_status'
  /** Lectura de la póliza propia (portal del cliente) */
  | 'read_own_policy';

// ===============================
// MATRIZ DE PERMISOS POR ROL
// ===============================

/**
 * Define exactamente qué puede hacer cada rol.
 * Basado en Task_roles.md — Sección 1: Matriz de Cumplimiento por Rol.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'admin_global',
    'config_api_webhooks',
    'edit_sensitive_data',
    'bulk_actions',
    'create_prospects',
    'download_docs',
    'payment_reconciliation',
    'manage_calendar',
    'read_policy_status',
  ],
  manager: [
    'edit_sensitive_data',
    'bulk_actions',
    'create_prospects',
    'download_docs',
    'payment_reconciliation',
    'manage_calendar',
    'read_policy_status',
  ],
  asistente: [
    'create_prospects',
    'read_policy_status',
  ],
  sherpa: [
    'download_docs',
    'read_policy_status',
  ],
  pagos: [
    'payment_reconciliation',
    'read_policy_status',
  ],
  citas: [
    'manage_calendar',
    'read_policy_status',
  ],
  cliente: [
    'read_own_policy',
  ],
};

// ===============================
// MAPEO DE RUTAS A ROLES
// ===============================

/** Roles con acceso al panel CRM (cualquier sección) */
export const CRM_ROLES: UserRole[] = [
  'admin',
  'manager',
  'asistente',
  'sherpa',
  'pagos',
  'citas',
];

/** Roles que pueden acceder a la sección de Configuraciones */
export const CONFIG_ROLES: UserRole[] = ['admin'];

/** Roles que pueden acceder a la sección de Usuarios */
export const USERS_ADMIN_ROLES: UserRole[] = ['admin'];

// ===============================
// FUNCIONES HELPER
// ===============================

/**
 * Verifica si un rol tiene un permiso específico.
 * @param role - Rol del usuario autenticado.
 * @param permission - Clave del permiso a verificar.
 * @returns `true` si el rol tiene el permiso, `false` en caso contrario.
 */
export function hasPermission(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Verifica si un rol tiene AL MENOS UNO de los permisos indicados.
 * Útil para mostrar secciones accesibles por múltiples permisos.
 */
export function hasAnyPermission(role: UserRole | null | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Verifica si un rol tiene TODOS los permisos indicados.
 */
export function hasAllPermissions(role: UserRole | null | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Verifica si el rol tiene acceso al panel CRM.
 */
export function hasCRMAccess(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return CRM_ROLES.includes(role);
}
