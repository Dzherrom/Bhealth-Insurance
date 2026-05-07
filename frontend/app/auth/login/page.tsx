'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginUser from '@/components/auth/loginUser';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, isAuthenticated, clearError } = useAuthStore();

  // Si ya está autenticado, redirigir directamente al dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/crm/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (data: { username: string; password: string }) => {
    await login({ username: data.username, password: data.password });
    router.push('/crm/dashboard');
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
