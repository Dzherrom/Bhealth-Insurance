'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginUser from '@/components/auth/loginUser';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { login, logout, isLoading, isAuthenticated, role, clearError, setError } = useAuthStore();

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
    try {
      await login({ username: data.username, password: data.password });
      // The push is now completely handled by the useEffect above
    } catch (e) {
      // Error handled by store
    }
  };

  // Limpiar errores previos al montar la página
  useEffect(() => {
    clearError();
  }, [clearError]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <LoginUser onSubmit={handleLogin} isLoading={isLoading} />
    </div>
  );
}
