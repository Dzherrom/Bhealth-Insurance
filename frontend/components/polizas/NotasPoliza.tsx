'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, User, Clock } from 'lucide-react';
import { notasApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

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

/* Mock data comentada — reemplazada por datos reales del API
const mockNotas: Nota[] = [
  {
    id: 1,
    contenido: 'El cliente llamó para confirmar la información de contacto. Todo está correcto y está satisfecho con la póliza.',
    usuario: {
      nombre: 'Ana',
      apellido: 'García',
      iniciales: 'AG',
      avatar: undefined
    },
    fechaCreacion: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    contenido: 'Revisión completada. Todos los documentos están en orden. Procedemos con la activación de la póliza.',
    usuario: {
      nombre: 'Carlos',
      apellido: 'Rodríguez',
      iniciales: 'CR',
      avatar: undefined
    },
    fechaCreacion: '2024-01-14T16:45:00Z'
  },
  {
    id: 3,
    contenido: 'Primera reunión con el cliente. Explicamos los beneficios del plan Premium y resolvimos todas sus dudas.',
    usuario: {
      nombre: 'María',
      apellido: 'López',
      iniciales: 'ML',
      avatar: undefined
    },
    fechaCreacion: '2024-01-12T09:15:00Z'
  }
];
*/

export function NotasPoliza({ polizaId }: NotasPolizaProps) {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [isLoadingNotas, setIsLoadingNotas] = useState(false);
  const [nuevaNota, setNuevaNota] = useState('');
  const [agregandoNota, setAgregandoNota] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!polizaId) return;
    const loadNotas = async () => {
      setIsLoadingNotas(true);
      try {
        const todas = await notasApi.list();
        const dePoliza = (todas as any[]).filter(
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
    loadNotas();
  }, [polizaId]);

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
      const created = await notasApi.create({
        titulo: nuevaNota.trim().slice(0, 50),
        contenido: nuevaNota.trim(),
        poliza: polizaId ? Number(polizaId) : undefined,
        usuario: user?.id ?? 0,
      } as any);
      const nueva: Nota = {
        id: (created as any).id ?? Date.now(),
        contenido: nuevaNota.trim(),
        usuario: {
          nombre: user?.first_name ?? 'Usuario',
          apellido: user?.last_name ?? '',
          iniciales: `${(user?.first_name ?? 'U')[0]}${(user?.last_name ?? '')[0] ?? ''}`.toUpperCase(),
          avatar: undefined,
        },
        fechaCreacion: new Date().toISOString(),
      };
      setNotas([nueva, ...notas]);
      setNuevaNota('');
      setAgregandoNota(false);
    } catch (err) {
      console.error('Error al crear nota:', err);
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
        {/* Formulario para agregar nueva nota */}
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
                Guardar nota
              </Button>
            </div>
          </div>
        )}

        {/* Lista de notas existentes */}
        <div className="space-y-4">
          {notas.length > 0 ? (
            notas.map((nota) => (
              <div key={nota.id} className="flex space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <Avatar className="w-8 h-8">
                  {nota.usuario.avatar ? (
                    <AvatarImage src={nota.usuario.avatar} alt={nota.usuario.nombre} />
                  ) : (
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                      {nota.usuario.iniciales}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">
                        {nota.usuario.nombre} {nota.usuario.apellido}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        Agente
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(nota.fechaCreacion)}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {nota.contenido}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay notas para esta póliza</p>
              <p className="text-xs mt-1">Agrega la primera nota haciendo clic en "Agregar nota"</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}