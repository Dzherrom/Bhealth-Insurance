import { NextRequest, NextResponse } from 'next/server';
import { decodeJwtPayload, resolveRoleFromAccessToken } from '@/lib/jwt';
import { canAccessClientPortal } from '@/lib/portalAccess';
import type { UserRole } from '@/types/auth';

const SESSION_COOKIE_NAMES = [
  'access_token',
  'user_role',
  'auth_session',
  'portal_client',
] as const;

function sessionMaxAge(): number {
  // Las cookies de sesión viven 7 días para permitir que el cliente intente refrescar el token
  // sin que el middleware lo redirija prematuramente a /auth/login.
  return 86400 * 7;
}

function applySessionCookies(
  response: NextResponse,
  accessToken: string,
  role: UserRole | null,
): void {
  const resolvedRole = role ?? resolveRoleFromAccessToken(accessToken);
  const maxAge = sessionMaxAge();
  const base = { path: '/', maxAge, sameSite: 'lax' as const };

  response.cookies.set('auth_session', '1', base);

  if (resolvedRole) {
    response.cookies.set('user_role', resolvedRole, base);
  }

  // JWT completo solo si cabe; el middleware funciona con user_role + auth_session.
  if (accessToken.length <= 3800) {
    response.cookies.set('access_token', accessToken, base);
  }

  const payload = decodeJwtPayload(accessToken);
  const isPortalClient =
    resolvedRole === 'cliente' ||
    canAccessClientPortal({
      role: resolvedRole,
      clienteId: payload?.cliente_id ?? null,
    });

  if (isPortalClient) {
    response.cookies.set('portal_client', '1', base);
  } else {
    response.cookies.delete('portal_client');
  }
}

function clearSessionCookies(response: NextResponse): void {
  for (const name of SESSION_COOKIE_NAMES) {
    response.cookies.delete(name);
  }
}

/** Establece cookies de sesión vía Set-Cookie (fiable; document.cookie falla en algunos navegadores). */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      access?: string;
      role?: UserRole | null;
    };

    const accessToken = body.access?.trim();
    if (!accessToken) {
      return NextResponse.json({ ok: false, error: 'access token required' }, { status: 400 });
    }

    const response = NextResponse.json({ ok: true });
    applySessionCookies(response, accessToken, body.role ?? null);
    return response;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid payload' }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearSessionCookies(response);
  return response;
}
