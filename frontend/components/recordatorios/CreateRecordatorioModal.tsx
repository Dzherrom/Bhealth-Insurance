'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CreateRecordatorioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recordatorio: {
    usuario: string;
    titulo: string;
    cliente: string;
    poliza: string;
    fechaVencimiento: string;
    horaVencimiento: string;
    estado: 'pendiente' | 'completado' | 'vencido';
    descripcion: string;
    esPrivado: boolean;
  }) => void;
  polizaId?: string;
}

export function CreateRecordatorioModal({ isOpen, onClose, onSave, polizaId }: CreateRecordatorioModalProps) {
  const [fechaVencimiento, setFechaVencimiento] = useState<Date>();
  const [horaVencimiento, setHoraVencimiento] = useState('09:00');
  const [zonaHoraria, setZonaHoraria] = useState('America/New_York');
  const [tipoRecordatorio, setTipoRecordatorio] = useState('');
  const [paraQueEs, setParaQueEs] = useState('');
  const [quienNotificar, setQuienNotificar] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [esPrivado, setEsPrivado] = useState(false);

  const resetForm = () => {
    setFechaVencimiento(undefined);
    setHoraVencimiento('09:00');
    setZonaHoraria('America/New_York');
    setTipoRecordatorio('');
    setParaQueEs('');
    setQuienNotificar('');
    setDescripcion('');
    setEsPrivado(false);
  };

  const handleSave = () => {
    if (!fechaVencimiento || !tipoRecordatorio || !paraQueEs || !quienNotificar) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    const recordatorio = {
      usuario: 'Usuario Actual',
      titulo: `${paraQueEs} - ${tipoRecordatorio}`,
      cliente: 'Nelson Vado', // Hardcodeado por ahora
      poliza: polizaId || 'POL-2024-001',
      fechaVencimiento: fechaVencimiento.toISOString(),
      horaVencimiento: horaVencimiento,
      estado: 'pendiente' as const,
      descripcion: descripcion,
      esPrivado: esPrivado
    };

    onSave(recordatorio);
    resetForm();
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const tiposRecordatorio = [
    'Seguimiento de documentos',
    'Verificación de elegibilidad',
    'Renovación de póliza',
    'Contacto con cliente',
    'Revisión de cobertura',
    'Pago pendiente'
  ];

  const opcionesPara = [
    'Documentación pendiente',
    'Llamada de seguimiento',
    'Revisión médica',
    'Actualización de datos',
    'Verificación de beneficios',
    'Proceso de renovación'
  ];

  const opcionesNotificar = [
    'Solo a mí',
    'Equipo de agentes',
    'Supervisor directo',
    'Departamento médico',
    'Administración',
    'Cliente y agente'
  ];

  const horasDisponibles = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      horasDisponibles.push(timeString);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear un nuevo recordatorio</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Fecha de vencimiento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="fecha" className="text-sm font-medium">
                Fecha de vencimiento <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal mt-1"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaVencimiento ? format(fechaVencimiento, 'dd/MM/yyyy', { locale: es }) : 'dd/mm/yyyy'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fechaVencimiento}
                    onSelect={setFechaVencimiento}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label htmlFor="hora" className="text-sm font-medium">
                Hora de vencimiento <span className="text-red-500">*</span>
              </Label>
              <Select value={horaVencimiento} onValueChange={setHoraVencimiento}>
                <SelectTrigger className="mt-1">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {horasDisponibles.map((hora) => (
                    <SelectItem key={hora} value={hora}>
                      {hora}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Zona horaria */}
          <div>
            <Label htmlFor="zona" className="text-sm font-medium text-gray-600">
              Zona horaria
            </Label>
            <Select value={zonaHoraria} onValueChange={setZonaHoraria}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">America/New_York, EST</SelectItem>
                <SelectItem value="America/Los_Angeles">America/Los_Angeles, PST</SelectItem>
                <SelectItem value="America/Chicago">America/Chicago, CST</SelectItem>
                <SelectItem value="America/Denver">America/Denver, MST</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Establecer recordatorio */}
          <div>
            <Label htmlFor="tipo" className="text-sm font-medium">
              Establecer recordatorio <span className="text-red-500">*</span>
            </Label>
            <Select value={tipoRecordatorio} onValueChange={setTipoRecordatorio}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccionar tipo de recordatorio" />
              </SelectTrigger>
              <SelectContent>
                {tiposRecordatorio.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Para qué es este recordatorio */}
          <div>
            <Label htmlFor="para" className="text-sm font-medium">
              ¿Para qué es este recordatorio? <span className="text-red-500">*</span>
            </Label>
            <Select value={paraQueEs} onValueChange={setParaQueEs}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccionar una opción" />
              </SelectTrigger>
              <SelectContent>
                {opcionesPara.map((opcion) => (
                  <SelectItem key={opcion} value={opcion}>
                    {opcion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quién debe ser notificado */}
          <div>
            <Label htmlFor="notificar" className="text-sm font-medium">
              ¿Quién debe ser notificado? <span className="text-red-500">*</span>
            </Label>
            <Select value={quienNotificar} onValueChange={setQuienNotificar}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccionar una opción" />
              </SelectTrigger>
              <SelectContent>
                {opcionesNotificar.map((opcion) => (
                  <SelectItem key={opcion} value={opcion}>
                    {opcion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descripción */}
          <div>
            <Label htmlFor="descripcion" className="text-sm font-medium">
              Descripción/Comentarios
            </Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Opcional: Escribir más detalles sobre este recordatorio..."
              className="mt-1 min-h-[80px]"
            />
          </div>

          {/* Checkbox recordatorio privado */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="privado"
              checked={esPrivado}
              onCheckedChange={(checked) => setEsPrivado(checked as boolean)}
            />
            <Label htmlFor="privado" className="text-sm text-gray-600">
              Recordatorio privado (solo será visible para tí)
            </Label>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}