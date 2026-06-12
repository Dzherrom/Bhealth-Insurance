'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface FamilyMemberFormData {
  primerNombre: string;
  segundoNombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  sexo: string;
  telefono: string;
  email: string;
  usaTabaco: boolean;
  peso: string;
  estatura: string;
  condicionMedica: string;
}

export const emptyFamilyMemberForm = (sexo = 'Masculino'): FamilyMemberFormData => ({
  primerNombre: '',
  segundoNombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  fechaNacimiento: '',
  sexo,
  telefono: '',
  email: '',
  usaTabaco: false,
  peso: '',
  estatura: '',
  condicionMedica: '',
});

interface FamilyMemberPersonalFormProps {
  value: FamilyMemberFormData;
  onChange: (value: FamilyMemberFormData) => void;
  title?: string;
}

export function FamilyMemberPersonalForm({ value, onChange, title }: FamilyMemberPersonalFormProps) {
  const update = (field: keyof FamilyMemberFormData, fieldValue: string | boolean) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const inputClass = 'h-10 dark:bg-slate-800 dark:border-slate-700';

  return (
    <div className="space-y-4">
      {title && (
        <h4 className="text-sm font-semibold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
          {title}
        </h4>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Primer nombre *</Label>
          <Input value={value.primerNombre} onChange={(e) => update('primerNombre', e.target.value)} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <Label>Segundo nombre</Label>
          <Input value={value.segundoNombre} onChange={(e) => update('segundoNombre', e.target.value)} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <Label>Apellido paterno *</Label>
          <Input value={value.apellidoPaterno} onChange={(e) => update('apellidoPaterno', e.target.value)} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <Label>Apellido materno</Label>
          <Input value={value.apellidoMaterno} onChange={(e) => update('apellidoMaterno', e.target.value)} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <Label>Fecha de nacimiento *</Label>
          <Input type="date" value={value.fechaNacimiento} onChange={(e) => update('fechaNacimiento', e.target.value)} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <Label>Sexo *</Label>
          <select
            value={value.sexo}
            onChange={(e) => update('sexo', e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-slate-800 px-3 py-1 text-sm"
          >
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Teléfono</Label>
          <Input value={value.telefono} onChange={(e) => update('telefono', e.target.value)} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <Label>Correo electrónico</Label>
          <Input type="email" value={value.email} onChange={(e) => update('email', e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/40 space-y-4">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-white">Detalles clínicos y estatus</h4>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={value.usaTabaco} onChange={(e) => update('usaTabaco', e.target.checked)} />
          ¿Usa tabaco?
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Peso</Label>
            <Input value={value.peso} onChange={(e) => update('peso', e.target.value)} placeholder="Ej. 75 kg" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label>Estatura</Label>
            <Input value={value.estatura} onChange={(e) => update('estatura', e.target.value)} placeholder="Ej. 1.75 m" className={inputClass} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Condición médica</Label>
          <Textarea
            value={value.condicionMedica}
            onChange={(e) => update('condicionMedica', e.target.value)}
            rows={3}
            className="dark:bg-slate-800"
          />
        </div>
      </div>
    </div>
  );
}
