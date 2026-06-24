import { hasCRMAccess } from '@/lib/permissions';
import type { UserRole } from '@/types/auth';

export function getHomePathForRole(role: UserRole | null | undefined): string | null {
  if (role === 'cliente') return '/client/dashboard';
  if (role && hasCRMAccess(role)) return '/crm/dashboard';
  return null;
}

export function isClientPortalPath(pathname: string): boolean {
  return pathname === '/client' || pathname.startsWith('/client/');
}
