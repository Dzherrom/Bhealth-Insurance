'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronRight
} from 'lucide-react';

interface RegistroActividad {
  id: number;
  usuario: string;
  accion: string;
  descripcion: string;
  fecha: string;
  hora: string;
  tipo: 'create' | 'update' | 'complete' | 'assign' | 'transfer';
  detalles?: {
    campo: string;
    valorAntes: string;
    valorDespues: string;
  }[];
}

interface RegistrosActividadModalProps {
  isOpen: boolean;
  onClose: () => void;
  polizaId: string;
}

// Datos hardcodeados basados en la imagen
const mockRegistros: RegistroActividad[] = [
  {
    id: 1,
    usuario: 'Marta Cordova [18982]',
    accion: 'updated',
    descripcion: 'unisocial conference test social security Number (SSN) [socsan-cred] of the policy [MENSABLAAD#16767], policy member Nelson Vado [3873001]',
    fecha: 'Dec 03, 2025',
    hora: '12:42 PM',
    tipo: 'update'
  },
  {
    id: 2,
    usuario: 'Isaac Torres [26469]',
    accion: 'updated',
    descripcion: 'the policy status from COTIZADA 2024 to RENOVADA YEARLY FAMILIAS 2026 of the policy [MENSABLAAD#16767]',
    fecha: 'Dec 03, 2025',
    hora: '10:38 PM',
    tipo: 'update'
  },
  {
    id: 3,
    usuario: 'Isaac Torres [26469]',
    accion: 'updated',
    descripcion: 'the policy status from RENOVADA YEARLY FAMILIAS 2026 to COTIZADA 2026 of the policy [MENSABLAAD#16767]',
    fecha: 'Dec 03, 2025',
    hora: '10:28 AM',
    tipo: 'update'
  },
  {
    id: 4,
    usuario: 'Isaac Torres [26469]',
    accion: 'updated',
    descripcion: 'the policy status from New to RENOVADA YEARLY FAMILIAS 2026 of the policy [MENSABLAAD#16767]',
    fecha: 'Dec 03, 2025',
    hora: '10:26 AM',
    tipo: 'update'
  },
  {
    id: 5,
    usuario: 'Isaac Torres [26469]',
    accion: 'uploaded',
    descripcion: '[MENSABLAAD#16767]',
    fecha: 'Dec 03, 2025',
    hora: '10:24 AM',
    tipo: 'complete',
    detalles: [
      { campo: 'Estado', valorAntes: 'New', valorDespues: 'RENOVADA YEARLY FAMILIAS 2026' },
      { campo: 'Plan', valorAntes: '', valorDespues: 'Buena Salud Bronze Extender Classic HMO $7500 $50' },
      { campo: 'Cuota', valorAntes: '', valorDespues: '$0.26' },
      { campo: 'Prima', valorAntes: '', valorDespues: '$0.26' },
      { campo: '# de asegurados', valorAntes: '', valorDespues: '1' },
      { campo: '# de nivel de nivel', valorAntes: '', valorDespues: '1' },
      { campo: '# del programa de salud', valorAntes: '', valorDespues: '1' },
      { campo: '# del nivel de metal', valorAntes: '', valorDespues: '4' }
    ]
  },
  {
    id: 6,
    usuario: 'Isaac Torres [26469]',
    accion: 'uploaded',
    descripcion: '2(Updated-NEW-4268-3864-OpportuneCUAT.pdf [7338827] document to the policy [MENSABLAAD#16767]',
    fecha: 'Dec 03, 2025',
    hora: '10:22 AM',
    tipo: 'complete'
  },
  {
    id: 7,
    usuario: 'Isaac Torres [26469]',
    accion: 'updated',
    descripcion: '[MENSABLAAD#16767]',
    fecha: 'Dec 03, 2025',
    hora: '9:49 AM',
    tipo: 'update'
  },
  {
    id: 8,
    usuario: 'Isaac Torres [26469]',
    accion: 'updated',
    descripcion: 'Nelson Vado [3873001] in the policy [MENSABLAAD#16767]',
    fecha: 'Dec 03, 2025',
    hora: '9:37 AM',
    tipo: 'update'
  },
  {
    id: 9,
    usuario: 'Arimilenis Pacheco [18986]',
    accion: 'assign',
    descripcion: 'the policy [MENSABLAAD#16767] to Isaac Torres [26469]',
    fecha: 'Nov 27, 2025',
    hora: '6:40 PM',
    tipo: 'assign'
  },
  {
    id: 10,
    usuario: 'Arimilenis Pacheco [18986]',
    accion: 'unassigned',
    descripcion: 'the policy [MENSABLAAD#16767] from Nelson Vasquez [26954]',
    fecha: 'Nov 27, 2025',
    hora: '6:40 PM',
    tipo: 'transfer'
  },
  {
    id: 11,
    usuario: 'Fernando Arellanos [26954]',
    accion: 'transferred',
    descripcion: 'the policy [MENSABLAAD#16767] from Nelson Vasquez [26954] to Yamiry Paredes [7237]',
    fecha: 'Oct 07, 2025',
    hora: '7:50 PM',
    tipo: 'transfer'
  },
  {
    id: 12,
    usuario: 'Nelson Vasquez [26954]',
    accion: 'updated',
    descripcion: 'the policy document status from Pending to Completed of the policy [MENSABLAAD#16767]',
    fecha: 'Oct 07, 2025',
    hora: '6:20 PM',
    tipo: 'complete'
  },
  {
    id: 13,
    usuario: 'Nelson Vasquez [26954]',
    accion: 'updated',
    descripcion: 'the policy status from New to New of the policy [MENSABLAAD#16767]',
    fecha: 'Oct 07, 2025',
    hora: '6:20 PM',
    tipo: 'update'
  },
  {
    id: 14,
    usuario: 'Nelson Vasquez [26954]',
    accion: 'submitted',
    descripcion: 'the policy the policy [MENSABLAAD#16767]',
    fecha: 'Oct 07, 2025',
    hora: '6:20 PM',
    tipo: 'complete'
  },
  {
    id: 15,
    usuario: 'Nelson Vasquez [26954]',
    accion: 'updated',
    descripcion: '[MENSABLAAD#16767]',
    fecha: 'Oct 07, 2025',
    hora: '6:20 PM',
    tipo: 'update'
  },
  {
    id: 16,
    usuario: 'Nelson Vasquez [26954]',
    accion: 'created',
    descripcion: 'the policy [MENSABLAAD#16767] as a duplicate of SCP-0E4PH8014',
    fecha: 'Oct 07, 2025',
    hora: '6:20 PM',
    tipo: 'create'
  }
];

// Función para extraer cambios de la descripción
const extractChangesFromDescription = (descripcion: string, tipo: string): {campo: string, valorAntes: string, valorDespues: string}[] => {
  const changes = [];
  
  // Extraer cambios de status
  const statusMatch = descripcion.match(/status from (.+?) to (.+?) of/);
  if (statusMatch) {
    changes.push({
      campo: 'Estado',
      valorAntes: statusMatch[1].trim(),
      valorDespues: statusMatch[2].trim()
    });
  }
  
  // Extraer cambios de SSN
  const ssnMatch = descripcion.match(/social security Number \(SSN\)/);
  if (ssnMatch) {
    changes.push({
      campo: 'SSN',
      valorAntes: '***-**-1234',
      valorDespues: '***-**-5678'
    });
  }
  
  // Extraer cambios de documentos
  const docMatch = descripcion.match(/document to the policy/);
  if (docMatch) {
    changes.push({
      campo: 'Documentos',
      valorAntes: 'Pendiente',
      valorDespues: 'Documento agregado'
    });
  }
  
  // Extraer asignaciones
  const assignMatch = descripcion.match(/to (.+?)\s*$/);
  if (tipo === 'assign' && assignMatch) {
    changes.push({
      campo: 'Agente',
      valorAntes: 'Sin asignar',
      valorDespues: assignMatch[1].trim()
    });
  }
  
  // Extraer desasignaciones
  const unassignMatch = descripcion.match(/from (.+?)$/);
  if (tipo === 'transfer' && unassignMatch) {
    changes.push({
      campo: 'Agente responsable',
      valorAntes: unassignMatch[1].trim(),
      valorDespues: 'Sin asignar'
    });
  }
  
  // Extraer transferencias
  const transferMatch = descripcion.match(/from (.+?) to (.+?)$/);
  if (tipo === 'transfer' && transferMatch) {
    changes.push({
      campo: 'Agente responsable',
      valorAntes: transferMatch[1].trim(),
      valorDespues: transferMatch[2].trim()
    });
  }
  
  // Para creaciones
  if (tipo === 'create') {
    changes.push({
      campo: 'Estado de póliza',
      valorAntes: 'No existe',
      valorDespues: 'Creada'
    });
  }
  
  // Para envíos/submissions
  if (tipo === 'complete' && descripcion.includes('submitted')) {
    changes.push({
      campo: 'Estado de envío',
      valorAntes: 'Borrador',
      valorDespues: 'Enviada'
    });
  }
  
  // Si no se encontraron cambios específicos, crear uno genérico
  if (changes.length === 0) {
    changes.push({
      campo: 'Plan',
      valorAntes: 'Platino',
      valorDespues: 'Diamante'
    });
  }
  
  return changes;
};

const getTipoColor = (tipo: string) => {
  switch (tipo) {
    case 'create':
      return 'bg-blue-500';
    case 'update':
      return 'bg-blue-500';
    case 'complete':
      return 'bg-green-500';
    case 'assign':
      return 'bg-purple-500';
    case 'transfer':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
};

export function RegistrosActividadModal({ isOpen, onClose, polizaId }: RegistrosActividadModalProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-full">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Registros de actividad de póliza
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[600px] w-full">
          <div className="space-y-3 pr-4">
            {mockRegistros.map((registro) => (
              <Collapsible
                key={registro.id}
                open={expandedItems.has(registro.id)}
                onOpenChange={() => toggleExpanded(registro.id)}
              >
                <div className="border rounded-lg overflow-hidden">
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center space-x-3 text-left p-3 hover:bg-gray-50 transition-colors">
                      {/* Indicador de tipo */}
                      <div className={`w-3 h-3 rounded-full ${getTipoColor(registro.tipo)} flex-shrink-0`} />
                      
                      {/* Contenido principal - solo acción inicialmente */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <span className="font-medium text-blue-600">
                              {registro.usuario}
                            </span>
                            <span className="ml-2 text-gray-700">
                              {registro.accion}
                            </span>
                            <span className="ml-2 text-gray-600">
                              {registro.descripcion}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                            <span className="text-sm text-gray-500">
                              {registro.fecha} {registro.hora}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  {/* Detalles expandibles - siempre disponibles para todos los registros */}
                  <CollapsibleContent className="border-t bg-gray-50">
                    <div className="p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="font-medium text-sm">
                          {registro.usuario} {registro.accion} [{polizaId}]
                        </span>
                        <span className="text-xs text-gray-500">
                          {registro.fecha} {registro.hora}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">
                        Campos modificados en la actualización de la póliza
                      </p>
                      
                      {/* Tabla de cambios - siempre mostrar */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-4 text-xs font-medium text-gray-700 border-b border-gray-200 pb-2">
                          <div>Campo</div>
                          <div>Valor anterior</div>
                          <div>Valor actualizado</div>
                        </div>
                        
                        {(registro.detalles || extractChangesFromDescription(registro.descripcion, registro.tipo)).map((detalle, index) => (
                          <div key={index} className="grid grid-cols-3 gap-4 text-sm py-2 border-b border-gray-100 last:border-b-0">
                            <div className="text-gray-600 font-medium">{detalle.campo}</div>
                            <div className="text-gray-500 italic">
                              {detalle.valorAntes || '—'}
                            </div>
                            <div className="font-medium text-gray-800">
                              {detalle.valorDespues}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>

      </DialogContent>
    </Dialog>
  );
}