'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { infoPagoApi } from '@/lib/api';
import { parseDateForInput } from './polizaUtils';

interface EditInfoPagoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  polizaId: number;
  infoPago?: {
    id?: number;
    pago_recurrente?: boolean;
    fecha_primer_pago?: string | null;
    dia_pago_preferido?: number | null;
    estado_pago?: string;
  } | null;
  onSaved: () => void;
}

export function EditInfoPagoModal({ open, onOpenChange, polizaId, infoPago, onSaved }: EditInfoPagoModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    pago_recurrente: false,
    fecha_primer_pago: '',
    dia_pago_preferido: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        pago_recurrente: Boolean(infoPago?.pago_recurrente),
        fecha_primer_pago: parseDateForInput(infoPago?.fecha_primer_pago),
        dia_pago_preferido: infoPago?.dia_pago_preferido ? String(infoPago.dia_pago_preferido) : '',
      });
    }
  }, [open, infoPago]);

  const handleSave = async () => {
    if (!form.fecha_primer_pago) {
      toast({
        title: 'Campo obligatorio',
        description: 'Indica la fecha en la que deberían realizarse los pagos.',
        variant: 'destructive',
      });
      return;
    }

    const dia = form.dia_pago_preferido ? Number(form.dia_pago_preferido) : null;
    if (dia !== null && (dia < 1 || dia > 31)) {
      toast({
        title: 'Día inválido',
        description: 'El día de pago preferido debe estar entre 1 y 31.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        poliza: polizaId,
        pago_recurrente: form.pago_recurrente,
        fecha_primer_pago: form.fecha_primer_pago,
        dia_pago_preferido: dia,
      };

      let existingId = infoPago?.id;
      if (!existingId) {
        const existing = await infoPagoApi.getByPoliza(polizaId);
        existingId = existing?.id;
      }

      if (existingId) {
        await infoPagoApi.patch(existingId, payload);
      } else {
        await infoPagoApi.create(payload);
      }

      toast({ title: 'Éxito', description: 'Información de pago actualizada.' });
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'No se pudo guardar la información de pago.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{infoPago?.id ? 'Editar información de pago' : 'Agregar información de pago'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.pago_recurrente}
              onChange={(e) => setForm((prev) => ({ ...prev, pago_recurrente: e.target.checked }))}
            />
            Pago recurrente
          </label>

          <div className="space-y-1.5">
            <Label>Fecha del primer pago *</Label>
            <Input
              type="date"
              value={form.fecha_primer_pago}
              onChange={(e) => setForm((prev) => ({ ...prev, fecha_primer_pago: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Fecha en la que se supone que los pagos deberían comenzar a realizarse.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Día de pago preferido (1-31)</Label>
            <Input
              type="number"
              min={1}
              max={31}
              value={form.dia_pago_preferido}
              onChange={(e) => setForm((prev) => ({ ...prev, dia_pago_preferido: e.target.value }))}
              placeholder="Ej. 15"
            />
            <p className="text-xs text-muted-foreground">
              Día del mes en que se espera el pago recurrente.
            </p>
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
