/**
 * Middleware de Next.js — Protección de rutas por rol.
 *
 * Lee el JWT desde la cookie `access_token` y el rol desde el claim `role`
 * (o `cliente_id`) del token, con respaldo en la cookie `user_role`.
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractRoleFromToken, isTokenExpired, resolveRoleClaim } from './lib/jwt';
import { hasCRMAccess, CONFIG_ROLES, USERS_ADMIN_ROLES, CRM_ROLES } from './lib/permissions';
import type { UserRole } from './types/auth';

const OPEN_CRM_ACCESS = process.env.NEXT_PUBLIC_OPEN_CRM_ACCESS !== 'false';

interface RouteRule {
  prefix: string;
  allowedRoles: UserRole[];
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
    fallbackAuthenticated: '/auth/login',
  },
  {
    prefix: '/client/dashboard',
    allowedRoles: ['cliente'],
    fallbackAuthenticated: '/client',
  },
  {
    prefix: '/client/',
    allowedRoles: ['cliente'],
    fallbackAuthenticated: '/client',
  },
];

function resolveRequestRole(request: NextRequest, token?: string): UserRole | null {
  if (token && !isTokenExpired(token)) {
    const roleFromToken = extractRoleFromToken(token);
    if (roleFromToken) return roleFromToken;
  }

  const roleCookie = request.cookies.get('user_role')?.value;
  return resolveRoleClaim(roleCookie);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;
  const role = resolveRequestRole(request, token);

  if (pathname.startsWith('/crm') && role === 'cliente') {
    return NextResponse.redirect(new URL('/client/dashboard', request.url));
  }

  if (OPEN_CRM_ACCESS && pathname.startsWith('/crm')) {
    return NextResponse.next();
  }

  if (pathname === '/client') {
    return NextResponse.next();
  }

  const rule = ROUTE_RULES.find((r) => pathname.startsWith(r.prefix));
  if (!rule) return NextResponse.next();

  if (!token || isTokenExpired(token)) {
    if (pathname.startsWith('/client/')) {
      return NextResponse.redirect(new URL('/client', request.url));
    }
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!role || !rule.allowedRoles.includes(role)) {
    if (pathname.startsWith('/client/')) {
      return NextResponse.redirect(new URL('/client', request.url));
    }

    const fallback = hasCRMAccess(role)
      ? new URL(rule.fallbackAuthenticated, request.url)
      : new URL('/auth/login', request.url);
    return NextResponse.redirect(fallback);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/crm/:path*', '/client/:path*'],
};
