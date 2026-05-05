'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  Send, 
  MessageSquare, 
  User, 
  Clock,
  Paperclip
} from 'lucide-react';

interface NotaChat {
  id: number;
  mensaje: string;
  usuario: {
    nombre: string;
    apellido: string;
    iniciales: string;
    avatar?: string;
    rol: string;
  };
  fechaCreacion: string;
  estado?: string;
}

interface NotasChatProps {
  isOpen: boolean;
  onClose: () => void;
  polizaInfo: {
    cliente: string;
    plan: string;
    id: string;
  };
}

// Datos hardcodeados basados en la imagen
const mockNotas: NotaChat[] = [
  {
    id: 1,
    mensaje: 'Cliente contactó para verificar la información de la póliza. Todo correcto y confirmado.',
    usuario: {
      nombre: 'Isaac',
      apellido: 'Torres',
      iniciales: 'IT',
      rol: 'Agente'
    },
    fechaCreacion: '2024-01-15T09:30:00Z',
    estado: 'EN PROCESO'
  },
  {
    id: 2,
    mensaje: 'Documentos recibidos y procesados. Póliza lista para activación.',
    usuario: {
      nombre: 'Ana',
      apellido: 'García',
      iniciales: 'AG',
      rol: 'Supervisor'
    },
    fechaCreacion: '2024-01-15T11:45:00Z',
    estado: 'BILLS'
  },
  {
    id: 3,
    mensaje: 'Cliente solicita cambio en la información de contacto. Actualizando datos.',
    usuario: {
      nombre: 'Carlos',
      apellido: 'Rodríguez',
      iniciales: 'CR',
      rol: 'Agente'
    },
    fechaCreacion: '2024-01-15T14:20:00Z',
    estado: 'CAMBIO DE VIDA'
  },
  {
    id: 4,
    mensaje: 'Revisión de elegibilidad completada. Todo en orden.',
    usuario: {
      nombre: 'María',
      apellido: 'López',
      iniciales: 'ML',
      rol: 'Especialista'
    },
    fechaCreacion: '2024-01-15T16:10:00Z',
    estado: 'BILLS RESULT'
  }
];

const estadoColors = {
  'EN PROCESO': 'bg-blue-100 text-blue-800',
  'BILLS': 'bg-purple-100 text-purple-800',
  'BILLS RESULT': 'bg-green-100 text-green-800',
  'CAMBIO DE VIDA': 'bg-red-100 text-red-800',
  'CAMBIO DE VIDA-TRES MES': 'bg-orange-100 text-orange-800',
  'CAMBIO NO REALIZADO': 'bg-gray-100 text-gray-800',
  'CAMBIO REALIZADO SLEEP': 'bg-yellow-100 text-yellow-800',
  'COMPLETO': 'bg-green-100 text-green-800'
};

export function NotasChat({ isOpen, onClose, polizaInfo }: NotasChatProps) {
  const [notas, setNotas] = useState<NotaChat[]>(mockNotas);
  const [nuevaNota, setNuevaNota] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  // Manejar animaciones de entrada y salida
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    // Esperar a que termine la animación antes de cerrar completamente
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const formatTime = (dateString: string) => {
    const fecha = new Date(dateString);
    const ahora = new Date();
    const diferencia = ahora.getTime() - fecha.getTime();
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    
    if (minutos < 60) {
      return `Hace ${minutos} min`;
    } else if (horas < 24) {
      return `Hace ${horas}h`;
    } else if (dias === 1) {
      return 'Ayer';
    } else if (dias < 7) {
      return `Hace ${dias} días`;
    } else {
      return fecha.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const handleEnviarNota = () => {
    if (nuevaNota.trim()) {
      const nota: NotaChat = {
        id: Date.now(),
        mensaje: nuevaNota.trim(),
        usuario: {
          nombre: 'Usuario',
          apellido: 'Actual',
          iniciales: 'UA',
          rol: 'Agente'
        },
        fechaCreacion: new Date().toISOString(),
        estado: 'EN PROCESO'
      };
      
      setNotas([...notas, nota]);
      setNuevaNota('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviarNota();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay invisible para capturar clicks */}
      <div 
        className="fixed inset-0 bg-transparent z-40"
        onClick={handleClose}
      />
      
      {/* Panel lateral con animación de deslizamiento */}
      <div className={`fixed left-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
        isAnimating ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Notas de Póliza</h2>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Información del cliente */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                  {polizaInfo.cliente.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{polizaInfo.cliente}</p>
                <p className="text-xs text-gray-500">{polizaInfo.plan}</p>
              </div>
            </div>
            
            {/* Estados disponibles */}
            <div className="flex flex-wrap gap-1 mt-3">
              {Object.keys(estadoColors).slice(0, 8).map((estado) => (
                <Badge 
                  key={estado}
                  variant="secondary" 
                  className={`text-xs ${estadoColors[estado as keyof typeof estadoColors]}`}
                >
                  {estado}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Chat area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {notas.map((nota) => (
              <div key={nota.id} className="flex space-x-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  {nota.usuario.avatar ? (
                    <AvatarImage src={nota.usuario.avatar} alt={nota.usuario.nombre} />
                  ) : (
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                      {nota.usuario.iniciales}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-sm">
                      {nota.usuario.nombre} {nota.usuario.apellido}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {nota.usuario.rol}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatTime(nota.fechaCreacion)}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{nota.mensaje}</p>
                    {nota.estado && (
                      <Badge 
                        variant="secondary" 
                        className={`text-xs mt-2 ${estadoColors[nota.estado as keyof typeof estadoColors]}`}
                      >
                        {nota.estado}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {notas.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay notas aún</p>
                <p className="text-xs mt-1">Inicia la conversación escribiendo una nota</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="p-4 border-t bg-white">
          <div className="space-y-3">
            <Textarea
              placeholder="Escribir una nota..."
              value={nuevaNota}
              onChange={(e) => setNuevaNota(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[80px] resize-none"
              rows={3}
            />
            
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm">
                <Paperclip className="w-4 h-4 mr-2" />
                Adjuntar
              </Button>
              
              <Button 
                onClick={handleEnviarNota}
                disabled={!nuevaNota.trim()}
                size="sm"
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}