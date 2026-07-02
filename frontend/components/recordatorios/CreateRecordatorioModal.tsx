'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  RECORDATORIO_ANTELACIONES,
  RECORDATORIO_MOTIVOS,
  RECORDATORIO_TIPOS,
  type RecordatorioAntelacion,
  type RecordatorioMotivo,
  type RecordatorioTipo,
} from '@/lib/recordatorios';

export interface RecordatorioFormData {
  titulo?: string;
  tipo: RecordatorioTipo;
  motivo?: RecordatorioMotivo | '';
  fecha_vencimiento: string;
  hora_vencimiento: string;
  zona_horaria: string;
  antelacion: RecordatorioAntelacion;
  establecer_recordatorio: boolean;
  es_privado: boolean;
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

const MOTIVO_NONE = '__none__';

function normalizeTime(value?: string): string {
  if (!value) return '09:00';
  return value.slice(0, 5);
}

function toApiTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
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
  const [tipoRecordatorio, setTipoRecordatorio] = useState<RecordatorioTipo | ''>('');
  const [motivo, setMotivo] = useState<RecordatorioMotivo | typeof MOTIVO_NONE>(MOTIVO_NONE);
  const [antelacion, setAntelacion] = useState<RecordatorioAntelacion>('1h');
  const [descripcion, setDescripcion] = useState('');
  const [esPrivado, setEsPrivado] = useState(false);

  const horasDisponibles = useMemo(() => {
    const slots: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'edit' && initialData) {
      setTipoRecordatorio((initialData.tipo as RecordatorioTipo) || '');
      setMotivo(initialData.motivo ? (initialData.motivo as RecordatorioMotivo) : MOTIVO_NONE);
      setAntelacion((initialData.antelacion as RecordatorioAntelacion) || '1h');
      setHoraVencimiento(normalizeTime(initialData.hora_vencimiento));
      setZonaHoraria(initialData.zona_horaria || 'America/New_York');
      setDescripcion(initialData.descripcion || '');
      setEsPrivado(Boolean(initialData.es_privado));

      if (initialData.fecha_vencimiento) {
        const parsed = new Date(`${initialData.fecha_vencimiento}T12:00:00`);
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
    setMotivo(MOTIVO_NONE);
    setAntelacion('1h');
    setDescripcion('');
    setEsPrivado(false);
  }, [isOpen, mode, initialData]);

  const handleSave = () => {
    if (!fechaVencimiento || !tipoRecordatorio || !antelacion || !polizaId) {
      alert('Completa los campos obligatorios');
      return;
    }

    const motivoValue = motivo === MOTIVO_NONE ? '' : motivo;

    const payload: RecordatorioFormData = {
      poliza: Number(polizaId),
      tipo: tipoRecordatorio,
      motivo: motivoValue,
      fecha_vencimiento: format(fechaVencimiento, 'yyyy-MM-dd'),
      hora_vencimiento: toApiTime(horaVencimiento),
      zona_horaria: zonaHoraria,
      antelacion,
      establecer_recordatorio: true,
      es_privado: esPrivado,
      usuario_notificar: Number(initialData?.usuario_notificar || userId || 1),
      descripcion: descripcion || '',
    };

    onSave(payload);
  };

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
            <Label className="text-sm font-medium">
              Recordar con antelación <span className="text-red-500">*</span>
            </Label>
            <Select value={antelacion} onValueChange={(value) => setAntelacion(value as RecordatorioAntelacion)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccionar antelación" />
              </SelectTrigger>
              <SelectContent>
                {RECORDATORIO_ANTELACIONES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              El agente recibirá una notificación en el CRM en ese momento antes del vencimiento.
            </p>
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
              Tipo de recordatorio <span className="text-red-500">*</span>
            </Label>
            <Select value={tipoRecordatorio} onValueChange={(value) => setTipoRecordatorio(value as RecordatorioTipo)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {RECORDATORIO_TIPOS.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">Motivo</Label>
            <Select value={motivo} onValueChange={(value) => setMotivo(value as RecordatorioMotivo | typeof MOTIVO_NONE)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccionar motivo (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MOTIVO_NONE}>Sin motivo específico</SelectItem>
                {RECORDATORIO_MOTIVOS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">Descripción</Label>
            <Textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Escriba aqui mas detalles sobre el recordatorio"
              className="mt-1 min-h-[80px]"
            />
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-500" />
                <Label htmlFor="privado" className="text-sm font-medium text-slate-800">
                  Recordatorio privado
                </Label>
              </div>
              <p className="text-xs text-slate-500">
                Solo será visible para el usuario que lo creó.
              </p>
            </div>
            <Switch id="privado" checked={esPrivado} onCheckedChange={setEsPrivado} />
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
