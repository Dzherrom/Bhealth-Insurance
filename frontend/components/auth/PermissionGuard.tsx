'use client';

/**
 * Componentes de guard basados en permisos y roles.
 *
 * Uso básico — ocultar UI por permiso:
 * ```tsx
 * <PermissionGuard permission="edit_sensitive_data">
 *   <EditSensitiveDataButton />
 * </PermissionGuard>
 * ```
 *
 * Uso con fallback — mostrar alternativa si no tiene acceso:
 * ```tsx
 * <PermissionGuard permission="bulk_actions" fallback={<p>Sin acceso</p>}>
 *   <BulkActionsPanel />
 * </PermissionGuard>
 * ```
 *
 * Guard por rol exacto:
 * ```tsx
 * <RoleGuard roles={['admin', 'manager']}>
 *   <AdminPanel />
 * </RoleGuard>
 * ```
 */

import type { ReactNode } from 'react';
import { usePermission } from '@/hooks/use-permission';
import type { Permission } from '@/lib/permissions';
import type { UserRole } from '@/types/auth';

// ===============================
// PERMISSION GUARD
// ===============================

interface PermissionGuardProps {
  /** Permiso requerido para renderizar `children` */
  permission: Permission;
  /** Contenido a renderizar si el usuario tiene el permiso */
  children: ReactNode;
  /** Contenido alternativo si el usuario NO tiene el permiso. Por defecto: `null` */
  fallback?: ReactNode;
}

/**
 * Renderiza `children` solo si el usuario autenticado tiene el `permission` indicado.
 * Usa `fallback` (por defecto `null`) cuando no tiene acceso.
 */
export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const { can } = usePermission();
  return can(permission) ? <>{children}</> : <>{fallback}</>;
}

// ===============================
// ROLE GUARD
// ===============================

interface RoleGuardProps {
  /** Lista de roles con acceso. El usuario debe tener exactamente uno de ellos. */
  roles: UserRole[];
  /** Contenido a renderizar si el rol del usuario está en la lista */
  children: ReactNode;
  /** Contenido alternativo si el rol NO está en la lista. Por defecto: `null` */
  fallback?: ReactNode;
}

/**
 * Renderiza `children` solo si el rol del usuario está incluido en `roles`.
 */
export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const { role } = usePermission();
  return role && roles.includes(role) ? <>{children}</> : <>{fallback}</>;
}

// ===============================
// AUTH GUARD (protección de sesión)
// ===============================

interface AuthGuardProps {
  /** Contenido a renderizar si el usuario está autenticado */
  children: ReactNode;
  /** Contenido alternativo si NO está autenticado. Por defecto: `null` */
  fallback?: ReactNode;
}

/**
 * Renderiza `children` solo si hay una sesión activa (rol presente).
 * Complementa el middleware de rutas para casos específicos de UI.
 */
export function AuthGuard({ children, fallback = null }: AuthGuardProps) {
  const { role } = usePermission();
  return role !== null ? <>{children}</> : <>{fallback}</>;
}
