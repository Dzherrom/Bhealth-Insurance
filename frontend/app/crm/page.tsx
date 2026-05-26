'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building,
  Shield,
  Users,
  BarChart3,
  FileText,
  Lock,
  ArrowLeft,
  LogIn
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function CRMPage() {
  const router = useRouter();
  const { login, isLoading, isAuthenticated, error, clearError } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    try {
      await login({ username, password });
      router.push('/crm/dashboard');
    } catch {
      // El error ya queda guardado en el store
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-50 text-[#0f172a]">
      {/* Header Corporativo */}
      <header className="bg-white border-b border-[#e2e8f0] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-[#4f46e5] rounded-lg p-2">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">Bhealth CRM</span>
                <p className="text-xs text-[#4f46e5] font-medium">Sistema de Gestión Corporativa</p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => router.push('/client')}
              className="flex items-center space-x-2 text-gray-600 hover:text-[#4f46e5]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Portal Cliente</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
        {/* Panel Izquierdo - Información del Sistema */}
        <div className="lg:w-1/2 bg-gradient-to-br from-[#4f46e5] to-[#1d4ed8] text-white p-8 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto lg:mx-0">
            <div className="flex items-center space-x-3 mb-6">
              <Shield className="h-12 w-12 text-indigo-200" />
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold">
                  Portal CRM
                </h1>
                <p className="text-indigo-200">Sistema de Gestión Corporativa</p>
              </div>
            </div>
            
            <p className="text-xl lg:text-2xl text-indigo-100 mb-8">
              Herramientas avanzadas para la gestión de seguros y clientes
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="bg-indigo-500 rounded-full p-3">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Gestión de Clientes</h3>
                  <p className="text-indigo-100">Control completo de la cartera de clientes</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="bg-indigo-500 rounded-full p-3">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Analytics Avanzados</h3>
                  <p className="text-indigo-100">Reportes y métricas en tiempo real</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="bg-indigo-500 rounded-full p-3">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Gestión de Pólizas</h3>
                  <p className="text-indigo-100">Administración completa de seguros</p>
                </div>
              </div>
            </div>

            {/* Información de Seguridad */}
            <div className="mt-8 p-4 bg-indigo-900/45 rounded-lg border border-indigo-400">
              <div className="flex items-start space-x-3">
                <Lock className="h-5 w-5 text-indigo-200 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-indigo-200">Acceso Restringido</p>
                  <p className="text-indigo-300 mt-1">
                    Este sistema está destinado exclusivamente para uso del personal autorizado de Bhealth Insurance.
                    Todas las actividades son monitoreadas y registradas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho - Formulario de Login */}
        <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            {/* Alerta de Información */}
            <Alert className="mb-6 border-indigo-200 bg-indigo-50">
              <Shield className="h-4 w-4 text-indigo-600" />
              <AlertDescription className="text-indigo-700">
                <strong>Zona Corporativa:</strong> Ingresa tus credenciales de usuario para acceder al sistema.
              </AlertDescription>
            </Alert>

            {/* Formulario de Login */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <LogIn className="h-5 w-5 text-indigo-600" />
                  <h2 className="text-xl font-semibold">Acceso al Sistema</h2>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#4f46e5] hover:bg-[#4338ca]"
                    disabled={isLoading || !username || !password}
                  >
                    {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Información Adicional */}
            <div className="mt-6 space-y-4">
              <Card className="bg-linear-to-r from-indigo-50 to-blue-50 border-indigo-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-indigo-900 mb-2 flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Políticas de Seguridad
                  </h4>
                  <ul className="text-sm text-indigo-700 space-y-1">
                    <li>• Las sesiones expiran automáticamente tras 30 minutos de inactividad</li>
                    <li>• Se requiere autenticación de dos factores para roles administrativos</li>
                    <li>• Todos los accesos quedan registrados en el log de auditoría</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    ¿Necesitas acceso al sistema?
                  </p>
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/crm/request-access')}
                    >
                      Solicitar Credenciales
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/crm/support')}
                    >
                      Contactar Soporte IT
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Corporativo */}
      <footer className="bg-gray-900 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Building className="h-5 w-5 text-purple-400" />
              <span className="text-sm font-medium">Bhealth Insurance CRM</span>
              <span className="text-xs text-gray-400">v2.1.0</span>
            </div>
            <div className="flex space-x-4 text-xs text-gray-400">
              <a href="/crm/privacy" className="hover:text-white transition-colors">
                Política de Datos
              </a>
              <a href="/crm/security" className="hover:text-white transition-colors">
                Seguridad
              </a>
              <a href="/crm/documentation" className="hover:text-white transition-colors">
                Documentación
              </a>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-800 text-center text-xs text-gray-500">
            <p>Sistema Corporativo - Uso Restringido | &copy; 2025 Bhealth Insurance</p>
          </div>
        </div>
      </footer>
    </div>
  );
}