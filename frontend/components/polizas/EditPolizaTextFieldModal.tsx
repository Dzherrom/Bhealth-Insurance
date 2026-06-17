'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { polizasApi } from '@/lib/api';

export type PolizaTextFieldKey =
  | 'notas_comentarios'
  | 'info_medico_principal'
  | 'medicamentos_necesarios';

interface EditPolizaTextFieldModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  polizaId: number;
  title: string;
  label: string;
  field: PolizaTextFieldKey;
  value?: string | null;
  onSaved: () => void;
}

export function EditPolizaTextFieldModal({
  open,
  onOpenChange,
  polizaId,
  title,
  label,
  field,
  value,
  onSaved,
}: EditPolizaTextFieldModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    if (open) {
      setText(value ?? '');
    }
  }, [open, value]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await polizasApi.patch(polizaId, { [field]: text.trim() || null });
      toast({ title: 'Éxito', description: 'Información actualizada correctamente.' });
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'No se pudo guardar la información.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor={field}>{label}</Label>
          <Textarea
            id={field}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="Escribe aquí..."
          />
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
