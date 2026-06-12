'use client';

import React, { useMemo, useState } from 'react';
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
import { X } from 'lucide-react';
import { FamilyMemberPersonalForm, emptyFamilyMemberForm, type FamilyMemberFormData } from './FamilyMemberPersonalForm';

type MemberTipo = 'CONYUGE' | 'DEPENDIENTE' | '';

interface AddFamilyMemberCardProps {
  poliza: any;
  onClose: () => void;
  onSaved: () => void;
}

function buildClientPayload(form: FamilyMemberFormData, prefix: string) {
  const ssn = `TMP-${prefix}-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6)}`.slice(0, 20);
  return {
    primer_nombre: form.primerNombre,
    segundo_nombre: form.segundoNombre || '',
    apellido_paterno: form.apellidoPaterno,
    apellido_materno: form.apellidoMaterno || '',
    fecha_nacimiento: form.fechaNacimiento,
    genero: form.sexo,
    telefono: form.telefono?.trim() || null,
    email: form.email?.trim() || null,
    estado_civil: 'Desconocido',
    pais_nacimiento: 'Desconocido',
    estado_inmigracion: 'Desconocido',
    ingreso_anual: 0,
    usa_tabaco: form.usaTabaco,
    peso: form.peso || '',
    estatura: form.estatura || '',
    condicion_medica: form.condicionMedica || '',
    ssn,
  };
}

export function AddFamilyMemberCard({ poliza, onClose, onSaved }: AddFamilyMemberCardProps) {
  const { toast } = useToast();
  const [tipo, setTipo] = useState<MemberTipo>('');
  const [form, setForm] = useState<FamilyMemberFormData>(emptyFamilyMemberForm());
  const [saving, setSaving] = useState(false);

  const hasConyuge = useMemo(
    () => (poliza?.clientes_info || []).some((m: any) => String(m.relacion || '').toUpperCase().includes('CONYUG')),
    [poliza?.clientes_info]
  );

  const handleTipoChange = (value: MemberTipo) => {
    setTipo(value);
    setForm(emptyFamilyMemberForm(value === 'CONYUGE' ? 'Femenino' : 'Masculino'));
  };

  const handleSave = async () => {
    if (!tipo) {
      toast({ title: 'Selecciona el tipo', description: 'Indica si es cónyuge o dependiente.', variant: 'destructive' });
      return;
    }
    if (!form.primerNombre.trim() || !form.apellidoPaterno.trim() || !form.fechaNacimiento) {
      toast({ title: 'Campos obligatorios', description: 'Completa nombre, apellido y fecha de nacimiento.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const principal = (poliza.clientes_info || []).find((m: any) => m.es_solicitante_principal);
      const direccionId = principal?.direccion_residencia || poliza.direccion_fisica || null;

      const prefix = tipo === 'CONYUGE' ? 'conyuge' : 'dependiente';
      const cliente = await api.clientes.create(buildClientPayload(form, prefix) as any);

      const existingClientesData = (poliza.clientes_info || []).map((m: any) => ({
        cliente: m.cliente,
        es_solicitante_principal: m.es_solicitante_principal,
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
            relacion: tipo,
            direccion_residencia: direccionId,
          },
        ],
      });

      toast({
        title: 'Miembro agregado',
        description: tipo === 'CONYUGE' ? 'Cónyuge registrado en la póliza.' : 'Dependiente registrado en la póliza.',
      });
      onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudo agregar el miembro de la familia.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-primary/30 bg-primary/5 dark:bg-primary/10 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Agregar miembro de la familia</h3>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2 max-w-xs">
          <Label>Tipo de miembro *</Label>
          <Select value={tipo} onValueChange={(v) => handleTipoChange(v as MemberTipo)}>
            <SelectTrigger className="bg-white dark:bg-slate-800">
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CONYUGE" disabled={hasConyuge}>
                Cónyuge{hasConyuge ? ' (ya registrado)' : ''}
              </SelectItem>
              <SelectItem value="DEPENDIENTE">Dependiente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {tipo && (
          <FamilyMemberPersonalForm
            value={form}
            onChange={setForm}
            title={tipo === 'CONYUGE' ? 'Información del cónyuge' : 'Información del dependiente'}
          />
        )}

        {tipo && (
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar miembro'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
