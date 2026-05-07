'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin } from 'lucide-react';
import { ClientProfile } from './types';

interface ClientContactInfoProps {
  profile: ClientProfile;
  isEditing: boolean;
  editedProfile: Partial<ClientProfile>;
  onInputChange: (field: string, value: string) => void;
}

export default function ClientContactInfo({
  profile,
  isEditing,
  editedProfile,
  onInputChange
}: ClientContactInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Información de Contacto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="email">Correo Electrónico</Label>
          {isEditing ? (
            <Input
              id="email"
              type="email"
              value={editedProfile.email || ''}
              onChange={(e) => onInputChange('email', e.target.value)}
            />
          ) : (
            <p className="text-sm font-medium mt-1 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {profile.email}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Teléfono</Label>
          {isEditing ? (
            <Input
              id="phone"
              value={editedProfile.phone || ''}
              onChange={(e) => onInputChange('phone', e.target.value)}
            />
          ) : (
            <p className="text-sm font-medium mt-1 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {profile.phone}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="address">Dirección</Label>
          {isEditing ? (
            <Input
              id="address"
              value={editedProfile.address || ''}
              onChange={(e) => onInputChange('address', e.target.value)}
            />
          ) : (
            <p className="text-sm font-medium mt-1 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {profile.address || 'No especificado'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}