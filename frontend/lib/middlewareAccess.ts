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

export function canAccessCRM(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return ['admin', 'manager', 'asistente', 'sherpa', 'pagos', 'citas'].includes(role);
}

export function resolveMiddlewareRedirect(
  pathname: string,
  ctx: MiddlewareAuthContext & { hasValidToken: boolean },
): string | null {
  const portalClient = isPortalClientSession(ctx);

  if (pathname.startsWith('/crm')) {
    if (portalClient) return '/client/dashboard';
    if (!ctx.hasValidToken || !canAccessCRM(ctx.role)) return '/auth/login';
    return null;
  }

  if (pathname === '/auth/login') {
    if (portalClient && ctx.hasValidToken) return '/client/dashboard';
    return null;
  }

  if (pathname.startsWith('/client/')) {
    const hasTokenCookie = Boolean(ctx.token);

    if (!hasTokenCookie) return '/client';

    // Sesión de portal: dejar pasar y validar en el cliente (evita loop con Zustand).
    if (isPortalClientSession(ctx)) return null;

    if (!ctx.hasValidToken) return '/client';

    if (!portalClient) {
      if (canAccessCRM(ctx.role)) return '/crm/dashboard';
      return '/client';
    }
    return null;
  }

  return null;
}
