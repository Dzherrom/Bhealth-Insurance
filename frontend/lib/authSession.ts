import { decodeJwtPayload, resolveRoleClaim } from '@/lib/jwt';
import { canAccessClientPortal } from '@/lib/portalAccess';
import type { UserRole } from '@/types/auth';

function cookieSuffix(exp?: number): string {
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; Secure'
      : '';
  const expStr = exp ? `; expires=${new Date(exp * 1000).toUTCString()}` : '';
  return `${expStr}; path=/; SameSite=Lax${secure}`;
}

export function setAuthCookies(accessToken: string, role: UserRole | null): void {
  if (typeof document === 'undefined') return;

  const payload = decodeJwtPayload(accessToken);
  const suffix = cookieSuffix(payload?.exp);

  document.cookie = `access_token=${encodeURIComponent(accessToken)}${suffix}`;

  const isPortalClient =
    role === 'cliente' ||
    canAccessClientPortal({ role, clienteId: payload?.cliente_id ?? null });

  if (role) {
    document.cookie = `user_role=${encodeURIComponent(role)}${suffix}`;
  }

  if (isPortalClient) {
    document.cookie = `portal_client=1${suffix}`;
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

export function readPortalAuthState(input: {
  role?: UserRole | null;
  profileRole?: string | null;
  profileClienteId?: number | null;
}) {
  return canAccessClientPortal({
    role: input.role ?? undefined,
    profileRole: input.profileRole,
    profileClienteId: input.profileClienteId,
  });
}
