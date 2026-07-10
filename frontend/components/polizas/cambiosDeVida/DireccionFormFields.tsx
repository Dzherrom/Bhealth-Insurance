'use client';

import React, { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useZipCountyLookup } from '@/hooks/useZipCountyLookup';
import type { DireccionFormData } from './constants';

interface DireccionFormFieldsProps {
  value: DireccionFormData;
  onChange: (value: DireccionFormData) => void;
}

export function DireccionFormFields({ value, onChange }: DireccionFormFieldsProps) {
  const { counties, loading, resolveZip, setCounties } = useZipCountyLookup();
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    const zip = value.zip_code?.trim() || '';
    if (zip.length < 5) return;
    resolveZip(zip, value.condado).then((result) => {
      if (!result) return;
      const current = valueRef.current;
      onChange({
        ...current,
        ciudad: result.ciudad || current.ciudad,
        estado: result.estado || current.estado,
        condado: current.condado || result.condado,
      });
    });
    // Solo al montar / cargar dirección existente
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (field: keyof DireccionFormData, fieldValue: string) => {
    onChange({ ...valueRef.current, [field]: fieldValue });
  };

  const handleZipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const zip = e.target.value;
    const next = { ...valueRef.current, zip_code: zip };
    onChange(next);
    setCounties([]);

    if (zip.length < 5) return;

    const result = await resolveZip(zip, next.condado);
    if (!result) return;

    onChange({
      ...valueRef.current,
      zip_code: zip,
      ciudad: result.ciudad || valueRef.current.ciudad,
      estado: result.estado || valueRef.current.estado,
      condado: result.condado || valueRef.current.condado,
    });
  };

  const inputClass = 'h-9 dark:bg-slate-800 dark:border-slate-700';
  const zipLocked = value.zip_code.length === 5;

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
              readOnly={zipLocked}
              className={`${inputClass} ${zipLocked ? 'bg-slate-100 dark:bg-slate-700' : ''}`}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Estado *</Label>
            <Input
              value={value.estado}
              onChange={(e) => update('estado', e.target.value)}
              readOnly={zipLocked}
              className={`${inputClass} ${zipLocked ? 'bg-slate-100 dark:bg-slate-700' : ''}`}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Condado * {loading ? '(buscando...)' : ''}</Label>
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
