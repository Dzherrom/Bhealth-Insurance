'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';
import { ClientProfile } from './types';

interface ClientProfileInfoProps {
  profile: ClientProfile;
  isEditing: boolean;
  editedProfile: Partial<ClientProfile>;
  onInputChange: (field: string, value: string) => void;
}

export default function ClientProfileInfo({
  profile,
  isEditing,
  editedProfile,
  onInputChange
}: ClientProfileInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Información Personal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">Nombre</Label>
            {isEditing ? (
              <Input
                id="firstName"
                value={editedProfile.firstName || ''}
                onChange={(e) => onInputChange('firstName', e.target.value)}
              />
            ) : (
              <p className="text-sm font-medium mt-1">{profile.firstName}</p>
            )}
          </div>
          <div>
            <Label htmlFor="lastName">Apellidos</Label>
            {isEditing ? (
              <Input
                id="lastName"
                value={editedProfile.lastName || ''}
                onChange={(e) => onInputChange('lastName', e.target.value)}
              />
            ) : (
              <p className="text-sm font-medium mt-1">{profile.lastName}</p>
            )}
          </div>
        </div>

        <div>
          <Label>Fecha de Nacimiento</Label>
          {isEditing ? (
            <Input
              type="date"
              value={editedProfile.birthDate || ''}
              onChange={(e) => onInputChange('birthDate', e.target.value)}
            />
          ) : (
            <p className="text-sm font-medium mt-1">
              {profile.birthDate ? new Date(profile.birthDate).toLocaleDateString('es-MX') : 'No especificado'}
            </p>
          )}
        </div>

        <div>
          <Label>Estado de la Cuenta</Label>
          <div className="mt-1">
            <Badge variant={profile.status === 'active' ? 'default' : 'secondary'}>
              {profile.status === 'active' ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}