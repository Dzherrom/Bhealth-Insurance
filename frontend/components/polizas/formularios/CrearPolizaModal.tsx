'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { usePolizaStore } from '@/store/polizaStore';
import { useToast } from '@/hooks/use-toast';
import type { PolizaCreateRequest, RelacionFamiliar } from '@/types';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Agrega los campos faltantes e interface base para interactuar
interface PolizaFormValues {
  id_mercado: string;
  id_miembro: string;
  id_interno: string;
  fecha_efectiva: string;
  fecha_envio: string;
  plan: string;
  agente: string;
  estado: string;
  prima_mensual: number;
  costo_poliza: number;
  subsidio: number;
  cliente_id: string;
  direccion_residencia: string;
  relacion: RelacionFamiliar;
}

interface CrearPolizaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (polizaId: number) => void;
}

const today = new Date().toISOString().slice(0, 10);

export function CrearPolizaModal({ isOpen, onClose, onCreated }: CrearPolizaModalProps) {
  const { createPoliza, isCreating } = usePolizaStore();
  const { toast } = useToast();
  const { register, handleSubmit, reset } = useForm<PolizaFormValues>({
    defaultValues: {
      fecha_envio: today,
      relacion: 'Self',
      subsidio: 0,
      costo_poliza: 0,
      prima_mensual: 0,
    },
  });

  const handleOpenChange = (open: boolean) => {
    if (!open && !isCreating) {
      onClose();
    }
  };

  const onSubmit = async (data: PolizaFormValues) => {
    const payload: PolizaCreateRequest = {
      id_mercado: data.id_mercado.trim(),
      id_miembro: data.id_miembro.trim(),
      id_interno: data.id_interno.trim(),
      fecha_efectiva: data.fecha_efectiva,
      fecha_envio: data.fecha_envio,
      plan: Number(data.plan),
      agente: Number(data.agente),
      estado: Number(data.estado),
      prima_mensual: Number(data.prima_mensual),
      costo_poliza: Number(data.costo_poliza),
      subsidio: Number(data.subsidio),
      clientes_data: [
        {
          cliente: Number(data.cliente_id),
          es_solicitante_principal: true,
          relacion: data.relacion,
          direccion_residencia: Number(data.direccion_residencia),
        },
      ],
    };

    try {
      const poliza = await createPoliza(payload);
      toast({ title: 'Póliza creada', description: `Se registró ${poliza.id_mercado}.` });
      reset({
        fecha_envio: today,
        relacion: 'Self',
        subsidio: 0,
        costo_poliza: 0,
        prima_mensual: 0,
        id_mercado: '',
        id_miembro: '',
        id_interno: '',
        fecha_efectiva: '',
        plan: '',
        agente: '',
        estado: '',
        cliente_id: '',
        direccion_residencia: '',
      });
      onClose();
      onCreated?.(poliza.id);
    } catch (error) {
      const description = error instanceof Error ? error.message : 'No se pudo crear la póliza';
      toast({ title: 'Error', description, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Póliza</DialogTitle>
          <DialogDescription>
            Llene la información base para registrar una nueva póliza.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            
            <div className="space-y-2">
              <Label>ID de Mercado</Label>
              <Input {...register('id_mercado', { required: true })} placeholder="MKT-..." />
            </div>

            <div className="space-y-2">
              <Label>ID de Miembro</Label>
              <Input {...register('id_miembro', { required: true })} placeholder="MEM-..." />
            </div>

            <div className="space-y-2">
              <Label>ID Interno</Label>
              <Input {...register('id_interno', { required: true })} placeholder="..." />
            </div>

            <div className="space-y-2">
              <Label>Cliente Principal (ID)</Label>
              <Input type="number" {...register('cliente_id', { required: true })} placeholder="ID del Cliente..." />
            </div>

            <div className="space-y-2">
              <Label>Dirección residencia (ID)</Label>
              <Input type="number" {...register('direccion_residencia', { required: true })} placeholder="ID de dirección..." />
            </div>

            <div className="space-y-2">
              <Label>Plan (ID)</Label>
              <Input type="number" {...register('plan', { required: true })} placeholder="Ej. 12" />
            </div>

            <div className="space-y-2">
              <Label>Agente (ID)</Label>
              <Input type="number" {...register('agente', { required: true })} placeholder="Agente asignado" />
            </div>

            <div className="space-y-2">
              <Label>Estado (ID)</Label>
              <Input type="number" {...register('estado', { required: true })} placeholder="Ej. 1" />
            </div>

            <div className="space-y-2">
              <Label>Fecha Efectiva</Label>
              <Input type="date" {...register('fecha_efectiva', { required: true })} />
            </div>

            <div className="space-y-2">
              <Label>Fecha Envío</Label>
              <Input type="date" {...register('fecha_envio', { required: true })} />
            </div>

            <div className="space-y-2">
              <Label>Prima Mensual</Label>
              <Input type="number" step="0.01" {...register('prima_mensual', { valueAsNumber: true, required: true })} placeholder="0.00" />
            </div>

            <div className="space-y-2">
              <Label>Costo Póliza</Label>
              <Input type="number" step="0.01" {...register('costo_poliza', { valueAsNumber: true, required: true })} placeholder="0.00" />
            </div>

            <div className="space-y-2">
              <Label>Subsidio</Label>
              <Input type="number" step="0.01" {...register('subsidio', { valueAsNumber: true, required: true })} placeholder="0.00" />
            </div>

            <div className="space-y-2">
              <Label>Relación del solicitante</Label>
              <Input {...register('relacion', { required: true })} placeholder="Self" />
            </div>

          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={isCreating}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Guardando...' : 'Guardar Póliza'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}