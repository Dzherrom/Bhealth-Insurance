'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Shield, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/store';

interface ClientAccountInfoProps {
  clientId: string;
}

export default function ClientAccountInfo({ clientId }: ClientAccountInfoProps) {
  // Obtener datos del usuario autenticado
  const { user, isAuthenticated } = useAuthStore();

  if (!user || !isAuthenticated) {
    return (
      <Card className="md:col-span-2">
        <CardContent className="p-6">
          <p className="text-gray-500">Cargando información de la cuenta...</p>
        </CardContent>
      </Card>
    );
  }

  // Calcular tiempo como cliente (usar fecha de creación del usuario)
  const registrationDate = user.date_joined || new Date().toISOString();
  const daysSinceRegistration = Math.floor(
    (Date.now() - new Date(registrationDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Información de la Cuenta
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label className="text-gray-600">ID de Cliente</Label>
            <p className="text-sm font-medium mt-1 font-mono bg-gray-100 p-2 rounded">
              {clientId}
            </p>
          </div>
          
          <div>
            <Label className="text-gray-600">Usuario</Label>
            <p className="text-sm font-medium mt-1 flex items-center gap-2">
              {user.username}
              {user.is_active && (
                <Badge variant="default" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Activo
                </Badge>
              )}
            </p>
          </div>

          <div>
            <Label className="text-gray-600">Email Verificado</Label>
            <p className="text-sm font-medium mt-1 flex items-center gap-2">
              {user.email}
              <Shield className="h-4 w-4 text-green-600" />
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t">
          <div>
            <Label className="text-gray-600">Fecha de Registro</Label>
            <p className="text-sm font-medium mt-1">
              {new Date(registrationDate).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          
          <div>
            <Label className="text-gray-600">Tiempo como Cliente</Label>
            <p className="text-sm font-medium mt-1">
              {daysSinceRegistration} días
              <span className="text-gray-500 ml-2">
                ({Math.floor(daysSinceRegistration / 30)} meses aprox.)
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}