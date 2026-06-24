'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LoginUser from '@/components/auth/loginUser';
import SplitLoginLayout from '@/components/auth/SplitLoginLayout';
import { readPortalAuthState } from '@/lib/authSession';
import {
  canUseEmployeeLogin,
  getClientDashboardPath,
  getPortalAuthSnapshot,
} from '@/lib/portalAccess';
import { getHomePathForUser } from '@/lib/routing';
import { useAuthStore } from '@/store/authStore';

const CLIENT_PORTAL_MESSAGE =
  'Esta cuenta es de cliente. Debes iniciar sesión en el portal de clientes.';

function hardRedirect(path: string) {
  window.location.replace(path);
}

export default function LoginPage() {
  const { login, logout, isLoading, isAuthenticated, role, user, error, clearError } = useAuthStore();
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const snapshot = getPortalAuthSnapshot({
      role,
      profileRole: user?.profile?.role,
      profileClienteId: user?.profile?.cliente,
    });

    if (!canUseEmployeeLogin(snapshot)) {
      hardRedirect(getClientDashboardPath());
      return;
    }

    const destination = getHomePathForUser(role, user);
    if (destination?.startsWith('/crm')) {
      hardRedirect(destination);
    }
  }, [isAuthenticated, role, user]);

  const handleLogin = async (data: { username: string; password: string }) => {
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

      const destination = getHomePathForUser(state.role, state.user);
      if (destination) {
        hardRedirect(destination);
      }
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : 'Error al iniciar sesión';
      setSubmitError(message);
      throw loginError;
    }
  };

  useEffect(() => {
    clearError();
    setSubmitError(null);
  }, [clearError]);

  useEffect(() => {
    if (error) setSubmitError(error);
  }, [error]);

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
