'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginUser from '@/components/auth/loginUser';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { login, logout, isLoading, isAuthenticated, role, error, clearError, setError } = useAuthStore();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Redirect based on role instead of just isAuthenticated to prevent loops
  useEffect(() => {
    if (isAuthenticated) {
      if (role && ['admin', 'manager', 'asistente', 'sherpa', 'pagos', 'citas'].includes(role)) {
        router.push('/crm/dashboard');
      } else if (role === 'cliente') {
        router.push('/client');
      } else {
        // Unknown role or null (like 'user' default from backend that is not allowed)
        logout();
        setError("El usuario no tiene un rol válido para acceder al sistema.");
      }
    }
  }, [isAuthenticated, role, logout, setError, router]);

  const handleLogin = async (data: { username: string; password: string }) => {
    setSubmitError(null);
    try {
      await login({ username: data.username, password: data.password });
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : 'Error al iniciar sesión';
      setSubmitError(message);
      throw loginError;
    }
    // The push is now completely handled by the useEffect above
  };

  // Limpiar errores previos al montar la página
  useEffect(() => {
    clearError();
    setSubmitError(null);
  }, [clearError]);

  useEffect(() => {
    if (role === null && isAuthenticated) {
      setSubmitError('La cuenta inició sesión, pero no tiene un rol válido para acceder al CRM.');
    }
  }, [role, isAuthenticated]);

  useEffect(() => {
    if (error) {
      setSubmitError(error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <LoginUser onSubmit={handleLogin} isLoading={isLoading} externalError={submitError || error || undefined} />
    </div>
  );
}
