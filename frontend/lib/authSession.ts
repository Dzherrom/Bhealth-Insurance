import { decodeJwtPayload, isTokenExpired, resolveRoleClaim, resolveRoleFromAccessToken } from '@/lib/jwt';
import { canAccessClientPortal } from '@/lib/portalAccess';
import { hasCRMAccess } from '@/lib/roles';
import type { User } from '@/types/auth';
import type { UserRole } from '@/types/auth';

const AUTH_PERSIST_KEY = 'auth-storage';

export interface AuthPersistSnapshot {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
}

/** Lee el access token recién guardado por login (antes de que Zustand persist termine). */
export function readLiveAccessToken(): string | null {
  if (typeof window === 'undefined') return null;

  const direct = localStorage.getItem('access_token');
  if (direct && !isTokenExpired(direct)) return direct;

  const raw = localStorage.getItem(AUTH_PERSIST_KEY);
  if (!raw) return null;

  try {
    const persisted = JSON.parse(raw) as { state?: { accessToken?: string | null } };
    const token = persisted?.state?.accessToken ?? null;
    return token && !isTokenExpired(token) ? token : null;
  } catch {
    return null;
  }
}

/** Lee refresh token de localStorage o auth-storage. */
export function readLiveRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;

  const direct = localStorage.getItem('refresh_token') ?? localStorage.getItem('refresh');
  if (direct) return direct;

  const raw = localStorage.getItem(AUTH_PERSIST_KEY);
  if (!raw) return null;

  try {
    const persisted = JSON.parse(raw) as { state?: { refreshToken?: string | null } };
    return persisted?.state?.refreshToken ?? null;
  } catch {
    return null;
  }
}

/** Cookie de sesión activa establecida por POST /auth/session o login. */
export function hasAuthSessionCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').some((row) => row === 'auth_session=1');
}

/** Escribe auth-storage de forma síncrona para evitar rehidratación con sesión vieja tras login. */
export function persistAuthSnapshot(snapshot: AuthPersistSnapshot): void {
  if (typeof window === 'undefined') return;

  if (snapshot.accessToken) {
    localStorage.setItem('access_token', snapshot.accessToken);
  }
  if (snapshot.refreshToken) {
    localStorage.setItem('refresh_token', snapshot.refreshToken);
  }

  localStorage.setItem(
    AUTH_PERSIST_KEY,
    JSON.stringify({
      state: snapshot,
      version: 0,
    }),
  );
}

function cookieSuffix(exp?: number): string {
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; Secure'
      : '';
  const expStr = exp ? `; expires=${new Date(exp * 1000).toUTCString()}` : '; Max-Age=3600';
  return `${expStr}; path=/; SameSite=Lax${secure}`;
}

/** Cookies mínimas para el middleware (sin JWT completo). */
function setLightweightAuthCookies(resolvedRole: UserRole | null, suffix: string): void {
  document.cookie = `auth_session=1${suffix}`;
  if (resolvedRole) {
    document.cookie = `user_role=${resolvedRole}${suffix}`;
  }
}

export function setAuthCookies(accessToken: string, role: UserRole | null): void {
  if (typeof document === 'undefined') return;

  const payload = decodeJwtPayload(accessToken);
  const resolvedRole = role ?? resolveRoleFromAccessToken(accessToken);
  const suffix = cookieSuffix(payload?.exp);

  setLightweightAuthCookies(resolvedRole, suffix);

  const isPortalClient =
    resolvedRole === 'cliente' ||
    canAccessClientPortal({ role: resolvedRole, clienteId: payload?.cliente_id ?? null });

  if (isPortalClient) {
    document.cookie = `portal_client=1${suffix}`;
  } else {
    document.cookie = 'portal_client=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
  }

  // JWT opcional en cookie (puede superar límites del navegador).
  if (accessToken.length <= 3800) {
    document.cookie = `access_token=${encodeURIComponent(accessToken)}${suffix}`;
  }
}

/** Sincroniza cookies de sesión en el servidor (Set-Cookie). Devuelve true si OK. */
export async function syncServerSessionCookies(
  accessToken: string,
  role: UserRole | null,
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const response = await fetch('/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ access: accessToken, role }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** Borra cookies de sesión en el servidor. */
export async function clearServerSessionCookies(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    await fetch('/auth/session', { method: 'DELETE', credentials: 'include' });
  } catch {
    // ignore
  }
}

export function clearAuthCookies(): void {
  if (typeof document === 'undefined') return;

  void clearServerSessionCookies();

  const expired = 'path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
  document.cookie = `access_token=; ${expired}`;
  document.cookie = `user_role=; ${expired}`;
  document.cookie = `auth_session=; ${expired}`;
  document.cookie = `portal_client=; ${expired}`;
}

/** Espera cookies de sesión. Si requireSession=true, devuelve false si no aparecen a tiempo. */
export function waitForSessionCookies(requireSession = false): Promise<boolean> {
  if (typeof document === 'undefined') return Promise.resolve(!requireSession);

  return new Promise((resolve) => {
    const deadline = Date.now() + 3000;
    const tick = () => {
      const hasRole = document.cookie.includes('user_role=');
      const hasPortal = document.cookie.includes('portal_client=1');
      const hasSession = document.cookie.includes('auth_session=1');
      const hasToken = document.cookie.includes('access_token=');
      if (hasSession && (hasRole || hasPortal || hasToken)) {
        resolve(true);
        return;
      }
      if (Date.now() >= deadline) {
        resolve(!requireSession);
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

export function resolveRoleFromProfile(profile?: {
  role?: string | null;
  cliente?: number | null;
} | null): UserRole | null {
  if (!profile) return null;

  const roleFromProfile = resolveRoleClaim(profile.role);
  if (roleFromProfile && hasCRMAccess(roleFromProfile)) {
    return roleFromProfile;
  }

  if (
    canAccessClientPortal({
      profileRole: profile.role,
      profileClienteId: profile.cliente,
    })
  ) {
    return 'cliente';
  }

  return roleFromProfile;
}

export function readPortalAuthState(input: {
  role?: UserRole | null;
  profileRole?: string | null;
  profileClienteId?: number | null;
}) {
  return canAccessClientPortal({
    role: input.role ?? undefined,
    profileRole: input.profileRole,
    profileClienteId: input.profileClienteId,
  });
}
