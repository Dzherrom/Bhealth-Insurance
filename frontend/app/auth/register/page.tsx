'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Register from '@/components/auth/register';
import { useAuthStore } from '@/store/authStore';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, isAuthenticated, clearError } = useAuthStore();

  // Si ya está autenticado, redirigir al dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/crm/dashboard');
    }
  }, [isAuthenticated, router]);

  // Limpiar errores previos al montar
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleRegister = async (data: {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => {
    await register({
      username: data.username,
      email: data.email,
      password: data.password,
      first_name: data.firstName,
      last_name: data.lastName,
    });
    // useAuthStore.register hace login automático tras el registro exitoso
    router.push('/crm/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Register onSubmit={handleRegister} isLoading={isLoading} />
    </div>
  );
}
