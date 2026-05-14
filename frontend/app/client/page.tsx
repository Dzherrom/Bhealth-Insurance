'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginUser from '@/components/auth/loginUser';
import Register from '@/components/auth/register';
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@/components/animate-ui/components/headless/tabs';
import { Heart, Shield, Users } from 'lucide-react';
import { useAuthStore, useUIStore } from '@/store';

function ClientPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'login';
  
  // Zustand stores
  const { login, register } = useAuthStore();
  const { activeTabIndex, setActiveTabIndex } = useUIStore();

  // Inicializar tab segÃºn query param
  useEffect(() => {
    const tabIndex = initialTab === 'register' ? 1 : 0;
    setActiveTabIndex(tabIndex);
  }, [initialTab, setActiveTabIndex]);

  const handleLoginSubmit = async (data: { username: string; password: string }) => {
    try {
      // Usar el store de autenticaciÃƒÂ³n para login
      await login({
        username: data.username,
        password: data.password,
      });
      
      // Generar hash del cliente usando su username
      const { generateTempClientHash } = await import('@/lib/clientHash');
      const clientHash = generateTempClientHash(data.username);
      
      // Redireccionar al dashboard del cliente con su hash Ãºnico
      router.push(`/client/${clientHash}`);
    } catch (error) {
      // El error ya estÃ¡ manejado en el store
      console.error('Error en login:', error);
      throw error;
    }
  };

  const handleRegisterSubmit = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    username?: string;
  }) => {
    try {
      // Usar el store de autenticaciÃ³n para registro
      await register({
        username: data.email,
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
      });
      
      // Generar hash del cliente usando sus datos
      const { generateTempClientHash } = await import('@/lib/clientHash');
      const clientHash = generateTempClientHash(data.email);
      
      // Redireccionar al dashboard del cliente despuÃ©s del registro
      router.push(`/client/${clientHash}`);
    } catch (error) {
      // El error ya estÃ¡ manejado en el store
      console.error('Error en registro:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Bhealth Insurance</span>
            </div>
            <nav className="flex items-center space-x-6">
              <a href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                Inicio
              </a>
              <a href="/about" className="text-gray-600 hover:text-blue-600 transition-colors">
                Acerca de
              </a>
              <a href="/contact" className="text-gray-600 hover:text-blue-600 transition-colors">
                Contacto
              </a>
            </nav>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
        {/* Panel Izquierdo - InformaciÃ³n */}
        <div className="lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 text-white p-8 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto lg:mx-0">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Tu salud es lo mÃ¡s importante
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 mb-8">
              Accede a los mejores planes de seguro mÃ©dico para ti y tu familia
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-500 rounded-full p-2">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Cobertura Completa</h3>
                  <p className="text-blue-100">ProtecciÃ³n integral para toda tu familia</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="bg-blue-500 rounded-full p-2">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Red de Especialistas</h3>
                  <p className="text-blue-100">Acceso a miles de mÃ©dicos y hospitales</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="bg-blue-500 rounded-full p-2">
                  <Heart className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">AtenciÃ³n 24/7</h3>
                  <p className="text-blue-100">Soporte mÃ©dico cuando lo necesites</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho - Formularios */}
        <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <TabGroup 
              defaultIndex={activeTabIndex} 
              onChange={(index) => setActiveTabIndex(index)}
              className="w-full"
            >
              <TabList className="grid w-full grid-cols-2 mb-8">
                <Tab className='hover:cursor-pointer'>Iniciar SesiÃ³n</Tab>
                <Tab className='hover:cursor-pointer'>Registrarse</Tab>
              </TabList>
              
              <TabPanels className="w-full">
                <TabPanel className="outline-none">
                  <LoginUser
                    onSubmit={handleLoginSubmit}
                  />
                </TabPanel>
                
                <TabPanel className="outline-none">
                  <Register
                    onSubmit={handleRegisterSubmit}
                  />
                </TabPanel>
              </TabPanels>
            </TabGroup>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Heart className="h-6 w-6 text-blue-400" />
              <span className="text-lg font-semibold">Bhealth Insurance</span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-400">
              <a href="/privacy" className="hover:text-white transition-colors">
                Privacidad
              </a>
              <a href="/terms" className="hover:text-white transition-colors">
                TÃ©rminos
              </a>
              <a href="/help" className="hover:text-white transition-colors">
                Ayuda
              </a>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-800 text-center text-sm text-gray-400">
            <p>&copy; 2025 Bhealth Insurance. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function ClientPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ClientPageContent />
    </Suspense>
  );
}
