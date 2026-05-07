'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DireccionNegocio } from './types';

interface DireccionNegocioCardProps {
  data: DireccionNegocio;
  onEdit: () => void;
}

export function DireccionNegocioCard({ data, onEdit }: DireccionNegocioCardProps) {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Dirección del negocio
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
            Línea de dirección #1
          </label>
          <div className="text-sm text-gray-900">
            {data.lineaDireccion1 || '—'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Línea de dirección #2
          </label>
          <div className="text-sm text-gray-900">
            {data.lineaDireccion2 || '—'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ciudad
          </label>
          <div className="text-sm text-gray-900">
            {data.ciudad || '—'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado/Provincia
          </label>
          <div className="text-sm text-gray-900">
            {data.estadoProvincia || '—'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Código postal
          </label>
          <div className="text-sm text-gray-900">
            {data.codigoPostal || '—'}
          </div>
        </div>
      </div>
    </Card>
  );
}