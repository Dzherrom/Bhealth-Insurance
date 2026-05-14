'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';

interface FormulariosFirmasHeaderProps {
  onNuevoFormulario: () => void;
  onAvanzado: () => void;
}

export function FormulariosFirmasHeader({ 
  onNuevoFormulario, 
  onAvanzado 
}: FormulariosFirmasHeaderProps) {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Formularios de firmas
        </h1>
        
        <div className="flex space-x-3">
          <Button 
            onClick={onNuevoFormulario}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo formulario de firma
          </Button>
          
          <Button 
            onClick={onAvanzado}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Settings className="w-4 h-4 mr-2" />
            Avanzado
          </Button>
        </div>
      </div>
    </div>
  );
}