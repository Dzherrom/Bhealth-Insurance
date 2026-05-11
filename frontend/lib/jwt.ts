/**
 * Utilidades para decodificar el payload de un JWT access token.
 *
 * IMPORTANTE: Esta decodificación es solo para lectura de claims (role, exp, etc.).
 * La verificación de firma ocurre en el servidor — nunca confiar en el frontend
 * para validar la autenticidad del token.
 */

import type { UserRole } from '@/types/auth';

/** Claims estándar + custom que el backend incluye en el JWT payload */
export interface JwtPayload {
  /** ID del usuario (claim estándar "subject") */
  user_id?: number;
  /** Username del usuario */
  username?: string;
  /** Rol del usuario (claim custom del backend) */
  role?: string;
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

/**
 * Decodifica el segmento payload de un JWT sin verificar la firma.
 * @returns El payload como objeto, o `null` si el token es inválido/malformado.
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // El payload es Base64URL — reemplazar caracteres y decodificar
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
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
  const payload = decodeJwtPayload(token);
  if (!payload?.role) return null;

  const role = payload.role as UserRole;
  return VALID_ROLES.includes(role) ? role : null;
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
