import type { UserRole } from '@/types/auth';
import { canAccessClientPortal } from '@/lib/portalAccess';

export interface MiddlewareAuthContext {
  token?: string | null;
  role?: UserRole | null;
  portalClientCookie?: string | null;
  userRoleCookie?: string | null;
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

function hasRoleSessionCookie(ctx: MiddlewareAuthContext): boolean {
  return Boolean(ctx.userRoleCookie?.trim() || ctx.portalClientCookie === '1');
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
    if (!ctx.hasValidToken || !canAccessCRM(ctx.role)) return '/auth/login';
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
