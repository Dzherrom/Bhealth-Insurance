'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import { CrearPolizaModal } from './formularios/CrearPolizaModal';

export function PolizasHeader() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
      <div className="flex items-center space-x-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
          <FileText className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Pólizas</h1>
          <p className="text-muted-foreground dark:text-gray-400">
            Administra las pólizas de seguros y su estado
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Póliza
        </Button>
      </div>

      <CrearPolizaModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}