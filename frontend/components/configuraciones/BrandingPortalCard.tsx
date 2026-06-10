'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { BrandingPortal } from './types';

interface BrandingPortalCardProps {
  data: BrandingPortal;
  onEdit: () => void;
}

export function BrandingPortalCard({ data, onEdit }: BrandingPortalCardProps) {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Branding del Portal
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

      <div className="space-y-6">
        {/* Logos en modo claro y oscuro */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Logotipo del portal en modo claro
            </label>
            <div className="border-2 border-dashed border-gray-200 dark:border-[#334155] rounded-lg p-8 text-center bg-gray-50 dark:bg-[#0f172a]">
              {data.logoModoClaro ? (
                <img 
                  src={data.logoModoClaro} 
                  alt="Logo modo claro" 
                  className="mx-auto h-12 object-contain"
                />
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-16 h-16 bg-gray-800 rounded flex items-center justify-center">
                    <span className="text-white text-xs">Logo</span>
                  </div>
                  <Upload className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Logotipo del portal en modo oscuro
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center bg-gray-900">
              {data.logoModoOscuro ? (
                <img 
                  src={data.logoModoOscuro} 
                  alt="Logo modo oscuro" 
                  className="mx-auto h-12 object-contain"
                />
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-16 h-16 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white text-xs">Logo</span>
                  </div>
                  <Upload className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Favicon */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Favicon del Portal
            </label>
            <div className="flex items-center space-x-3">
              {data.faviconPortal ? (
                <img 
                  src={data.faviconPortal} 
                  alt="Favicon" 
                  className="w-8 h-8 rounded"
                />
              ) : (
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs">⭐</span>
                </div>
              )}
              <Upload className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Título del Portal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título del Portal
          </label>
          <div className="text-sm text-gray-900">
            {data.tituloPortal || '—'}
          </div>
        </div>

        {/* Pie de Página */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pie de Correos Electrónicos
          </label>
          <div className="text-sm text-gray-900 dark:text-gray-300 border dark:border-[#334155] rounded p-3 bg-gray-50 dark:bg-[#0f172a]">
            {data.pieCorreosElectronicos || '—'}
          </div>
        </div>
      </div>
    </Card>
  );
}