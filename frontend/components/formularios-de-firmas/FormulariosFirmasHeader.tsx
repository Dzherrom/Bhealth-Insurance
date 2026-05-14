'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface FormulariosFirmasHeaderProps {
  onNuevoFormulario: () => void;
}

export function FormulariosFirmasHeader({ 
  onNuevoFormulario
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
        </div>
      </div>
    </div>
  );
}