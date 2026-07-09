'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CAMPO_LABELS, clientLight } from './constants';

export type SolicitudCambioMode =
  | { type: 'campo'; campo: string; label?: string }
  | { type: 'miembro'; clienteId: number; miembroNombre: string; campo: string; campoLabel: string }
  | { type: 'editar'; cambioId: number; campo: string; valorActual?: string; descripcionActual?: string };

interface SolicitudCambioModalProps {
  open: boolean;
  mode: SolicitudCambioMode | null;
  onClose: () => void;
  onSubmit: (payload: { nuevoValor: string; descripcion: string }) => Promise<void>;
  isSubmitting: boolean;
}

export function SolicitudCambioModal({
  open,
  mode,
  onClose,
  onSubmit,
  isSubmitting,
}: SolicitudCambioModalProps) {
  const [nuevoValor, setNuevoValor] = useState('');
  const [descripcion, setDescripcion] = useState('');

  useEffect(() => {
    if (!open || !mode) return;
    if (mode.type === 'editar') {
      setNuevoValor(mode.valorActual || '');
      setDescripcion(mode.descripcionActual || '');
    } else {
      setNuevoValor('');
      setDescripcion('');
    }
  }, [open, mode]);

  const title =
    mode?.type === 'miembro'
      ? `Cambio para ${mode.miembroNombre}`
      : mode?.type === 'editar'
        ? 'Modificar solicitud'
        : 'Solicitar cambio';

  const description =
    mode?.type === 'miembro'
      ? `${mode.campoLabel} — indique el nuevo valor deseado.`
      : mode?.type === 'campo'
        ? `${CAMPO_LABELS[mode.campo] || mode.label || mode.campo} — indique el nuevo valor.`
        : mode?.type === 'editar'
          ? `${CAMPO_LABELS[mode.campo] || mode.campo} — actualice su solicitud pendiente.`
          : '';

  const handleSubmit = async () => {
    if (!nuevoValor.trim()) return;
    await onSubmit({ nuevoValor: nuevoValor.trim(), descripcion: descripcion.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className={`sm:max-w-md max-h-[90vh] overflow-y-auto ${clientLight.dialog}`}>
        <DialogHeader>
          <DialogTitle className={clientLight.dialogTitle}>{title}</DialogTitle>
          <DialogDescription className={clientLight.dialogDescription}>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="nuevoValor" className={clientLight.label}>Nuevo valor</Label>
            <Input
              id="nuevoValor"
              value={nuevoValor}
              onChange={(e) => setNuevoValor(e.target.value)}
              placeholder="Escriba el valor solicitado"
              className={clientLight.input}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion" className={clientLight.label}>Comentario (opcional)</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalle adicional para su agente"
              rows={3}
              className={clientLight.textarea}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
          <Button variant="outline" onClick={onClose} className="border-[#e2e8f0] bg-white text-[#334155] w-full sm:w-auto">
            Cancelar
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
            disabled={isSubmitting || !nuevoValor.trim()}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Enviando...' : mode?.type === 'editar' ? 'Guardar cambios' : 'Enviar solicitud'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
