'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Briefcase } from 'lucide-react';

const loginUserSchema = z.object({
  username: z.string().min(1, 'El username es requerido'),
  password: z.string().min(1, 'La contraseña es requerida').min(6, 'Mínimo 6 caracteres'),
});

type LoginUserFormData = z.infer<typeof loginUserSchema>;

const loginInputClass =
  'h-11 bg-white text-[#0f172a] dark:text-[#0f172a] placeholder:text-[#64748b] dark:placeholder:text-[#64748b] caret-[#0f172a] dark:bg-white';

interface LoginUserProps {
  onSubmit?: (data: LoginUserFormData) => Promise<void>;
  isLoading?: boolean;
  externalError?: string | null;
  variant?: 'employee' | 'client';
}

export default function LoginUser({
  onSubmit,
  isLoading = false,
  externalError = null,
  variant = 'employee',
}: LoginUserProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEmployee = variant === 'employee';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginUserFormData>({
    resolver: zodResolver(loginUserSchema),
  });

  const handleFormSubmit = async (data: LoginUserFormData) => {
    try {
      setError(null);
      if (onSubmit) await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    }
  };

  const displayError = error || externalError;

  return (
    <div className="w-full">
      <div className="mb-8">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${isEmployee ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
          <Briefcase className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold text-[#0f172a]">Iniciar sesión</h2>
        <p className="text-sm text-[#64748b] mt-1">
          {isEmployee ? 'Acceso al panel de empleados' : 'Acceso a su portal de cliente'}
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {displayError && (
          <Alert variant="destructive">
            <AlertDescription>{displayError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="username" className="text-[#0f172a]">Usuario</Label>
          <Input
            id="username"
            type="text"
            placeholder="Username"
            autoComplete="username"
            {...register('username')}
            className={`${loginInputClass} ${errors.username ? 'border-red-500' : ''}`}
          />
          {errors.username && <p className="text-sm text-red-500">{errors.username.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-[#0f172a]">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Tu contraseña"
              autoComplete="current-password"
              {...register('password')}
              className={`${loginInputClass} pr-10 ${errors.password ? 'border-red-500' : ''}`}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
            </button>
          </div>
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        </div>

        <Button
          type="submit"
          className={`w-full h-11 ${isEmployee ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting || isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </Button>
      </form>
    </div>
  );
}
