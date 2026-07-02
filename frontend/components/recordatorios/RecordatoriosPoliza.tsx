'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreateRecordatorioModal } from './CreateRecordatorioModal';
import { Calendar, Plus, Search, Eye, Edit, Trash2, Bell, Clock, User, Lock } from 'lucide-react';
import { recordatoriosApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import type { RecordatorioFormData } from './CreateRecordatorioModal';
import {
  getRecordatorioAntelacionLabel,
  getRecordatorioMotivoLabel,
  getRecordatorioTipoLabel,
} from '@/lib/recordatorios';

interface Recordatorio {
  id: number;
  usuario: string;
  usuario_notificar: number;
  titulo: string;
  tipo: string;
  motivo?: string;
  antelacion: string;
  poliza: number;
  fechaVencimiento: string;
  horaVencimiento: string;
  zonaHoraria: string;
  descripcion?: string;
  esPrivado: boolean;
  notificado: boolean;
}

interface RecordatoriosPolizaProps {
  polizaId?: string;
}

export function RecordatoriosPoliza({ polizaId }: RecordatoriosPolizaProps) {
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRecordatorio, setEditingRecordatorio] = useState<Recordatorio | null>(null);
  const [viewingRecordatorio, setViewingRecordatorio] = useState<Recordatorio | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuthStore();

  useEffect(() => {
    loadRecordatorios();
  }, [polizaId]);

  const mapRecordatorio = (r: any): Recordatorio => ({
    id: r.id,
    usuario: r.usuario_notificar_username || `#${r.usuario_notificar}`,
    usuario_notificar: r.usuario_notificar,
    titulo: r.titulo,
    tipo: r.tipo,
    motivo: r.motivo,
    antelacion: r.antelacion,
    poliza: r.poliza,
    fechaVencimiento: r.fecha_vencimiento,
    horaVencimiento: (r.hora_vencimiento || '').slice(0, 5),
    zonaHoraria: r.zona_horaria,
    descripcion: r.descripcion,
    esPrivado: Boolean(r.es_privado),
    notificado: Boolean(r.notificado),
  });

  const loadRecordatorios = async () => {
    if (!polizaId) return;
    setIsLoading(true);
    try {
      const forPoliza = await recordatoriosApi.listByPoliza(polizaId);
      setRecordatorios(forPoliza.map(mapRecordatorio));
    } catch (err) {
      console.error(err);
      toast({ title: 'Error al cargar recordatorios', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Seguro de eliminar este recordatorio?')) return;
    try {
      await recordatoriosApi.delete(id);
      toast({ title: 'Recordatorio eliminado' });
      loadRecordatorios();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    }
  };

  const filtered = recordatorios.filter(
    (r) =>
      r.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getRecordatorioTipoLabel(r.tipo).toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const toModalData = (recordatorio: Recordatorio): Partial<RecordatorioFormData> => ({
    tipo: recordatorio.tipo as RecordatorioFormData['tipo'],
    motivo: (recordatorio.motivo || '') as RecordatorioFormData['motivo'],
    antelacion: recordatorio.antelacion as RecordatorioFormData['antelacion'],
    fecha_vencimiento: recordatorio.fechaVencimiento,
    hora_vencimiento: recordatorio.horaVencimiento,
    zona_horaria: recordatorio.zonaHoraria,
    es_privado: recordatorio.esPrivado,
    establecer_recordatorio: true,
    usuario_notificar: recordatorio.usuario_notificar,
    descripcion: recordatorio.descripcion,
    poliza: recordatorio.poliza,
  });

  const handleCreate = async (payload: RecordatorioFormData) => {
    try {
      await recordatoriosApi.create(payload as any);
      toast({ title: 'Recordatorio creado' });
      setIsCreateModalOpen(false);
      await loadRecordatorios();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error al crear recordatorio', variant: 'destructive' });
    }
  };

  const handleUpdate = async (payload: RecordatorioFormData) => {
    if (!editingRecordatorio) return;
    try {
      await recordatoriosApi.patch(editingRecordatorio.id, payload as any);
      toast({ title: 'Recordatorio actualizado' });
      setEditingRecordatorio(null);
      await loadRecordatorios();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error al actualizar recordatorio', variant: 'destructive' });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Recordatorios</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex-1 relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Buscar por título o usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Recordatorio
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <p className="text-center text-gray-500 py-8">Cargando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay recordatorios.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[8%]">ID</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Antelación</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((recordatorio) => (
                  <TableRow key={recordatorio.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">#{recordatorio.id}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="text-sm font-medium">{getRecordatorioTipoLabel(recordatorio.tipo)}</span>
                          {recordatorio.esPrivado ? (
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <Lock className="w-3 h-3" />
                              Privado
                            </Badge>
                          ) : null}
                        </div>
                        {recordatorio.motivo ? (
                          <p className="text-xs text-gray-500 pl-6">{getRecordatorioMotivoLabel(recordatorio.motivo)}</p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {getRecordatorioAntelacionLabel(recordatorio.antelacion)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{recordatorio.fechaVencimiento}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{recordatorio.horaVencimiento}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                          onClick={() => setViewingRecordatorio(recordatorio)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                          onClick={() => setEditingRecordatorio(recordatorio)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:bg-red-50"
                          onClick={() => handleEliminar(recordatorio.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <CreateRecordatorioModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreate}
        polizaId={polizaId}
        userId={user?.id}
      />

      <CreateRecordatorioModal
        isOpen={!!editingRecordatorio}
        onClose={() => setEditingRecordatorio(null)}
        onSave={handleUpdate}
        polizaId={polizaId}
        userId={user?.id}
        mode="edit"
        initialData={editingRecordatorio ? toModalData(editingRecordatorio) : undefined}
      />

      <Dialog open={!!viewingRecordatorio} onOpenChange={() => setViewingRecordatorio(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de recordatorio</DialogTitle>
          </DialogHeader>
          {viewingRecordatorio && (
            <div className="space-y-3 text-sm">
              <p>
                <span className="font-medium">Tipo:</span> {getRecordatorioTipoLabel(viewingRecordatorio.tipo)}
              </p>
              {viewingRecordatorio.motivo ? (
                <p>
                  <span className="font-medium">Motivo:</span>{' '}
                  {getRecordatorioMotivoLabel(viewingRecordatorio.motivo)}
                </p>
              ) : null}
              <p>
                <span className="font-medium">Usuario a notificar:</span> {viewingRecordatorio.usuario}
              </p>
              <p>
                <span className="font-medium">Antelación:</span>{' '}
                {getRecordatorioAntelacionLabel(viewingRecordatorio.antelacion)}
              </p>
              <p>
                <span className="font-medium">Fecha:</span>{' '}
                {new Date(viewingRecordatorio.fechaVencimiento).toLocaleDateString('es-ES')}
              </p>
              <p>
                <span className="font-medium">Hora:</span> {viewingRecordatorio.horaVencimiento}
              </p>
              <p>
                <span className="font-medium">Zona:</span> {viewingRecordatorio.zonaHoraria}
              </p>
              <p>
                <span className="font-medium">Privado:</span> {viewingRecordatorio.esPrivado ? 'Sí' : 'No'}
              </p>
              <p>
                <span className="font-medium">Notificación enviada:</span>{' '}
                {viewingRecordatorio.notificado ? 'Sí' : 'Pendiente'}
              </p>
              <p>
                <span className="font-medium">Descripción:</span> {viewingRecordatorio.descripcion || 'Sin descripción'}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
