'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface RecordatorioFormData {
  titulo: string;
  fecha_vencimiento: string;
  hora_vencimiento: string;
  zona_horaria: string;
  establecer_recordatorio: boolean;
  usuario_notificar: number;
  descripcion?: string;
  poliza: number;
}

interface CreateRecordatorioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recordatorio: RecordatorioFormData) => void;
  polizaId?: string;
  userId?: number;
  mode?: 'create' | 'edit';
  initialData?: Partial<RecordatorioFormData>;
}

export function CreateRecordatorioModal({
  isOpen,
  onClose,
  onSave,
  polizaId,
  userId,
  mode = 'create',
  initialData,
}: CreateRecordatorioModalProps) {
  const [fechaVencimiento, setFechaVencimiento] = useState<Date>();
  const [horaVencimiento, setHoraVencimiento] = useState('09:00');
  const [zonaHoraria, setZonaHoraria] = useState('America/New_York');
  const [tipoRecordatorio, setTipoRecordatorio] = useState('');
  const [paraQueEs, setParaQueEs] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [esPrivado, setEsPrivado] = useState(false);

  const tiposRecordatorio = useMemo(
    () => [
      'Seguimiento de documentos',
      'Verificacion de elegibilidad',
      'Renovacion de poliza',
      'Contacto con cliente',
      'Revision de cobertura',
      'Pago pendiente',
    ],
    []
  );

  const opcionesPara = useMemo(
    () => [
      'Documentacion pendiente',
      'Llamada de seguimiento',
      'Revision medica',
      'Actualizacion de datos',
      'Verificacion de beneficios',
      'Proceso de renovacion',
    ],
    []
  );

  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'edit' && initialData) {
      const parts = (initialData.titulo || '').split(' - ');
      setParaQueEs(parts[0] || '');
      setTipoRecordatorio(parts[1] || initialData.titulo || '');
      setHoraVencimiento(initialData.hora_vencimiento || '09:00');
      setZonaHoraria(initialData.zona_horaria || 'America/New_York');
      setDescripcion(initialData.descripcion || '');
      setEsPrivado(!(initialData.establecer_recordatorio ?? true));

      if (initialData.fecha_vencimiento) {
        const parsed = new Date(initialData.fecha_vencimiento);
        if (!Number.isNaN(parsed.getTime())) {
          setFechaVencimiento(parsed);
        }
      }
      return;
    }

    setFechaVencimiento(undefined);
    setHoraVencimiento('09:00');
    setZonaHoraria('America/New_York');
    setTipoRecordatorio('');
    setParaQueEs('');
    setDescripcion('');
    setEsPrivado(false);
  }, [isOpen, mode, initialData]);

  const handleSave = () => {
    if (!fechaVencimiento || !tipoRecordatorio || !paraQueEs || !polizaId) {
      alert('Completa los campos obligatorios');
      return;
    }

    const payload: RecordatorioFormData = {
      poliza: Number(polizaId),
      titulo: `${paraQueEs} - ${tipoRecordatorio}`,
      fecha_vencimiento: format(fechaVencimiento, 'yyyy-MM-dd'),
      hora_vencimiento: horaVencimiento,
      zona_horaria: zonaHoraria,
      establecer_recordatorio: !esPrivado,
      usuario_notificar: Number(initialData?.usuario_notificar || userId || 1),
      descripcion: descripcion || '',
    };

    onSave(payload);
  };

  const horasDisponibles: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      horasDisponibles.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Editar recordatorio' : 'Crear recordatorio'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium">
                Fecha de vencimiento <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal mt-1">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaVencimiento ? format(fechaVencimiento, 'dd/MM/yyyy', { locale: es }) : 'dd/mm/yyyy'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={fechaVencimiento} onSelect={setFechaVencimiento} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="text-sm font-medium">
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

          <div>
            <Label className="text-sm font-medium text-gray-600">Zona horaria</Label>
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

          <div>
            <Label className="text-sm font-medium">
              Tipo <span className="text-red-500">*</span>
            </Label>
            <Select value={tipoRecordatorio} onValueChange={setTipoRecordatorio}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccionar tipo" />
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

          <div>
            <Label className="text-sm font-medium">
              Motivo <span className="text-red-500">*</span>
            </Label>
            <Select value={paraQueEs} onValueChange={setParaQueEs}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccionar motivo" />
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

          <div>
            <Label className="text-sm font-medium">Descripcion</Label>
            <Textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Opcional"
              className="mt-1 min-h-[80px]"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="privado"
              checked={esPrivado}
              onCheckedChange={(checked) => setEsPrivado(Boolean(checked))}
            />
            <Label htmlFor="privado" className="text-sm text-gray-600">
              Privado (sin notificacion automatica)
            </Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              {mode === 'edit' ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
