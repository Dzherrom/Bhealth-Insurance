'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { DependienteFormData } from './constants';

interface DependienteFormFieldsProps {
  value: DependienteFormData;
  onChange: (value: DependienteFormData) => void;
}

export function DependienteFormFields({ value, onChange }: DependienteFormFieldsProps) {
  const update = (field: keyof DependienteFormData, fieldValue: string | boolean) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const inputClass = 'h-9 dark:bg-slate-800 dark:border-slate-700';

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/40 space-y-3">
      <h4 className="text-sm font-semibold text-slate-800 dark:text-white">Datos del nuevo dependiente</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Primer nombre *</Label>
          <Input value={value.primerNombre} onChange={(e) => update('primerNombre', e.target.value)} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Segundo nombre</Label>
          <Input value={value.segundoNombre} onChange={(e) => update('segundoNombre', e.target.value)} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Apellido paterno *</Label>
          <Input value={value.apellidoPaterno} onChange={(e) => update('apellidoPaterno', e.target.value)} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Apellido materno</Label>
          <Input value={value.apellidoMaterno} onChange={(e) => update('apellidoMaterno', e.target.value)} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Fecha de nacimiento *</Label>
          <Input type="date" value={value.fechaNacimiento} onChange={(e) => update('fechaNacimiento', e.target.value)} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Sexo *</Label>
          <select
            value={value.sexo}
            onChange={(e) => update('sexo', e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-white dark:bg-slate-800 px-3 py-1 text-sm"
          >
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Teléfono</Label>
          <Input value={value.telefono} onChange={(e) => update('telefono', e.target.value)} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Correo electrónico</Label>
          <Input type="email" value={value.email} onChange={(e) => update('email', e.target.value)} className={inputClass} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs">Condición médica</Label>
          <Textarea value={value.condicionMedica} onChange={(e) => update('condicionMedica', e.target.value)} rows={2} />
        </div>
        <label className="flex items-center gap-2 text-xs sm:col-span-2">
          <input type="checkbox" checked={value.usaTabaco} onChange={(e) => update('usaTabaco', e.target.checked)} />
          Usa tabaco
        </label>
      </div>
    </div>
  );
}
