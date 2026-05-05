'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, UserMinus, Edit, Users, Phone, Mail } from 'lucide-react';

interface Familiar {
  id: number;
  nombre: string;
  apellido: string;
  relacion: string;
  telefono?: string;
  email?: string;
}

interface FamiliaresProps {
  familiares: Familiar[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
}

export function Familiares({ familiares, onEdit, onDelete, onAdd }: FamiliaresProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>Miembros de la familia</span>
        </CardTitle>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            Buscar contacto
          </Button>
          <Button size="sm" onClick={onAdd}>
            <UserPlus className="w-4 h-4 mr-2" />
            Agregar miembro
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-sm text-gray-600">
          <span className="font-medium">Total de aplicantes: </span>
          <span className="text-blue-600">{familiares.filter(f => f.relacion === 'Aplicante').length}</span>
          <span className="mx-4 font-medium">Total de miembros de la familia: </span>
          <span className="text-blue-600">{familiares.length}</span>
          <span className="mx-4 font-medium">Total de dependientes: </span>
          <span className="text-blue-600">{familiares.filter(f => f.relacion !== 'Aplicante').length}</span>
        </div>

        {familiares.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No hay familiares registrados.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {familiares.map(fam => (
              <div key={fam.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-lg">{fam.nombre} {fam.apellido}</span>
                      <Badge variant="secondary" className="text-xs">
                        {fam.relacion}
                      </Badge>
                    </div>
                    <div className="flex space-x-4 text-xs text-gray-600 mt-1">
                      {fam.telefono && (
                        <div className="flex items-center space-x-1">
                          <Phone className="w-3 h-3" />
                          <span>{fam.telefono}</span>
                        </div>
                      )}
                      {fam.email && (
                        <div className="flex items-center space-x-1">
                          <Mail className="w-3 h-3" />
                          <span>{fam.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(fam.id)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onDelete(fam.id)}>
                    <UserMinus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
