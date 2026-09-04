'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { clientLight } from '@/components/client/dashboard/constants';

export interface PaymentCardFormValues {
  tipo_tarjeta: string;
  numero: string;
  nombre_titular: string;
  cvv: string;
  fecha_vencimiento: string;
  es_predeterminado: boolean;
}

export interface PaymentCardFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<PaymentCardFormValues> & { id?: number };
  title?: string;
  submitLabel?: string;
  sensitiveOptional?: boolean;
  lightMode?: boolean;
  onSubmit: (values: PaymentCardFormValues) => Promise<void>;
}

const DEFAULT_VALUES: PaymentCardFormValues = {
  tipo_tarjeta: 'VISA',
  numero: '',
  nombre_titular: '',
  cvv: '',
  fecha_vencimiento: '',
  es_predeterminado: false,
};

const normalizeDigits = (value: string) => value.replace(/\D/g, '');

function isValidCardNumber(value: string): boolean {
  const digits = normalizeDigits(value);
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let doubleDigit = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }
  return sum % 10 === 0;
}

function isValidExpiry(value: string): boolean {
  const match = value.trim().match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
  if (!match) return false;
  const expiry = new Date(2000 + Number(match[2]), Number(match[1]), 0);
  const current = new Date();
  return expiry >= new Date(current.getFullYear(), current.getMonth() + 1, 0);
}

export function PaymentCardFormModal({
  open,
  onOpenChange,
  initial,
  title,
  submitLabel,
  sensitiveOptional = false,
  lightMode = false,
  onSubmit,
}: PaymentCardFormModalProps) {
  const [form, setForm] = useState<PaymentCardFormValues>(DEFAULT_VALUES);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isEdit = Boolean(initial?.id);

  useEffect(() => {
    if (!open) return;
    setForm({
      tipo_tarjeta: initial?.tipo_tarjeta || 'VISA',
      numero: initial?.numero || '',
      nombre_titular: initial?.nombre_titular || '',
      cvv: initial?.cvv || '',
      fecha_vencimiento: initial?.fecha_vencimiento || '',
      es_predeterminado: Boolean(initial?.es_predeterminado),
    });
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasMaskedSensitiveValue =
      isEdit && sensitiveOptional && (form.numero.includes('*') || form.cvv.includes('*'));
    if (!hasMaskedSensitiveValue && !isValidCardNumber(form.numero)) {
      setValidationError('El número de tarjeta debe tener entre 13 y 19 dígitos válidos.');
      return;
    }
    if (!hasMaskedSensitiveValue && !/^\d{3,4}$/.test(form.cvv)) {
      setValidationError('El CVV debe contener 3 o 4 dígitos.');
      return;
    }
    if (!isValidExpiry(form.fecha_vencimiento)) {
      setValidationError('La fecha debe tener formato MM/YY y no estar vencida.');
      return;
    }
    setValidationError(null);
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        numero: normalizeDigits(form.numero),
        cvv: normalizeDigits(form.cvv),
        fecha_vencimiento: form.fecha_vencimiento.trim(),
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const resolvedTitle = title || (isEdit ? 'Editar tarjeta de pago' : 'Agregar tarjeta de pago');
  const resolvedSubmit = submitLabel || (isEdit ? 'Guardar' : 'Agregar');
  const inputClass = lightMode ? clientLight.input : undefined;
  const labelClass = lightMode ? clientLight.label : undefined;
  const nativeSelectClass = lightMode
    ? clientLight.nativeSelect
    : 'flex h-10 w-full rounded-md border border-input bg-white dark:bg-slate-800 px-3 py-1 text-sm';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-h-[90vh] overflow-y-auto', lightMode && clientLight.dialog)}>
        <DialogHeader>
          <DialogTitle className={lightMode ? clientLight.dialogTitle : undefined}>{resolvedTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label className={labelClass}>Tipo de tarjeta</Label>
            <select
              className={nativeSelectClass}
              value={form.tipo_tarjeta}
              onChange={(e) => setForm((p) => ({ ...p, tipo_tarjeta: e.target.value }))}
            >
              <option value="DEBITO">Débito</option>
              <option value="CREDITO">Crédito</option>
              <option value="VISA">Visa</option>
              <option value="MASTERCARD">Mastercard</option>
              <option value="AMEX">American Express</option>
              <option value="DISCOVER">Discover</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label className={labelClass}>Nombre en la tarjeta</Label>
            <Input
              required
              value={form.nombre_titular}
              onChange={(e) => setForm((p) => ({ ...p, nombre_titular: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="grid gap-2">
            <Label className={labelClass}>Número de tarjeta</Label>
            <Input
              required={!sensitiveOptional || !isEdit}
              value={form.numero}
              maxLength={19}
              inputMode="numeric"
              onChange={(e) => setForm((p) => ({ ...p, numero: e.target.value.replace(/\D/g, '').slice(0, 19) }))}
              placeholder={sensitiveOptional && isEdit ? 'Opcional si no cambia' : undefined}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className={labelClass}>Fecha de vencimiento</Label>
              <Input
                required
                placeholder="MM/YY"
                value={form.fecha_vencimiento}
                maxLength={5}
                inputMode="numeric"
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, '').slice(0, 4);
                  setForm((p) => ({ ...p, fecha_vencimiento: value.length > 2 ? `${value.slice(0, 2)}/${value.slice(2)}` : value }));
                }}
                className={inputClass}
              />
            </div>
            <div className="grid gap-2">
              <Label className={labelClass}>CVV</Label>
              <Input
                required={!sensitiveOptional || !isEdit}
                value={form.cvv}
              maxLength={4}
              inputMode="numeric"
              onChange={(e) => setForm((p) => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                placeholder={sensitiveOptional && isEdit ? 'Opcional si no cambia' : undefined}
                className={inputClass}
              />
            </div>
          </div>
          {validationError && <p className="text-sm text-red-600">{validationError}</p>}
          <label className={cn('flex items-center gap-2 text-sm', lightMode && 'text-[#334155]')}>
            <input
              type="checkbox"
              checked={form.es_predeterminado}
              onChange={(e) => setForm((p) => ({ ...p, es_predeterminado: e.target.checked }))}
            />
            Marcar como predeterminada
          </label>
          <DialogFooter>
            <Button
              type="submit"
              disabled={saving}
              className={lightMode ? 'bg-emerald-600 hover:bg-emerald-700' : undefined}
            >
              {saving ? 'Guardando...' : resolvedSubmit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
