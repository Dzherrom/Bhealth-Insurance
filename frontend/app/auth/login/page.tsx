'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LoginUser from '@/components/auth/loginUser';
import SplitLoginLayout from '@/components/auth/SplitLoginLayout';
import {
  persistAuthSnapshot,
  setAuthCookies,
  syncServerSessionCookies,
  waitForSessionCookies,
} from '@/lib/authSession';
import { armAuthGracePeriod, resetAuthRefreshState } from '@/lib/api';
import {
  canUseEmployeeLogin,
  getClientDashboardPath,
  getPortalAuthSnapshot,
} from '@/lib/portalAccess';
import { getHomePathForUser } from '@/lib/routing';
import { hasCRMAccess } from '@/lib/roles';
import { useAuthStore } from '@/store/authStore';

const CLIENT_PORTAL_MESSAGE =
  'Esta cuenta es de cliente. Debes iniciar sesión en el portal de clientes.';

function resolvePostLoginPath(
  role: ReturnType<typeof useAuthStore.getState>['role'],
  user: ReturnType<typeof useAuthStore.getState>['user'],
): string | null {
  const destination = getHomePathForUser(role, user);
  if (destination) return destination;
  if (role && hasCRMAccess(role)) return '/crm/dashboard';
  return null;
}

async function establishSessionAndRedirect(path: string) {
  if (typeof window === 'undefined') return;

  const state = useAuthStore.getState();
  if (!state.accessToken) {
    throw new Error('No hay token de acceso tras el login.');
  }

  persistAuthSnapshot({
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    user: state.user,
    role: state.role,
    isAuthenticated: state.isAuthenticated,
  });

  const synced = await syncServerSessionCookies(state.accessToken, state.role);
  if (!synced) {
    setAuthCookies(state.accessToken, state.role);
    const cookiesReady = await waitForSessionCookies(true);
    if (!cookiesReady) {
      throw new Error(
        'No se guardaron las cookies de sesión. Desactiva el bloqueo de cookies para este sitio e intenta de nuevo.',
      );
    }
  }

  resetAuthRefreshState();
  armAuthGracePeriod();

  const target = path.startsWith('http')
    ? path
    : `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
  window.location.replace(target);
}

export default function LoginPage() {
  const { login, logout, isLoading, isAuthenticated, hasHydrated, role, user, error, clearError } =
    useAuthStore();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hydrationReady, setHydrationReady] = useState(
    () => typeof window !== 'undefined' && useAuthStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (hydrationReady) return;

    if (useAuthStore.persist.hasHydrated()) {
      setHydrationReady(true);
      return;
    }

    return useAuthStore.persist.onFinishHydration(() => {
      setHydrationReady(true);
    });
  }, [hydrationReady]);

  // Sesión ya activa: redirigir solo tras rehidratación (evita race con Zustand persist).
  useEffect(() => {
    if (!hydrationReady || !isAuthenticated) return;

    const snapshot = getPortalAuthSnapshot({
      role,
      profileRole: user?.profile?.role,
      profileClienteId: user?.profile?.cliente,
    });

    if (!canUseEmployeeLogin(snapshot)) {
      void establishSessionAndRedirect(getClientDashboardPath());
      return;
    }

    const destination = resolvePostLoginPath(role, user);
    if (destination) {
      void establishSessionAndRedirect(destination);
    }
  }, [hydrationReady, isAuthenticated, role, user]);

  const handleLogin = async (data: { username: string; password: string }) => {
    if (!hydrationReady) {
      setSubmitError('Cargando sesión, intenta de nuevo en un momento.');
      return;
    }

    setSubmitError(null);
    try {
      await login({ username: data.username, password: data.password });

      const state = useAuthStore.getState();
      const snapshot = getPortalAuthSnapshot({
        role: state.role,
        profileRole: state.user?.profile?.role,
        profileClienteId: state.user?.profile?.cliente,
      });

      if (!canUseEmployeeLogin(snapshot)) {
        await logout();
        setSubmitError(CLIENT_PORTAL_MESSAGE);
        return;
      }

      const destination = resolvePostLoginPath(state.role, state.user);
      if (destination) {
        await establishSessionAndRedirect(destination);
        return;
      }
      setSubmitError('Sesión iniciada, pero no se pudo determinar el destino. Recarga la página.');
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : 'Error al iniciar sesión';
      setSubmitError(message);
      throw loginError;
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reason') === 'session_expired') {
      setSubmitError('Tu sesión expiró. Inicia sesión nuevamente.');
      return;
    }
    clearError();
    setSubmitError(null);
  }, [clearError]);

  useEffect(() => {
    if (error) setSubmitError(error);
  }, [error]);

  if (!hydrationReady) {
    return (
      <SplitLoginLayout
        variant="employee"
        title="Gestión profesional de pólizas"
        subtitle="Accede al CRM para administrar clientes, cotizaciones, cambios de vida y operaciones del equipo."
      >
        <div className="py-12 text-center text-sm text-[#64748b]">Preparando acceso...</div>
      </SplitLoginLayout>
    );
  }

  return (
    <SplitLoginLayout
      variant="employee"
      title="Gestión profesional de pólizas"
      subtitle="Accede al CRM para administrar clientes, cotizaciones, cambios de vida y operaciones del equipo."
    >
      <LoginUser
        variant="employee"
        onSubmit={handleLogin}
        isLoading={isLoading}
        externalError={submitError || error || undefined}
      />
      <p className="text-center text-sm text-[#64748b] mt-6">
        ¿Es cliente?{' '}
        <Link href="/client" className="text-indigo-600 font-semibold hover:underline">
          Ir al portal de clientes
        </Link>
      </p>
    </SplitLoginLayout>
  );
}
