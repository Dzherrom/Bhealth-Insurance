import { decodeJwtPayload, resolveRoleClaim } from '@/lib/jwt';
import type { UserRole } from '@/types/auth';

export function setAuthCookies(accessToken: string, role: UserRole | null): void {
  if (typeof document === 'undefined') return;

  const payload = decodeJwtPayload(accessToken);
  const expStr = payload?.exp
    ? `; expires=${new Date(payload.exp * 1000).toUTCString()}`
    : '';

  document.cookie = `access_token=${accessToken}${expStr}; path=/; SameSite=Lax`;

  if (role) {
    document.cookie = `user_role=${role}${expStr}; path=/; SameSite=Lax`;
  }
}

export function clearAuthCookies(): void {
  if (typeof document === 'undefined') return;

  const expired = 'path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
  document.cookie = `access_token=; ${expired}`;
  document.cookie = `user_role=; ${expired}`;
}

export function resolveRoleFromProfile(profile?: {
  role?: string | null;
  cliente?: number | null;
} | null): UserRole | null {
  if (!profile) return null;

  const fromRole = resolveRoleClaim(profile.role);
  if (fromRole === 'cliente') return 'cliente';
  if (fromRole && fromRole !== 'cliente') return fromRole;
  if (profile.cliente) return 'cliente';

  return fromRole;
}
