'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import {
  RELACIONES_FAMILIARES,
  getRelacionFamiliarLabel,
  isConyugeRelacion,
  type RelacionFamiliarValue,
} from '@/lib/familyMemberOptions';
import {
  FamilyMemberPersonalForm,
  emptyFamilyMemberForm,
  memberDetailsToFormData,
  formDataToClientUpdate,
  type FamilyMemberFormData,
} from './FamilyMemberPersonalForm';

interface FamilyMemberFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  poliza: any;
  member?: any | null;
  onSaved: () => void;
}

function buildCreatePayload(form: FamilyMemberFormData, prefix: string) {
  const ssn = `TMP-${prefix}-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6)}`.slice(0, 20);
  return {
    ...formDataToClientUpdate(form),
    estado_inmigracion: 'Desconocido',
    ingreso_anual: 0,
    ssn,
  };
}

export function FamilyMemberFormModal({
  open,
  onOpenChange,
  mode,
  poliza,
  member,
  onSaved,
}: FamilyMemberFormModalProps) {
  const { toast } = useToast();
  const [relacion, setRelacion] = useState<RelacionFamiliarValue | ''>('');
  const [form, setForm] = useState<FamilyMemberFormData>(emptyFamilyMemberForm());
  const [saving, setSaving] = useState(false);

  const clientesInfo = poliza?.clientes_info || [];

  const hasConyuge = useMemo(
    () =>
      clientesInfo.some(
        (m: any) => isConyugeRelacion(m.relacion) && (mode === 'create' || m.id !== member?.id),
      ),
    [clientesInfo, mode, member?.id],
  );

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && member?.cliente_details) {
      setRelacion((member.relacion as RelacionFamiliarValue) || '');
      const data = memberDetailsToFormData(member.cliente_details);
      setForm({
        ...data,
        esAplicante: Boolean(member.es_aplicante ?? member.es_solicitante_principal),
      });
      return;
    }
    setRelacion('');
    setForm(emptyFamilyMemberForm());
  }, [open, mode, member]);

  const handleSave = async () => {
    if (mode === 'create' && !relacion) {
      toast({ title: 'Selecciona la relación', variant: 'destructive' });
      return;
    }
    if (!form.primerNombre.trim() || !form.apellidoPaterno.trim() || !form.fechaNacimiento) {
      toast({ title: 'Completa nombre, apellido y fecha de nacimiento.', variant: 'destructive' });
      return;
    }
    if (!form.paisNacimiento || !form.estadoCivil) {
      toast({ title: 'Selecciona país de nacimiento y estado civil.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      if (mode === 'edit' && member?.cliente) {
        await api.clientes.patch(member.cliente, formDataToClientUpdate(form));
        const principal = clientesInfo.find((m: any) => m.es_solicitante_principal);
        const direccionId = principal?.direccion_residencia || poliza.direccion_fisica || null;
        const existingClientesData = clientesInfo.map((m: any) => ({
          cliente: m.cliente,
          es_solicitante_principal: m.es_solicitante_principal,
          es_aplicante: m.id === member.id ? form.esAplicante : Boolean(m.es_aplicante),
          relacion: m.relacion,
          direccion_residencia: m.direccion_residencia || direccionId,
          direccion_postal: m.direccion_postal || null,
        }));
        await api.polizas.patch(poliza.id, { clientes_data: existingClientesData });
        toast({ title: 'Miembro actualizado' });
      } else {
        const principal = clientesInfo.find((m: any) => m.es_solicitante_principal);
        const direccionId = principal?.direccion_residencia || poliza.direccion_fisica || null;
        const prefix = (relacion || 'miembro').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 20);
        const cliente = await api.clientes.create(buildCreatePayload(form, prefix) as any);
        const existingClientesData = clientesInfo.map((m: any) => ({
          cliente: m.cliente,
          es_solicitante_principal: m.es_solicitante_principal,
          es_aplicante: Boolean(m.es_aplicante),
          relacion: m.relacion,
          direccion_residencia: m.direccion_residencia || direccionId,
          direccion_postal: m.direccion_postal || null,
        }));
        await api.polizas.patch(poliza.id, {
          clientes_data: [
            ...existingClientesData,
            {
              cliente: cliente.id,
              es_solicitante_principal: false,
              es_aplicante: form.esAplicante,
              relacion,
              direccion_residencia: direccionId,
            },
          ],
        });
        toast({ title: 'Miembro agregado', description: getRelacionFamiliarLabel(relacion) });
      }
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudo guardar el miembro.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto bg-slate-900 text-white border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {mode === 'edit' ? 'Información personal' : 'Agregar miembro de la familia'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {mode === 'create' ? (
            <div className="space-y-2 max-w-md">
              <Label>
                Relación con el titular <span className="text-red-400">(obligatorio)</span>
              </Label>
              <Select value={relacion} onValueChange={(v) => setRelacion(v as RelacionFamiliarValue)}>
                <SelectTrigger className="bg-slate-800 border-slate-600">
                  <SelectValue placeholder="Seleccionar relación" />
                </SelectTrigger>
                <SelectContent>
                  {RELACIONES_FAMILIARES.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      disabled={option.value === 'CONYUGE' && hasConyuge}
                    >
                      {option.label}
                      {option.value === 'CONYUGE' && hasConyuge ? ' (ya registrado)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="text-sm text-slate-300">
              Relación: <span className="font-medium text-white">{getRelacionFamiliarLabel(member?.relacion)}</span>
            </p>
          )}

          {(mode === 'edit' || relacion) && (
            <FamilyMemberPersonalForm
              value={form}
              onChange={setForm}
              requireContact={Boolean(member?.es_solicitante_principal)}
              showApplicantToggle={!member?.es_solicitante_principal}
            />
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving} className="text-slate-300">
            Cerrar
          </Button>
          <Button onClick={handleSave} disabled={saving || (mode === 'create' && !relacion)} className="bg-violet-600 hover:bg-violet-700">
            {saving ? 'Guardando...' : 'Enviar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
