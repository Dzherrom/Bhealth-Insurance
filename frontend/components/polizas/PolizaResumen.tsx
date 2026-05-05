'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { NotasChat } from '@/components/notas/NotasChat';
import { RegistrosActividadModal } from './RegistrosActividadModal';
import { 
  FileText, 
  File, 
  Clock, 
  Bell, 
  Calendar,
  Users,
  Phone,
  Building,
  MapPin,
  CreditCard,
  Archive,
  Eye,
  EyeOff,
  Copy,
  MessageSquare
} from 'lucide-react';

interface PolizaResumenProps {
  poliza: {
    id_mercado: string;
    agente_nombre: string;
    plan_nombre: string;
    estado_nombre: string;
    prima_mensual: string;
    fecha_efectiva: string;
    cliente_principal: string;
  };
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

export function PolizaResumen({ poliza, activeSection = 'poliza', onSectionChange }: PolizaResumenProps) {
  const [isContactInfoVisible, setIsContactInfoVisible] = useState(false);
  const [isNotasChatOpen, setIsNotasChatOpen] = useState(false);
  const [isRegistrosModalOpen, setIsRegistrosModalOpen] = useState(false);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Aquí podrías agregar una notificación de éxito si tienes un sistema de toast
      console.log(`${type} copiado al portapapeles: ${text}`);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  const formatCurrency = (amount: string) => {
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const navigationItems = [
    { id: 'poliza', icon: FileText, label: 'Póliza', active: activeSection === 'poliza' },
    { id: 'documentos', icon: File, label: 'Documentos', count: 12, active: activeSection === 'documentos' },
    { id: 'hive', icon: Archive, label: 'HIVE', count: 4, active: activeSection === 'hive' },
    { id: 'notas', icon: MessageSquare, label: 'Notas', count: 8, active: false, isChat: true },
    { id: 'recordatorios', icon: Bell, label: 'Recordatorios', count: 2, active: activeSection === 'recordatorios' },
    { id: 'calendario', icon: Calendar, label: 'Calendario de Primas', active: activeSection === 'calendario' },
    { id: 'comentarios', icon: Users, label: 'Comentarios', active: activeSection === 'comentarios' },
    { id: 'tareas', icon: Phone, label: 'Tareas', active: activeSection === 'tareas' },
    { id: 'centros', icon: CreditCard, label: 'Centros de vida', active: activeSection === 'centros' },
    { id: 'registro', icon: MapPin, label: 'Registro', active: false, isModal: true }
  ];

  return (
    <div className="w-80 space-y-4">
      {/* Información del titular */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-lg">Resumen</h3>
            </div>
            
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Agencias:</span>
                <p className="font-medium">VENDE FAMILIA</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Aseguradora:</span>
                <p className="font-medium">ISAAC FAMILY</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Código Interno:</span>
                <p className="font-medium">INDEAAPPFOREST</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Aseguradoras:</span>
                <p className="font-medium">Oscar</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Efectividad:</span>
                <p className="font-medium">09/01/2026</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Estado:</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  PENDIENTE VERIFICAR YEARLY 2026
                </Badge>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Enlace Documentos:</span>
                <p className="font-medium text-green-600">COMPLETADO</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Estado:</span>
                <p className="font-medium text-orange-600">PENDIENTE</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Última actualización:</span>
                <p className="font-medium">Dec 03, 2026 6:55 PM</p>
              </div>
            </div>
            
            <Separator />
            
            {/* Información del hogar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Información del hogar</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsContactInfoVisible(!isContactInfoVisible)}
                  className="h-8 w-8 p-0"
                  title={isContactInfoVisible ? "Ocultar información de contacto" : "Mostrar información de contacto"}
                >
                  {isContactInfoVisible ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Titular:</span>
                <p className="font-medium">NELSON VADO</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Fecha nacimiento:</span>
                <p className="font-medium">08/20/1988</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Teléfono:</span>
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    {isContactInfoVisible ? "(555) 123-4772" : "***********4772"}
                  </p>
                  {isContactInfoVisible && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard("(555) 123-4772", "Teléfono")}
                      className="h-6 w-6 p-0 ml-2"
                      title="Copiar teléfono"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Correo:</span>
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    {isContactInfoVisible ? "nelson.vado@email.com" : "***********@"}
                  </p>
                  {isContactInfoVisible && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard("nelson.vado@email.com", "Correo")}
                      className="h-6 w-6 p-0 ml-2"
                      title="Copiar correo"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Ubicación:</span>
                <p className="font-medium">Georgia 30044</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Ingresos anuales:</span>
                <p className="font-medium">$17,000.00</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500"># miembros:</span>
                <p className="font-medium">DSKTFBY$252f@</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navegación */}
      <Card>
        <CardContent className="p-0">
          <div className="space-y-1">
            {navigationItems.map((item, index) => (
              <div key={index}>
                <Button 
                  variant={item.active ? "secondary" : "ghost"} 
                  className={`w-full justify-between p-3 h-auto ${item.active ? 'bg-blue-50 text-blue-700' : ''}`}
                  onClick={() => {
                    if (item.isChat) {
                      setIsNotasChatOpen(true);
                    } else if (item.isModal) {
                      setIsRegistrosModalOpen(true);
                    } else {
                      onSectionChange && onSectionChange(item.id);
                    }
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  {item.count && (
                    <Badge variant="secondary" className="text-xs">
                      {item.count}
                    </Badge>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Chat de Notas */}
      <NotasChat 
        isOpen={isNotasChatOpen}
        onClose={() => setIsNotasChatOpen(false)}
        polizaInfo={{
          cliente: poliza.cliente_principal,
          plan: poliza.plan_nombre,
          id: poliza.id_mercado
        }}
      />
      
      {/* Modal de Registros de Actividad */}
      <RegistrosActividadModal 
        isOpen={isRegistrosModalOpen}
        onClose={() => setIsRegistrosModalOpen(false)}
        polizaId={poliza.id_mercado}
      />
    </div>
  );
}