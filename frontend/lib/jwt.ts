/**
 * Utilidades para decodificar el payload de un JWT access token.
 */

import { canAccessClientPortal } from '@/lib/portalAccess';
import { LEGACY_ROLE_ALIASES, normalizeRoleClaim, hasCRMAccess } from '@/lib/roles';
import type { UserRole } from '@/types/auth';

export interface JwtPayload {
  user_id?: number;
  username?: string;
  role?: string;
  cliente_id?: number;
  exp?: number;
  iat?: number;
  jti?: string;
  token_type?: string;
}

export function resolveRoleClaim(role?: string | null): UserRole | null {
  return normalizeRoleClaim(role);
}

export function resolveRoleFromAccessToken(token: string): UserRole | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const fromRole = normalizeRoleClaim(payload.role);
  if (fromRole) return fromRole;
  if (payload.cliente_id) return 'cliente';

  return null;
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }

    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );

    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function extractRoleFromToken(token: string): UserRole | null {
  return resolveRoleFromAccessToken(token);
}

export function resolveRoleFromLogin(
  token: string,
  responseRole?: string | null,
  responseClienteId?: number | null,
): UserRole | null {
  const payloadRole = resolveRoleFromAccessToken(token);

  if (payloadRole && hasCRMAccess(payloadRole)) {
    return payloadRole;
  }

  if (payloadRole === 'cliente') return 'cliente';

  if (
    canAccessClientPortal({
      role: responseRole,
      clienteId: responseClienteId ?? decodeJwtPayload(token)?.cliente_id ?? null,
    })
  ) {
    return 'cliente';
  }

  return payloadRole ?? resolveRoleClaim(responseRole);
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

/** @deprecated Usar normalizeRoleClaim desde @/lib/roles */
export { LEGACY_ROLE_ALIASES };
