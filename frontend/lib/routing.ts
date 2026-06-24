import { hasCRMAccess } from '@/lib/permissions';
import { canAccessClientPortal, getClientDashboardPath } from '@/lib/portalAccess';
import type { User, UserRole } from '@/types/auth';

export function getHomePathForRole(role: UserRole | null | undefined): string | null {
  if (role === 'cliente') return getClientDashboardPath();
  if (role && hasCRMAccess(role)) return '/crm/dashboard';
  return null;
}

export function getHomePathForUser(
  role: UserRole | null | undefined,
  user?: User | null,
): string | null {
  if (
    canAccessClientPortal({
      role,
      profileRole: user?.profile?.role,
      profileClienteId: user?.profile?.cliente,
    })
  ) {
    return getClientDashboardPath();
  }

  return getHomePathForRole(role);
}

export function isClientPortalPath(pathname: string): boolean {
  return pathname === '/client' || pathname.startsWith('/client/');
}
