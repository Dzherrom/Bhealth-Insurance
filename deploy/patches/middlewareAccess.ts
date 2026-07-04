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

import { hasCRMAccess } from '@/lib/roles';

export function canAccessCRM(role: UserRole | null | undefined): boolean {
  return hasCRMAccess(role);
}

function decodeCookieValue(value?: string | null): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function hasRoleSessionCookie(ctx: MiddlewareAuthContext): boolean {
  const role = decodeCookieValue(ctx.userRoleCookie);
  return Boolean(role?.trim() || ctx.portalClientCookie === '1' || ctx.authSessionCookie === '1');
}

export function resolveMiddlewareRedirect(
  pathname: string,
  ctx: MiddlewareAuthContext & { hasValidToken: boolean },
): string | null {
  const portalClient = isPortalClientSession(ctx);
  const hasSessionHint = ctx.hasValidToken || hasRoleSessionCookie(ctx);

  if (pathname.startsWith('/crm')) {
    if (portalClient) return '/client/dashboard';
    if (canAccessCRM(ctx.role) && hasSessionHint) return null;
    // JWT válido pero rol aún no parseado: dejar pasar si hay sesión CRM en cookie
    if (ctx.hasValidToken && hasSessionHint && ctx.role == null) return null;
    if (!hasSessionHint) return '/auth/login';
    if (!canAccessCRM(ctx.role)) return '/auth/login';
    return null;
  }

  if (pathname === '/auth/login') {
    if (portalClient && hasSessionHint) return '/client/dashboard';
    if (canAccessCRM(ctx.role) && hasSessionHint) return '/crm/dashboard';
    return null;
  }

  if (pathname.startsWith('/client/')) {
    // Portal: confiar en cookies ligeras (portal_client, user_role). El JWT puede
    // vivir solo en localStorage; el edge no siempre recibe access_token a tiempo.
    if (portalClient && hasSessionHint) return null;

    if (!ctx.token) return '/client';

    if (!ctx.hasValidToken) return '/client';

    if (!portalClient) {
      if (canAccessCRM(ctx.role)) return '/crm/dashboard';
      return '/client';
    }
    return null;
  }

  return null;
}
