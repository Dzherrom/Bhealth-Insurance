'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { FormularioFirma } from './types';

interface FormulariosFirmasDataTableProps {
  formularios: FormularioFirma[];
  onAction: (formulario: FormularioFirma) => void;
}

export function FormulariosFirmasDataTable({ 
  formularios, 
  onAction 
}: FormulariosFirmasDataTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'activo':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pendiente':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'validado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'revisión':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'activo':
        return 'Activo';
      case 'pendiente':
        return 'Pendiente';
      case 'validado':
        return 'Validado';
      case 'revisión':
        return 'Revisión';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nombre
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Creado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acción
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {formularios.map((formulario) => (
            <tr key={formulario.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                  {formulario.nombre}
                </div>
                <div className="text-xs text-gray-500">
                  Verificado para agente o 2.0
                </div>
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge 
                  variant="outline" 
                  className={`${getStatusColor(formulario.status)} font-medium`}
                >
                  {getStatusText(formulario.status)}
                </Badge>
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {formulario.fechaCreacion} {formulario.horaCreacion}
                </div>
                <div className="text-xs text-gray-500">
                  Creado por: {formulario.creadoPor}
                </div>
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {formulario.total}
                </div>
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onAction(formulario)}>
                      Ver detalles
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Descargar PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Cambiar status
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Duplicar formulario
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      Eliminar formulario
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}