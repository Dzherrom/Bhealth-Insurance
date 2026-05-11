/**
 * Hook para verificar permisos del usuario autenticado.
 *
 * Lee el rol del JWT (almacenado en authStore) y expone helpers
 * para evaluar permisos sin importar la lógica de la matriz en cada componente.
 *
 * @example
 * const { can, role, isAdmin, isCRMUser } = usePermission();
 *
 * if (can('edit_sensitive_data')) { ... }
 * if (isAdmin) { ... }
 */

import { useAuthStore } from '@/store/authStore';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasCRMAccess,
  type Permission,
} from '@/lib/permissions';
import type { UserRole } from '@/types/auth';

export interface UsePermissionReturn {
  /** Rol actual del usuario, o `null` si no está autenticado */
  role: UserRole | null;

  /**
   * Verifica si el usuario tiene un permiso específico.
   * @example can('create_prospects')
   */
  can: (permission: Permission) => boolean;

  /**
   * Verifica si el usuario tiene AL MENOS UNO de los permisos indicados.
   * @example canAny(['download_docs', 'edit_sensitive_data'])
   */
  canAny: (permissions: Permission[]) => boolean;

  /**
   * Verifica si el usuario tiene TODOS los permisos indicados.
   * @example canAll(['create_prospects', 'edit_sensitive_data'])
   */
  canAll: (permissions: Permission[]) => boolean;

  /** `true` si el rol es `admin` */
  isAdmin: boolean;

  /** `true` si el rol es `admin` o `manager` */
  isManagerOrAbove: boolean;

  /**
   * `true` si el usuario pertenece al equipo CRM
   * (admin, manager, asistente, sherpa, pagos o citas).
   * `false` para el rol `cliente`.
   */
  isCRMUser: boolean;

  /** `true` si el rol es `cliente` (portal del asegurado) */
  isClient: boolean;
}

export function usePermission(): UsePermissionReturn {
  const role = useAuthStore((state) => state.role);

  return {
    role,

    can: (permission: Permission) => hasPermission(role, permission),

    canAny: (permissions: Permission[]) => hasAnyPermission(role, permissions),

    canAll: (permissions: Permission[]) => hasAllPermissions(role, permissions),

    isAdmin: role === 'admin',

    isManagerOrAbove: role === 'admin' || role === 'manager',

    isCRMUser: hasCRMAccess(role),

    isClient: role === 'cliente',
  };
}
