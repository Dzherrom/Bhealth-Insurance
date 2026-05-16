/**
 * Middleware de Next.js — Protección de rutas por rol.
 *
 * Corre en Edge Runtime. Lee el JWT desde la cookie `access_token`
 * (sincronizada por authStore en cada login/refresh) y valida el rol
 * antes de permitir el acceso a rutas protegidas.
 *
 * Flujo de redirección:
 *  - Sin token o token vencido   → /auth/login?redirect=<ruta>
 *  - Rol insuficiente en /crm/** → /crm/dashboard  (si es usuario CRM)
 *                                → /auth/login      (si es cliente)
 *  - Rol insuficiente en /client → /auth/login
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractRoleFromToken, isTokenExpired } from '@/lib/jwt';
import { hasCRMAccess, CONFIG_ROLES, USERS_ADMIN_ROLES, CRM_ROLES } from '@/lib/permissions';
import type { UserRole } from '@/types/auth';

// -----------------------------------------------
// Reglas de acceso: orden importa (más específico primero)
// -----------------------------------------------

interface RouteRule {
  prefix: string;
  allowedRoles: UserRole[];
  /** URL a la que redirigir si el rol no tiene acceso pero sí hay sesión */
  fallbackAuthenticated: string;
}

const ROUTE_RULES: RouteRule[] = [
  {
    prefix: '/crm/configuraciones',
    allowedRoles: CONFIG_ROLES,
    fallbackAuthenticated: '/crm/dashboard',
  },
  {
    prefix: '/crm/users',
    allowedRoles: USERS_ADMIN_ROLES,
    fallbackAuthenticated: '/crm/dashboard',
  },
  {
    prefix: '/crm',
    allowedRoles: CRM_ROLES,
    fallbackAuthenticated: '/auth',
  },
  {
    prefix: '/client',
    allowedRoles: ['cliente'],
    fallbackAuthenticated: '/crm/dashboard',
  },
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Buscar la regla aplicable (la primera que coincida gana)
  const rule = ROUTE_RULES.find((r) => pathname.startsWith(r.prefix));

  // Ruta no protegida — continuar sin restricciones
  if (!rule) return NextResponse.next();

  // Leer token desde cookie (sincronizada por authStore)
  const token = request.cookies.get('access_token')?.value;

  // Sin token o token vencido → login con redirect de vuelta
  if (!token || isTokenExpired(token)) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Extraer y validar el rol del token
  const role = extractRoleFromToken(token);

  if (!role || !rule.allowedRoles.includes(role)) {
    // Usuario autenticado sin el rol requerido
    const fallback = hasCRMAccess(role)
      ? new URL(rule.fallbackAuthenticated, request.url)
      : new URL('/auth/login', request.url);
    return NextResponse.redirect(fallback);
  }

  // Acceso permitido
  return NextResponse.next();
}

// Solo interceptar rutas protegidas del CRM y del portal de cliente.
// Las rutas de /auth, /_next, /api y archivos estáticos quedan fuera.
export const config = {
  matcher: ['/crm/:path*', '/client/:path*'],
};
