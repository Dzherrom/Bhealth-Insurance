'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import {
  FamilyMemberPersonalForm,
  emptyFamilyMemberForm,
  formDataToClientUpdate,
  type FamilyMemberFormData,
} from '@/components/polizas/FamilyMemberPersonalForm';

interface CrearClienteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (clienteId: number) => void;
}

function buildClientePayload(form: FamilyMemberFormData) {
  const ssn = `TMP-cliente-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6)}`.slice(0, 20);
  return {
    ...formDataToClientUpdate(form),
    estado_inmigracion: 'Desconocido',
    ingreso_anual: 0,
    ssn,
  };
}

export function CrearClienteModal({ open, onOpenChange, onCreated }: CrearClienteModalProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<FamilyMemberFormData>(emptyFamilyMemberForm());
  const [saving, setSaving] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setForm(emptyFamilyMemberForm());
    }
    onOpenChange(nextOpen);
  };

  const handleSave = async () => {
    if (!form.primerNombre.trim() || !form.apellidoPaterno.trim() || !form.fechaNacimiento) {
      toast({
        title: 'Campos obligatorios',
        description: 'Completa nombre, apellido y fecha de nacimiento.',
        variant: 'destructive',
      });
      return;
    }
    if (!form.paisNacimiento || !form.estadoCivil) {
      toast({
        title: 'Campos obligatorios',
        description: 'Selecciona país de nacimiento y estado civil.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const cliente = await api.clientes.create(buildClientePayload(form) as any);
      toast({
        title: 'Cliente creado',
        description: `${form.primerNombre} ${form.apellidoPaterno} registrado correctamente.`,
      });
      onCreated?.(cliente.id);
      handleOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el cliente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
        </DialogHeader>

        <FamilyMemberPersonalForm
          value={form}
          onChange={setForm}
          title="Información personal"
          showApplicantToggle={false}
        />

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Crear cliente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
