import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShieldAlert, CalendarClock, Briefcase, Archive, Info } from 'lucide-react';

export function MetadatosPoliza({ poliza }: any) {
  if (!poliza) return <div className="p-4 text-muted-foreground">No hay datos disponibles de la póliza.</div>;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center space-x-2">
          <Archive className="w-5 h-5 text-indigo-600" />
          <span>Metadatos y Detalles de Inscripción</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex flex-col space-y-1 p-3 bg-muted/30 rounded-lg">
            <span className="text-sm font-semibold flex items-center text-muted-foreground"><DollarSign className="w-4 h-4 mr-1" /> Total Ahorros</span>
            <span className="text-lg font-bold text-green-700"></span>
          </div>

          <div className="flex flex-col space-y-1 p-3 bg-muted/30 rounded-lg">
            <span className="text-sm font-semibold flex items-center text-muted-foreground"><ShieldAlert className="w-4 h-4 mr-1" /> El Plan era...</span>
            <span className="text-base font-medium">{poliza.plan_era || 'N/A'}</span>
          </div>

          <div className="flex flex-col space-y-1 p-3 bg-muted/30 rounded-lg">
            <span className="text-sm font-semibold flex items-center text-muted-foreground"><Briefcase className="w-4 h-4 mr-1" /> Tipo de Inscripción</span>
            <span className="text-base font-medium">{poliza.tipo_inscripcion === 'NUEVA' ? 'Nueva Venta' : (poliza.tipo_inscripcion === 'RENOVACION' ? 'Renovación' : 'N/A')}</span>
          </div>

          <div className="flex flex-col space-y-1 p-3 bg-muted/30 rounded-lg">
             <span className="text-sm font-semibold flex items-center text-muted-foreground"><Info className="w-4 h-4 mr-1" /> Razón Especial</span>
             <span className="text-base font-medium">{poliza.razon_inscripcion_especial || 'N/A'}</span>
          </div>

          <div className="flex flex-col space-y-1 p-3 bg-muted/30 rounded-lg">
            <span className="text-sm font-semibold flex items-center text-muted-foreground"><CalendarClock className="w-4 h-4 mr-1" /> Fecha Insc. Especial</span>
            <span className="text-base font-medium">{poliza.fecha_inscripcion_especial || 'N/A'}</span>
          </div>

          <div className="flex flex-col space-y-1 p-3 bg-muted/30 rounded-lg">
             <span className="text-sm font-semibold flex items-center text-muted-foreground"><Info className="w-4 h-4 mr-1" /> FFM Mercado Usado</span>
             <span className="text-base font-medium">{poliza.ffm_mercado || 'N/A'}</span>
          </div>
          
          <div className="flex flex-col space-y-1 p-3 bg-red-50/50 rounded-lg">
            <span className="text-sm font-semibold flex items-center text-red-600"><CalendarClock className="w-4 h-4 mr-1" /> Fecha de Cancelación</span>
            <span className="text-base font-bold text-red-700">{poliza.fecha_cancelacion || 'Vigente'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
