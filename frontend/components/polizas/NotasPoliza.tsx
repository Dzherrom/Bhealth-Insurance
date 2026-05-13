'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, User, Clock, Edit2, Trash2 } from 'lucide-react';
import { notasApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/hooks/use-toast';

interface Nota {
  id: number;
  contenido: string;
  usuario: {
    nombre: string;
    apellido: string;
    iniciales: string;
    avatar?: string;
  };
  fechaCreacion: string;
  fechaModificacion?: string;
}

interface NotasPolizaProps {
  polizaId?: string;
}

export function NotasPoliza({ polizaId }: NotasPolizaProps) {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [isLoadingNotas, setIsLoadingNotas] = useState(false);
  const [nuevaNota, setNuevaNota] = useState('');
  const [agregandoNota, setAgregandoNota] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContenido, setEditContenido] = useState('');
  const { user } = useAuthStore();

  useEffect(() => {
    if (!polizaId) return;
    loadNotas();
  }, [polizaId]);

  const loadNotas = async () => {
    setIsLoadingNotas(true);
    try {
      const todas = await notasApi.list();
      let ns = (todas as any[]);
      if ((todas as any).results) {
         ns = (todas as any).results;
      }
      const dePoliza = ns.filter(
        n => String(n.poliza) === String(polizaId)
      );
      setNotas(dePoliza.map((n: any) => ({
        id: n.id ?? Date.now(),
        contenido: n.contenido,
        usuario: {
          nombre: 'Usuario',
          apellido: `#${n.usuario}`,
          iniciales: 'U',
          avatar: undefined,
        },
        fechaCreacion: n.fecha_creacion ?? new Date().toISOString(),
        fechaModificacion: n.fecha_modificacion,
      })));
    } catch (err) {
      console.error('Error al cargar notas:', err);
    } finally {
      setIsLoadingNotas(false);
    }
  };

  const formatDate = (dateString: string) => {
    const fecha = new Date(dateString);
    const ahora = new Date();
    const diferencia = ahora.getTime() - fecha.getTime();
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    
    if (dias === 0) {
      return 'Hoy ' + fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (dias === 1) {
      return 'Ayer ' + fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (dias < 7) {
      return `Hace ${dias} días`;
    } else {
      return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const handleAgregarNota = async () => {
    if (!nuevaNota.trim()) return;
    try {
      await notasApi.create({
        titulo: nuevaNota.trim().slice(0, 50),
        contenido: nuevaNota.trim(),
        poliza: polizaId ? Number(polizaId) : undefined,
        usuario: user?.id ?? 1,
      } as any);
      toast({ title: 'Nota agregada' });
      setNuevaNota('');
      setAgregandoNota(false);
      loadNotas();
    } catch (err) {
      console.error('Error al crear nota:', err);
      toast({ title: 'Error al agregar nota', variant: 'destructive' });
    }
  };

  const handleEditNota = async (id: number) => {
    if(!editContenido.trim()) return;
    try {
      await (notasApi.update as any)(id, { contenido: editContenido.trim() });
      toast({ title: 'Nota actualizada' });
      setEditingId(null);
      loadNotas();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error al editar', variant: 'destructive' });
    }
  };

  const handleDeleteNota = async (id: number) => {
    if(!window.confirm('¿Seguro de borrar esta nota?')) return;
    try {
      await notasApi.delete(id);
      toast({ title: 'Nota eliminada' });
      loadNotas();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5" />
          <span>Notas</span>
          <Badge variant="secondary" className="ml-2">
            {notas.length}
          </Badge>
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setAgregandoNota(!agregandoNota)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar nota
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {agregandoNota && (
          <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
            <Textarea
              placeholder="Escribe una nueva nota..."
              value={nuevaNota}
              onChange={(e) => setNuevaNota(e.target.value)}
              className="min-h-20 bg-white"
            />
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setAgregandoNota(false);
                  setNuevaNota('');
                }}
              >
                Cancelar
              </Button>
              <Button 
                size="sm"
                onClick={handleAgregarNota}
                disabled={!nuevaNota.trim()}
              >
                Guardar
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {isLoadingNotas ? (
            <p className="text-center text-gray-500 py-4">Cargando notas...</p>
          ) : notas.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No hay notas en esta póliza.</p>
          ) : (
            notas.map((nota) => (
              <div key={nota.id} className="flex space-x-3 p-3 bg-gray-50 rounded-lg">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={nota.usuario.avatar} />
                  <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                    {nota.usuario.iniciales}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {nota.usuario.nombre} {nota.usuario.apellido}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDate(nota.fechaCreacion)}
                        {nota.fechaModificacion && ' (Editado)'}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => {
                        if (editingId === nota.id) {
                          setEditingId(null);
                        } else {
                          setEditingId(nota.id);
                          setEditContenido(nota.contenido);
                        }
                      }}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-6 h-6 text-red-500 hover:text-red-700" onClick={() => handleDeleteNota(nota.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  {editingId === nota.id ? (
                    <div className="mt-2 space-y-2">
                      <Textarea value={editContenido} onChange={(e) => setEditContenido(e.target.value)} />
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>Cancelar</Button>
                        <Button size="sm" onClick={() => handleEditNota(nota.id)}>Guardar</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {nota.contenido}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}