'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreateRecordatorioModal } from './CreateRecordatorioModal';
import { 
  Calendar, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2,
  Bell,
  Clock,
  User,
  FolderOpen
} from 'lucide-react';

interface Recordatorio {
  id: number;
  usuario: string;
  titulo: string;
  cliente: string;
  poliza: string;
  fechaVencimiento: string;
  horaVencimiento: string;
  estado: 'pendiente' | 'completado' | 'vencido';
  descripcion: string;
  esPrivado: boolean;
}

interface RecordatoriosPolizaProps {
  polizaId?: string;
}

// Datos hardcodeados (por ahora vacío como en la imagen)
const mockRecordatorios: Recordatorio[] = [
  // Vacío intencionalmente para mostrar el estado sin datos
];

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'pendiente':
      return 'bg-yellow-100 text-yellow-800';
    case 'completado':
      return 'bg-green-100 text-green-800';
    case 'vencido':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export function RecordatoriosPoliza({ polizaId }: RecordatoriosPolizaProps) {
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>(mockRecordatorios);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const recordatoriosFiltrados = recordatorios.filter(recordatorio =>
    recordatorio.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recordatorio.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recordatorio.usuario.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateRecordatorio = (nuevoRecordatorio: Omit<Recordatorio, 'id'>) => {
    const recordatorio: Recordatorio = {
      ...nuevoRecordatorio,
      id: Date.now()
    };
    setRecordatorios([recordatorio, ...recordatorios]);
    setIsCreateModalOpen(false);
  };

  const handleEditRecordatorio = (id: number) => {
    console.log('Editar recordatorio:', id);
  };

  const handleDeleteRecordatorio = (id: number) => {
    setRecordatorios(prev => prev.filter(rec => rec.id !== id));
  };

  const handleViewRecordatorio = (id: number) => {
    console.log('Ver recordatorio:', id);
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Recordatorios de póliza</CardTitle>
          
          {/* Barra de herramientas */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Escribir aquí para buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Botones de acción */}
            <div className="flex gap-2 items-center">
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo
              </Button>
              
              <Button 
                variant="default" 
                size="sm" 
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Calendario
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {recordatoriosFiltrados.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Título del Recordatorio</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Póliza</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recordatoriosFiltrados.map((recordatorio) => (
                    <TableRow key={recordatorio.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{recordatorio.usuario}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{recordatorio.titulo}</p>
                          {recordatorio.esPrivado && (
                            <Badge variant="outline" className="text-xs mt-1">
                              Privado
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{recordatorio.cliente}</TableCell>
                      <TableCell>{recordatorio.poliza}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span className="text-sm">
                            {formatDate(recordatorio.fechaVencimiento)} {recordatorio.horaVencimiento}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={getEstadoColor(recordatorio.estado)}
                        >
                          {recordatorio.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewRecordatorio(recordatorio.id)}
                            className="h-8 w-8 p-0"
                            title="Ver recordatorio"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRecordatorio(recordatorio.id)}
                            className="h-8 w-8 p-0"
                            title="Editar"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRecordatorio(recordatorio.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No hay registros para mostrar aquí</h3>
              <p className="text-sm mb-4">
                Pruebe crear una nueva búsqueda.
              </p>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                variant="outline"
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear primer recordatorio
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para crear recordatorio */}
      <CreateRecordatorioModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateRecordatorio}
        polizaId={polizaId}
      />
    </>
  );
}