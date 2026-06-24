import { decodeJwtPayload, resolveRoleClaim } from '@/lib/jwt';
import { canAccessClientPortal } from '@/lib/portalAccess';
import type { UserRole } from '@/types/auth';

export function setAuthCookies(accessToken: string, role: UserRole | null): void {
  if (typeof document === 'undefined') return;

  const payload = decodeJwtPayload(accessToken);
  const expStr = payload?.exp
    ? `; expires=${new Date(payload.exp * 1000).toUTCString()}`
    : '';

  document.cookie = `access_token=${accessToken}${expStr}; path=/; SameSite=Lax`;

  const isPortalClient =
    role === 'cliente' ||
    canAccessClientPortal({ role, clienteId: payload?.cliente_id ?? null });

  if (role) {
    document.cookie = `user_role=${role}${expStr}; path=/; SameSite=Lax`;
  }

  if (isPortalClient) {
    document.cookie = `portal_client=1${expStr}; path=/; SameSite=Lax`;
  } else {
    document.cookie = 'portal_client=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
  }
}

export function clearAuthCookies(): void {
  if (typeof document === 'undefined') return;

  const expired = 'path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
  document.cookie = `access_token=; ${expired}`;
  document.cookie = `user_role=; ${expired}`;
  document.cookie = `portal_client=; ${expired}`;
}

export function resolveRoleFromProfile(profile?: {
  role?: string | null;
  cliente?: number | null;
} | null): UserRole | null {
  if (!profile) return null;

  if (
    canAccessClientPortal({
      profileRole: profile.role,
      profileClienteId: profile.cliente,
    })
  ) {
    return 'cliente';
  }

  return resolveRoleClaim(profile.role);
}
