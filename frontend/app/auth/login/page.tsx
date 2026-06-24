'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoginUser from '@/components/auth/loginUser';
import SplitLoginLayout from '@/components/auth/SplitLoginLayout';
import { useAuthStore } from '@/store/authStore';

const OPEN_CRM_ACCESS = process.env.NEXT_PUBLIC_OPEN_CRM_ACCESS === 'true';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, isAuthenticated, role, accessToken, error, clearError, setError } = useAuthStore();
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const normalizedRole = role?.toLowerCase();
    const crmRoles = ['admin', 'manager', 'asistente', 'sherpa', 'pagos', 'citas'];

    if (normalizedRole === 'cliente') {
      router.push('/client/dashboard');
      return;
    }

    if (OPEN_CRM_ACCESS || (normalizedRole && crmRoles.includes(normalizedRole))) {
      router.push('/crm/dashboard');
      return;
    }

    if (accessToken) {
      setError(`La cuenta autenticó, pero el rol '${role || 'sin rol'}' no tiene acceso al panel.`);
    }
  }, [isAuthenticated, accessToken, role, setError, router]);

  const handleLogin = async (data: { username: string; password: string }) => {
    setSubmitError(null);
    try {
      await login({ username: data.username, password: data.password });
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
