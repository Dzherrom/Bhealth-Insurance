import { decodeJwtPayload } from '@/lib/jwt';
import { useAuthStore } from '@/store/authStore';

/** Refrescar el access token 1 minuto antes de expirar */
const REFRESH_BEFORE_EXPIRY_MS = 60_000;
const MIN_CHECK_INTERVAL_MS = 15_000;

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

function isEmployeeRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return role !== 'cliente';
}

function clearRefreshTimer() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

function scheduleNextRefresh(accessToken: string) {
  clearRefreshTimer();

  const payload = decodeJwtPayload(accessToken);
  if (!payload?.exp) return;

  const expiresAt = payload.exp * 1000;
  const refreshAt = expiresAt - REFRESH_BEFORE_EXPIRY_MS;
  const delay = Math.max(refreshAt - Date.now(), MIN_CHECK_INTERVAL_MS);

  refreshTimer = setTimeout(async () => {
    const state = useAuthStore.getState();
    if (!state.isAuthenticated || !state.accessToken || !isEmployeeRole(state.role)) {
      return;
    }

    const currentPayload = decodeJwtPayload(state.accessToken);
    if (!currentPayload?.exp) return;

    const msUntilExpiry = currentPayload.exp * 1000 - Date.now();
    if (msUntilExpiry <= REFRESH_BEFORE_EXPIRY_MS) {
      try {
        await state.refreshAccessToken();
        const newToken = useAuthStore.getState().accessToken;
        if (newToken) scheduleNextRefresh(newToken);
      } catch {
        clearRefreshTimer();
      }
    } else {
      scheduleNextRefresh(state.accessToken);
    }
  }, delay);
}

export function startEmployeeTokenRefresh(): () => void {
  const sync = () => {
    const { accessToken, role, isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated || !accessToken || !isEmployeeRole(role)) {
      clearRefreshTimer();
      return;
    }
    scheduleNextRefresh(accessToken);
  };

  sync();

  return useAuthStore.subscribe((state, prev) => {
    if (
      state.accessToken !== prev.accessToken ||
      state.role !== prev.role ||
      state.isAuthenticated !== prev.isAuthenticated
    ) {
      sync();
    }
  });
}

export function stopEmployeeTokenRefresh() {
  clearRefreshTimer();
}
