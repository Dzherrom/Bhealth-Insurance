'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { medicamentosApi, type MedicamentoPoliza } from '@/lib/api';

interface EditMedicamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  polizaId: number;
  medicamento?: MedicamentoPoliza | null;
  onSaved: () => void;
}

export function EditMedicamentoModal({
  open,
  onOpenChange,
  polizaId,
  medicamento,
  onSaved,
}: EditMedicamentoModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [nombre, setNombre] = useState('');
  const [dosis, setDosis] = useState('');
  const isEditing = Boolean(medicamento?.id);

  useEffect(() => {
    if (open) {
      setNombre(medicamento?.nombre ?? '');
      setDosis(medicamento?.dosis ?? '');
    }
  }, [open, medicamento]);

  const handleSave = async () => {
    if (!nombre.trim()) {
      toast({ title: 'Campo requerido', description: 'Indica el nombre del medicamento.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        poliza: polizaId,
        nombre: nombre.trim(),
        dosis: dosis.trim() || null,
        activo: true,
      };

      if (isEditing && medicamento?.id) {
        await medicamentosApi.update(medicamento.id, payload);
        toast({ title: 'Éxito', description: 'Medicamento actualizado correctamente.' });
      } else {
        await medicamentosApi.create(payload);
        toast({ title: 'Éxito', description: 'Medicamento agregado correctamente.' });
      }

      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'No se pudo guardar el medicamento.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!medicamento?.id || !window.confirm('¿Eliminar este medicamento de la póliza?')) return;

    setDeleting(true);
    try {
      await medicamentosApi.delete(medicamento.id);
      toast({ title: 'Medicamento eliminado' });
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudo eliminar el medicamento.', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar medicamento' : 'Agregar medicamento'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medicamento_nombre">Medicamento</Label>
            <Textarea
              id="medicamento_nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              rows={3}
              placeholder="Nombre del medicamento cubierto por el seguro..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicamento_dosis">Dosis (opcional)</Label>
            <Input
              id="medicamento_dosis"
              value={dosis}
              onChange={(e) => setDosis(e.target.value)}
              placeholder="Ej. 10 mg cada 12 horas"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isEditing ? (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={saving || deleting}
              className="sm:mr-auto"
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving || deleting}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || deleting}>
            {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Agregar medicamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
