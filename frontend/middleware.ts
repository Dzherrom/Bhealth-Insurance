/**
 * Middleware estricto: clientes solo en /client/**, empleados solo en /crm/**.
 */

import { NextRequest, NextResponse } from 'next/server';
import { decodeJwtPayload, extractRoleFromToken, isTokenExpired, resolveRoleClaim } from './lib/jwt';
import { resolveMiddlewareRedirect } from './lib/middlewareAccess';
import { buildRedirectUrl } from './lib/requestOrigin';
import type { UserRole } from './types/auth';

function readCookieToken(request: NextRequest): string | undefined {
  const raw = request.cookies.get('access_token')?.value;
  if (!raw) return undefined;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function resolveRequestRole(request: NextRequest, token?: string): UserRole | null {
  if (token && !isTokenExpired(token)) {
    const roleFromToken = extractRoleFromToken(token);
    if (roleFromToken) return roleFromToken;

    const payload = decodeJwtPayload(token);
    if (payload?.cliente_id) return 'cliente';
  }

  const hasSession = request.cookies.get('auth_session')?.value === '1';
  if (token && hasSession) {
    const roleFromToken = extractRoleFromToken(token);
    if (roleFromToken) return roleFromToken;
  }

  if (request.cookies.get('portal_client')?.value === '1') {
    return 'cliente';
  }

  const roleCookieRaw = request.cookies.get('user_role')?.value;
  let roleCookie = roleCookieRaw;
  if (roleCookieRaw) {
    try {
      roleCookie = decodeURIComponent(roleCookieRaw);
    } catch {
      roleCookie = roleCookieRaw;
    }
  }

  return resolveRoleClaim(roleCookie);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/' || pathname === '/auth') {
    return NextResponse.redirect(buildRedirectUrl(request, '/auth/login'));
  }

  if (pathname === '/client') {
    return NextResponse.next();
  }

  const token = readCookieToken(request);
  const hasValidToken = Boolean(token && !isTokenExpired(token));
  const role = resolveRequestRole(request, token);
  const payload = token && hasValidToken ? decodeJwtPayload(token) : null;

  const redirectPath = resolveMiddlewareRedirect(pathname, {
    token,
    role,
    hasValidToken,
    portalClientCookie: request.cookies.get('portal_client')?.value,
    userRoleCookie: request.cookies.get('user_role')?.value,
    authSessionCookie: request.cookies.get('auth_session')?.value,
    jwtClienteId: payload?.cliente_id ?? null,
  });

  if (redirectPath) {
    return NextResponse.redirect(buildRedirectUrl(request, redirectPath));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/auth', '/crm/:path*', '/client/:path*', '/auth/login'],
};
