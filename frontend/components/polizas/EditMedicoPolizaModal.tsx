'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { medicosPolizaApi, type MedicoPoliza } from '@/lib/api';

interface EditMedicoPolizaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  polizaId: number;
  medico?: MedicoPoliza | null;
  onSaved: () => void;
}

export function EditMedicoPolizaModal({
  open,
  onOpenChange,
  polizaId,
  medico,
  onSaved,
}: EditMedicoPolizaModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [nombre, setNombre] = useState('');
  const [especializacion, setEspecializacion] = useState('');
  const [hospital, setHospital] = useState('');
  const [esPrincipal, setEsPrincipal] = useState(false);
  const isEditing = Boolean(medico?.id);

  useEffect(() => {
    if (open) {
      setNombre(medico?.nombre ?? '');
      setEspecializacion(medico?.especializacion ?? '');
      setHospital(medico?.hospital ?? '');
      setEsPrincipal(Boolean(medico?.es_principal));
    }
  }, [open, medico]);

  const handleSave = async () => {
    if (!nombre.trim()) {
      toast({ title: 'Campo requerido', description: 'Indica el nombre o información del médico.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        poliza: polizaId,
        nombre: nombre.trim(),
        especializacion: especializacion.trim() || null,
        hospital: hospital.trim() || null,
        es_principal: esPrincipal,
      };

      if (isEditing && medico?.id) {
        await medicosPolizaApi.update(medico.id, payload);
        toast({ title: 'Éxito', description: 'Médico actualizado correctamente.' });
      } else {
        await medicosPolizaApi.create(payload);
        toast({ title: 'Éxito', description: 'Médico agregado correctamente.' });
      }

      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'No se pudo guardar el médico.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!medico?.id || !window.confirm('¿Eliminar este médico de la póliza?')) return;

    setDeleting(true);
    try {
      await medicosPolizaApi.delete(medico.id);
      toast({ title: 'Médico eliminado' });
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudo eliminar el médico.', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar médico' : 'Agregar médico'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medico_nombre">Nombre / información</Label>
            <Textarea
              id="medico_nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              rows={3}
              placeholder="Nombre, teléfono u otra información del médico..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="medico_especializacion">Especialización (opcional)</Label>
              <Input
                id="medico_especializacion"
                value={especializacion}
                onChange={(e) => setEspecializacion(e.target.value)}
                placeholder="Ej. Cardiología"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medico_hospital">Hospital (opcional)</Label>
              <Input
                id="medico_hospital"
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                placeholder="Ej. Mount Sinai Hospital"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={esPrincipal}
              onChange={(e) => setEsPrincipal(e.target.checked)}
            />
            Marcar como médico principal
          </label>
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
            {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Agregar médico'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
