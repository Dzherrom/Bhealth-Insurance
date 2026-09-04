import { extractRoleFromToken } from '@/lib/jwt';
import type { UserRole } from '@/types/auth';
import { canAccessClientPortal } from '@/lib/portalAccess';

export interface MiddlewareAuthContext {
  token?: string | null;
  role?: UserRole | null;
  portalClientCookie?: string | null;
  userRoleCookie?: string | null;
  authSessionCookie?: string | null;
  jwtClienteId?: number | null;
}

export function isPortalClientSession(ctx: MiddlewareAuthContext): boolean {
  if (ctx.portalClientCookie === '1') return true;
  if (ctx.role === 'cliente') return true;
  if (ctx.userRoleCookie?.toLowerCase() === 'cliente') return true;
  if (ctx.jwtClienteId) return true;

  return canAccessClientPortal({
    role: ctx.role ?? undefined,
    clienteId: ctx.jwtClienteId ?? undefined,
  });
}

import { hasCRMAccess, normalizeRoleClaim } from '@/lib/roles';

export function canAccessCRM(role: UserRole | null | undefined): boolean {
  return hasCRMAccess(role);
}

/** Rol efectivo: JWT/cookie parseada o user_role de sesión ligera. */
export function resolveEffectiveRole(ctx: MiddlewareAuthContext): UserRole | null {
  if (ctx.role) return ctx.role;

  const fromRoleCookie = normalizeRoleClaim(decodeCookieValue(ctx.userRoleCookie));
  if (fromRoleCookie) return fromRoleCookie;

  // Con auth_session=1, inferir rol del JWT aunque el edge considere el token expirado.
  if (ctx.authSessionCookie === '1' && ctx.token) {
    const fromToken = extractRoleFromToken(ctx.token);
    if (fromToken) return fromToken;
  }

  return null;
}

function decodeCookieValue(value?: string | null): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function resolveMiddlewareRedirect(
  pathname: string,
  ctx: MiddlewareAuthContext & { hasValidToken: boolean },
): string | null {
  const portalClient = isPortalClientSession(ctx);
  const effectiveRole = resolveEffectiveRole(ctx);

  if (pathname.startsWith('/crm')) {
    if (!ctx.hasValidToken) return '/auth/login';
    if (portalClient) return '/client/dashboard';
    if (!canAccessCRM(effectiveRole)) return '/auth/login';
    return null;
  }

  if (pathname === '/auth/login') {
    if (portalClient && ctx.hasValidToken) return '/client/dashboard';
    if (canAccessCRM(effectiveRole) && ctx.hasValidToken) return '/crm/dashboard';
    return null;
  }

  if (pathname.startsWith('/client/')) {
    if (!ctx.hasValidToken) return '/client';

    if (!portalClient) {
      if (canAccessCRM(effectiveRole)) return '/crm/dashboard';
      return '/client';
    }
    return null;
  }

  return null;
}
