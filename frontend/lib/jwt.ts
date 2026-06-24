/**
 * Utilidades para decodificar el payload de un JWT access token.
 *
 * IMPORTANTE: Esta decodificación es solo para lectura de claims (role, exp, etc.).
 * La verificación de firma ocurre en el servidor — nunca confiar en el frontend
 * para validar la autenticidad del token.
 */

import { canAccessClientPortal } from '@/lib/portalAccess';
import type { UserRole } from '@/types/auth';

/** Claims estándar + custom que el backend incluye en el JWT payload */
export interface JwtPayload {
  /** ID del usuario (claim estándar "subject") */
  user_id?: number;
  /** Username del usuario */
  username?: string;
  /** Rol del usuario (claim custom del backend) */
  role?: string;
  /** Cliente vinculado al portal (claim custom del backend) */
  cliente_id?: number;
  /** Expiración del token (Unix timestamp) */
  exp?: number;
  /** Emisión del token (Unix timestamp) */
  iat?: number;
  /** JWT ID */
  jti?: string;
  /** Token type (e.g. "access") */
  token_type?: string;
}

/** Roles válidos aceptados por el sistema */
const VALID_ROLES: UserRole[] = [
  'admin',
  'manager',
  'asistente',
  'sherpa',
  'pagos',
  'citas',
  'cliente',
];

function normalizeRoleClaim(role?: string | null): UserRole | null {
  if (!role) return null;
  const normalized = role.toLowerCase() as UserRole;
  return VALID_ROLES.includes(normalized) ? normalized : null;
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

/**
 * Decodifica el segmento payload de un JWT sin verificar la firma.
 * @returns El payload como objeto, o `null` si el token es inválido/malformado.
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // El payload es Base64URL â€” reemplazar caracteres
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if missing to prevent atob from throwing DOMException in browsers
    while (base64.length % 4) {
      base64 += '=';
    }

    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );

    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Extrae el rol del usuario desde el payload del JWT access token.
 * @returns El `UserRole` si es válido, o `null` si no se puede determinar.
 */
export function extractRoleFromToken(token: string): UserRole | null {
  return resolveRoleFromAccessToken(token);
}

export function resolveRoleFromLogin(
  token: string,
  responseRole?: string | null,
  responseClienteId?: number | null,
): UserRole | null {
  const payloadRole = resolveRoleFromAccessToken(token);
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

/**
 * Verifica si un JWT ya expiró comparando el claim `exp` con la hora actual.
 * @returns `true` si el token está vencido o no se puede decodificar.
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}
