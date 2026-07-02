'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ingresosEmpleadorApi } from '@/lib/api';
import { monthlyFromAnnual } from '@/lib/familyMemberUtils';

export interface IngresoEmpleadorForm {
  id?: number;
  nombre_empleador: string;
  telefono_empleador: string;
  cargo_ocupacion: string;
  ingreso_anual: string;
  ingreso_mensual: string;
}

const emptyIngreso = (): IngresoEmpleadorForm => ({
  nombre_empleador: '',
  telefono_empleador: '',
  cargo_ocupacion: '',
  ingreso_anual: '',
  ingreso_mensual: '',
});

interface FamilyMemberIngresoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId: number;
  initial?: IngresoEmpleadorForm | null;
  onSaved: () => void;
}

export function FamilyMemberIngresoModal({
  open,
  onOpenChange,
  clienteId,
  initial,
  onSaved,
}: FamilyMemberIngresoModalProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<IngresoEmpleadorForm>(emptyIngreso());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initial ? { ...initial } : emptyIngreso());
  }, [open, initial]);

  const update = (field: keyof IngresoEmpleadorForm, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'ingreso_anual' && value) {
        const annual = parseFloat(value);
        if (!Number.isNaN(annual)) {
          next.ingreso_mensual = monthlyFromAnnual(annual).toFixed(2);
        }
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.cargo_ocupacion.trim() && !form.nombre_empleador.trim()) {
      toast({ title: 'Indica empleador o cargo', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        cliente: clienteId,
        nombre_empleador: form.nombre_empleador,
        telefono_empleador: form.telefono_empleador,
        cargo_ocupacion: form.cargo_ocupacion,
        ingreso_anual: parseFloat(form.ingreso_anual || '0') || 0,
        ingreso_mensual: parseFloat(form.ingreso_mensual || '0') || 0,
      };
      if (initial?.id) {
        await ingresosEmpleadorApi.patch(initial.id, payload);
      } else {
        await ingresosEmpleadorApi.create(payload);
      }
      toast({ title: initial?.id ? 'Ingreso actualizado' : 'Ingreso agregado' });
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error al guardar ingreso', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial?.id ? 'Editar ingreso' : 'Agregar ingreso'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nombre del empleador</Label>
            <Input value={form.nombre_empleador} onChange={(e) => update('nombre_empleador', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Teléfono del empleador</Label>
            <Input value={form.telefono_empleador} onChange={(e) => update('telefono_empleador', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Cargo / Ocupación</Label>
            <Input value={form.cargo_ocupacion} onChange={(e) => update('cargo_ocupacion', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Ingreso anual</Label>
              <Input type="number" min="0" value={form.ingreso_anual} onChange={(e) => update('ingreso_anual', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Ingreso mensual</Label>
              <Input type="number" min="0" value={form.ingreso_mensual} onChange={(e) => update('ingreso_mensual', e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
