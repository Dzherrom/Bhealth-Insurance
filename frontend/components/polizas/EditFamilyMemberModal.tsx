'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import {
  FamilyMemberPersonalForm,
  emptyFamilyMemberForm,
  memberDetailsToFormData,
  formDataToClientUpdate,
  type FamilyMemberFormData,
} from './FamilyMemberPersonalForm';
import { getRelacionFamiliarLabel } from '@/lib/familyMemberOptions';
import { buildPolizaClientesPayload } from '@/lib/familyMemberUtils';

interface EditFamilyMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: any | null;
  poliza?: any;
  onSaved: () => void;
}

export function EditFamilyMemberModal({ open, onOpenChange, member, poliza, onSaved }: EditFamilyMemberModalProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<FamilyMemberFormData>(emptyFamilyMemberForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && member?.cliente_details) {
      setForm({
        ...memberDetailsToFormData(member.cliente_details),
        esAplicante: Boolean(member.es_solicitante_principal || member.es_aplicante),
      });
    }
  }, [open, member]);

  const handleSave = async () => {
    if (!member?.cliente) return;

    const isPrincipal = !!member.es_solicitante_principal;

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

    if (isPrincipal && (!form.telefono?.trim() || !form.email?.trim())) {
      toast({
        title: 'Campos obligatorios',
        description: 'El solicitante principal requiere teléfono y correo electrónico.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await api.clientes.patch(member.cliente, formDataToClientUpdate(form));

      if (poliza?.id) {
        const clientesInfo = poliza.clientes_info || [];
        const principal = clientesInfo.find((m: any) => m.es_solicitante_principal);
        const direccionId = principal?.direccion_residencia || poliza.direccion_fisica || null;
        const payload = buildPolizaClientesPayload(clientesInfo, {
          updateMemberId: member.id,
          es_aplicante: isPrincipal ? true : form.esAplicante,
          fallbackDireccionId: direccionId,
        });
        await api.polizas.patch(poliza.id, payload);
      }

      toast({ title: 'Éxito', description: 'Miembro actualizado correctamente.' });
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudo actualizar el miembro.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const memberName = member?.cliente_details
    ? `${member.cliente_details.primer_nombre} ${member.cliente_details.apellido_paterno}`
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Editar miembro{memberName ? `: ${memberName}` : ''}
            {member?.relacion && (
              <span className="block text-sm font-normal text-muted-foreground mt-1">
                {getRelacionFamiliarLabel(member.relacion)}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {member && (
          <FamilyMemberPersonalForm
            value={form}
            onChange={setForm}
            title="Información personal"
            requireContact={!!member.es_solicitante_principal}
            showApplicantToggle
            applicantToggleDisabled={!!member.es_solicitante_principal}
          />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !member}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
