'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_BASE_URL, getCurrentToken } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { DireccionFormData } from './constants';

interface DireccionFormFieldsProps {
  value: DireccionFormData;
  onChange: (value: DireccionFormData) => void;
}

export function DireccionFormFields({ value, onChange }: DireccionFormFieldsProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [counties, setCounties] = useState<string[]>([]);

  const update = (field: keyof DireccionFormData, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const handleZipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const zip = e.target.value;
    update('zip_code', zip);
    setCounties([]);

    if (zip.length < 5) return;

    try {
      const token = accessToken || getCurrentToken();
      const res = await fetch(`${API_BASE_URL}/utils/zipcode/${zip}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      onChange({
        ...value,
        zip_code: zip,
        ciudad: data.city || value.ciudad,
        estado: data.state || value.estado,
        condado: value.condado,
      });
      if (Array.isArray(data.counties)) setCounties(data.counties);
    } catch (err) {
      console.error('ZIP lookup error', err);
    }
  };

  const inputClass = 'h-9 dark:bg-slate-800 dark:border-slate-700';

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/40 space-y-3">
      <h4 className="text-sm font-semibold text-slate-800 dark:text-white">Nueva dirección</h4>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Línea de dirección 1 *</Label>
          <Input value={value.linea1} onChange={(e) => update('linea1', e.target.value)} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Línea de dirección 2 (opcional)</Label>
          <Input value={value.linea2} onChange={(e) => update('linea2', e.target.value)} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Código postal *</Label>
            <Input value={value.zip_code} onChange={handleZipChange} placeholder="ZIP" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Ciudad *</Label>
            <Input
              value={value.ciudad}
              onChange={(e) => update('ciudad', e.target.value)}
              readOnly={value.zip_code.length === 5}
              className={`${inputClass} ${value.zip_code.length === 5 ? 'bg-slate-100 dark:bg-slate-700' : ''}`}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Estado *</Label>
            <Input
              value={value.estado}
              onChange={(e) => update('estado', e.target.value)}
              readOnly={value.zip_code.length === 5}
              className={`${inputClass} ${value.zip_code.length === 5 ? 'bg-slate-100 dark:bg-slate-700' : ''}`}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Condado *</Label>
            <select
              value={value.condado}
              onChange={(e) => update('condado', e.target.value)}
              disabled={!counties.length}
              className="flex h-9 w-full rounded-md border border-input bg-white dark:bg-slate-800 px-3 py-1 text-sm disabled:opacity-50"
            >
              <option value="">Seleccione condado...</option>
              {counties.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
