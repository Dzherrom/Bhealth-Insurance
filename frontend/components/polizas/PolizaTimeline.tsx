'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface TimelineEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  type: 'created' | 'modified' | 'approved' | 'cancelled' | 'renewed';
  status?: string;
}

interface PolizaTimelineProps {
  events: TimelineEvent[];
}

const getEventIcon = (type: string) => {
  switch (type) {
    case 'created':
      return <Calendar className="w-4 h-4" />;
    case 'modified':
      return <Clock className="w-4 h-4" />;
    case 'approved':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'cancelled':
      return <XCircle className="w-4 h-4 text-red-600" />;
    case 'renewed':
      return <AlertCircle className="w-4 h-4 text-blue-600" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

const getEventColor = (type: string) => {
  switch (type) {
    case 'created':
      return 'bg-blue-100 border-blue-200 text-blue-800';
    case 'modified':
      return 'bg-yellow-100 border-yellow-200 text-yellow-800';
    case 'approved':
      return 'bg-green-100 border-green-200 text-green-800';
    case 'cancelled':
      return 'bg-red-100 border-red-200 text-red-800';
    case 'renewed':
      return 'bg-purple-100 border-purple-200 text-purple-800';
    default:
      return 'bg-gray-100 border-gray-200 text-gray-800';
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function PolizaTimeline({ events }: PolizaTimelineProps) {
  if (!events || events.length === 0) {
    return null;
  }

  // Ordenar eventos por fecha (más reciente primero)
  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span>Historial de la Póliza</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Línea vertical del timeline */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          <div className="space-y-6">
            {sortedEvents.map((event, index) => (
              <div key={event.id} className="relative flex items-start space-x-4">
                {/* Icono del evento */}
                <div className="relative z-10 flex-shrink-0 w-8 h-8 bg-white dark:bg-[#1e293b] border-2 border-gray-200 rounded-full flex items-center justify-center">
                  {getEventIcon(event.type)}
                </div>
                
                {/* Contenido del evento */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">{event.title}</h4>
                    <Badge className={getEventColor(event.type)}>
                      {event.type === 'created' && 'Creada'}
                      {event.type === 'modified' && 'Modificada'}
                      {event.type === 'approved' && 'Aprobada'}
                      {event.type === 'cancelled' && 'Cancelada'}
                      {event.type === 'renewed' && 'Renovada'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{event.description}</p>
                  <p className="text-xs text-gray-500">{formatDate(event.date)}</p>
                  {event.status && (
                    <Badge variant="outline" className="text-xs">
                      Estado: {event.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {sortedEvents.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No hay eventos registrados para esta póliza</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}