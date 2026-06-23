'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginUser from '@/components/auth/loginUser';
import Register from '@/components/auth/register';
import SplitLoginLayout from '@/components/auth/SplitLoginLayout';
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@/components/animate-ui/components/headless/tabs';
import { authApi } from '@/lib/api';
import { useAuthStore, useUIStore } from '@/store';

function ClientPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'login';
  const { login, isAuthenticated, role } = useAuthStore();
  const { activeTabIndex, setActiveTabIndex } = useUIStore();

  useEffect(() => {
    setActiveTabIndex(initialTab === 'register' ? 1 : 0);
  }, [initialTab, setActiveTabIndex]);

  useEffect(() => {
    if (isAuthenticated && role === 'cliente') {
      router.push('/client/dashboard');
    }
  }, [isAuthenticated, role, router]);

  const handleLoginSubmit = async (data: { username: string; password: string }) => {
    await login({ username: data.username, password: data.password });
    router.push('/client/dashboard');
  };

  const handleRegisterSubmit = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    username?: string;
  }) => {
    await authApi.registerCliente({
      username: data.email,
      email: data.email,
      password: data.password,
      first_name: data.firstName,
      last_name: data.lastName,
    });
    await login({ username: data.email, password: data.password });
    router.push('/client/dashboard');
  };

  return (
    <SplitLoginLayout
      variant="client"
      title="Tu salud, siempre protegida"
      subtitle="Consulta tu póliza, revisa tu cobertura y solicita cambios de forma segura desde cualquier dispositivo."
      footer={
        <p className="text-center text-sm text-[#64748b] mt-6">
          ¿Eres empleado?{' '}
          <a href="/auth/login" className="text-emerald-700 font-semibold hover:underline">
            Acceder al CRM
          </a>
        </p>
      }
    >
      <TabGroup defaultIndex={activeTabIndex} onChange={setActiveTabIndex} className="w-full">
        <TabList className="grid w-full grid-cols-2 mb-6 bg-white rounded-lg p-1 border border-emerald-100">
          <Tab className="hover:cursor-pointer data-[selected]:bg-emerald-600 data-[selected]:text-white rounded-md py-2 text-sm font-medium">
            Iniciar sesión
          </Tab>
          <Tab className="hover:cursor-pointer data-[selected]:bg-emerald-600 data-[selected]:text-white rounded-md py-2 text-sm font-medium">
            Registrarse
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel className="outline-none">
            <LoginUser variant="client" onSubmit={handleLoginSubmit} />
          </TabPanel>
          <TabPanel className="outline-none">
            <Register onSubmit={handleRegisterSubmit} />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </SplitLoginLayout>
  );
}

export default function ClientPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <ClientPageContent />
    </Suspense>
  );
}
