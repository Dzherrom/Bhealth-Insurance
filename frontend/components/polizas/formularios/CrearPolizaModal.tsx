'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';

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
  plan: string;
  agente: string;
  estado: string;
  prima_mensual: number;
  costo_poliza: number;
  subsidio: number;
  cliente_id: string; // <-- Nuevo campo solicitado
}

interface CrearPolizaModalProps {
  isOpen: boolean;
  onClose: () => void;
  // onSave: (data: PolizaFormValues) => void;
}

export function CrearPolizaModal({ isOpen, onClose }: CrearPolizaModalProps) {
  const { register, handleSubmit, reset } = useForm<PolizaFormValues>();

  const onSubmit = (data: PolizaFormValues) => {
    console.log("Nueva PÃ³liza data: ", data);
    // onSave(data) -> llamar mÃ©todo del store o API
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva PÃ³liza</DialogTitle>
          <DialogDescription>
            Llene la informaciÃ³n base para registrar una nueva pÃ³liza.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            
            <div className="space-y-2">
              <Label>ID de Mercado</Label>
              <Input {...register('id_mercado')} placeholder="MKT-..." />
            </div>

            <div className="space-y-2">
              <Label>ID de Miembro</Label>
              <Input {...register('id_miembro')} placeholder="MEM-..." />
            </div>

            <div className="space-y-2">
              <Label>ID Interno</Label>
              <Input {...register('id_interno')} placeholder="..." />
            </div>

            <div className="space-y-2">
              <Label>Cliente Principal (ID)</Label>
              <Input {...register('cliente_id')} placeholder="ID del Cliente..." />
            </div>

            <div className="space-y-2">
              <Label>Plan</Label>
              <Input {...register('plan')} placeholder="Ej. Ambetter Gold" />
            </div>

            <div className="space-y-2">
              <Label>Agente (ID / NPN)</Label>
              <Input {...register('agente')} placeholder="Agente asigando" />
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Input {...register('estado')} placeholder="Ej. Activa / Pendiente" />
            </div>

            <div className="space-y-2">
              <Label>Fecha Efectiva</Label>
              <Input type="date" {...register('fecha_efectiva')} />
            </div>

            <div className="space-y-2">
              <Label>Prima Mensual</Label>
              <Input type="number" step="0.01" {...register('prima_mensual')} placeholder="0.00" />
            </div>

            <div className="space-y-2">
              <Label>Costo PÃ³liza</Label>
              <Input type="number" step="0.01" {...register('costo_poliza')} placeholder="0.00" />
            </div>

            <div className="space-y-2">
              <Label>Subsidio</Label>
              <Input type="number" step="0.01" {...register('subsidio')} placeholder="0.00" />
            </div>

          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Guardar PÃ³liza
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}