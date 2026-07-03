/**
 * Sistema de permisos basado en roles (RBAC).
 * Alineado con la arquitectura operativa BHealth Insurance.
 */

import type { UserRole } from '@/types/auth';
import {
  CRM_ROLES,
  hasCRMAccess as rolesHasCRMAccess,
  isSuperAdmin,
  USER_ADMIN_ROLES,
} from '@/lib/roles';

export type Permission =
  | 'admin_global'
  | 'config_api_webhooks'
  | 'manage_users'
  | 'manage_departments'
  | 'audit_trail'
  | 'master_export'
  | 'global_messaging'
  | 'edit_sensitive_data'
  | 'bulk_actions'
  | 'assign_workload'
  | 'dept_notifications'
  | 'create_prospects'
  | 'live_form_monitoring'
  | 'own_portfolio_only'
  | 'block_print'
  | 'download_docs'
  | 'policy_status_change'
  | 'assign_ffm_id'
  | 'npn_scoped_policies'
  | 'payment_reconciliation'
  | 'payment_evidence_upload'
  | 'manage_calendar'
  | 'appointment_status'
  | 'portfolio_recovery'
  | 'read_policy_status'
  | 'read_own_policy';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'admin_global',
    'config_api_webhooks',
    'manage_users',
    'manage_departments',
    'audit_trail',
    'master_export',
    'global_messaging',
    'edit_sensitive_data',
    'bulk_actions',
    'assign_workload',
    'dept_notifications',
    'create_prospects',
    'live_form_monitoring',
    'download_docs',
    'policy_status_change',
    'assign_ffm_id',
    'payment_reconciliation',
    'payment_evidence_upload',
    'manage_calendar',
    'appointment_status',
    'portfolio_recovery',
    'read_policy_status',
  ],
  led: [
    'manage_users',
    'assign_workload',
    'dept_notifications',
    'edit_sensitive_data',
    'bulk_actions',
    'create_prospects',
    'download_docs',
    'policy_status_change',
    'payment_reconciliation',
    'manage_calendar',
    'read_policy_status',
  ],
  client_support: [
    'create_prospects',
    'live_form_monitoring',
    'own_portfolio_only',
    'block_print',
    'read_policy_status',
  ],
  gestion_resolucion: [
    'manage_calendar',
    'appointment_status',
    'read_policy_status',
  ],
  health_sherpa: [
    'download_docs',
    'policy_status_change',
    'assign_ffm_id',
    'npn_scoped_policies',
    'read_policy_status',
  ],
  agente: [
    'download_docs',
    'policy_status_change',
    'assign_ffm_id',
    'npn_scoped_policies',
    'read_policy_status',
  ],
  cobranza: [
    'payment_reconciliation',
    'payment_evidence_upload',
    'read_policy_status',
  ],
  recuperacion: [
    'portfolio_recovery',
    'read_policy_status',
  ],
  recepcion: [
    'read_policy_status',
  ],
  soporte_cliente: [
    'read_policy_status',
  ],
  cliente: [
    'read_own_policy',
  ],
};

export { CRM_ROLES };
export const CONFIG_ROLES: UserRole[] = ['super_admin'];
export const USERS_ADMIN_ROLES: UserRole[] = USER_ADMIN_ROLES;

export function hasPermission(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: UserRole | null | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: UserRole | null | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.every((p) => hasPermission(role, p));
}

export function hasCRMAccess(role: UserRole | null | undefined): boolean {
  return rolesHasCRMAccess(role);
}

export { isSuperAdmin };
