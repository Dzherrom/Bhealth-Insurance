'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InformacionNegocio } from './types';

interface InformacionNegocioCardProps {
  data: InformacionNegocio;
  onEdit: () => void;
}

export function InformacionNegocioCard({ data, onEdit }: InformacionNegocioCardProps) {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Información del negocio
        </h3>
        <Button 
          onClick={onEdit}
          variant="outline"
          size="sm"
          className="text-blue-600 border-blue-600 hover:bg-blue-50"
        >
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Legal de la Empresa
          </label>
          <div className="text-sm text-gray-900">
            {data.nombreLegal || '—'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Comercial (DBA)
          </label>
          <div className="text-sm text-gray-900">
            {data.nombreComercial || '—'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <div className="text-sm text-gray-900">
            {data.telefono || '—'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Correo Electrónico
          </label>
          <div className="text-sm text-blue-600">
            {data.correoElectronico || '—'}
          </div>
        </div>
      </div>
    </Card>
  );
}