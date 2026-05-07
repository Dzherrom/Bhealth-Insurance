'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Shield, Building } from 'lucide-react';

const loginClientSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Formato de email inválido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
  role: z
    .string()
    .min(1, 'Selecciona tu rol'),
  companyCode: z
    .string()
    .min(1, 'El código de empresa es requerido')
    .min(3, 'El código debe tener al menos 3 caracteres'),
});

type LoginClientFormData = z.infer<typeof loginClientSchema>;

interface LoginClientProps {
  onSubmit?: (data: LoginClientFormData) => Promise<void>;
  isLoading?: boolean;
  availableRoles?: Array<{ value: string; label: string }>;
}

const defaultRoles = [
  { value: 'admin', label: 'Administrador' },
  { value: 'agent', label: 'Agente' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'manager', label: 'Gerente' },
];

export default function LoginClient({ 
  onSubmit, 
  isLoading = false, 
  availableRoles = defaultRoles 
}: LoginClientProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginClientFormData>({
    resolver: zodResolver(loginClientSchema),
  });

  const selectedRole = watch('role');

  const handleFormSubmit = async (data: LoginClientFormData) => {
    try {
      setError(null);
      if (onSubmit) {
        await onSubmit(data);
      } else {
        // Fallback - aquí puedes agregar la lógica por defecto
        console.log('Datos de login CRM:', data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-purple-100 rounded-full">
            <Shield className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
          <Building className="h-6 w-6" />
          CRM - Acceso
        </CardTitle>
        <CardDescription>
          Panel de administración y gestión de seguros
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Corporativo</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@empresa.com"
              {...register('email')}
              className={errors.email ? 'border-red-500' : ''}
              autoComplete="username"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select value={selectedRole} onValueChange={(value) => setValue('role', value)}>
              <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecciona tu rol" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role.message}</p>
            )}
          </div> */}

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Tu contraseña corporativa"
                {...register('password')}
                className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-700">
                <p className="font-medium">Acceso Seguro</p>
                <p>Esta es una zona restringida para personal autorizado</p>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting || isLoading ? 'Verificando acceso...' : 'Acceder al CRM'}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              ¿Problemas con el acceso?{' '}
              <a href="/crm/support" className="text-purple-600 hover:underline">
                Contactar Soporte IT
              </a>
            </p>
            <p className="text-xs text-gray-500">
              ¿Necesitas acceso?{' '}
              <a href="/crm/request-access" className="text-purple-600 hover:underline">
                Solicitar Credenciales
              </a>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
