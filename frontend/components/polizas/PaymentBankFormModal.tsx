'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UsBankCombobox } from '@/components/polizas/UsBankCombobox';
import { cn } from '@/lib/utils';
import { clientLight } from '@/components/client/dashboard/constants';

export interface PaymentBankFormValues {
  nombre_banco: string;
  numero_cuenta: string;
  aba_routing: string;
  titular_cuenta: string;
  es_predeterminado: boolean;
}

export interface PaymentBankFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<PaymentBankFormValues> & { id?: number };
  title?: string;
  submitLabel?: string;
  sensitiveOptional?: boolean;
  lightMode?: boolean;
  onSubmit: (values: PaymentBankFormValues) => Promise<void>;
}

const DEFAULT_VALUES: PaymentBankFormValues = {
  nombre_banco: '',
  numero_cuenta: '',
  aba_routing: '',
  titular_cuenta: '',
  es_predeterminado: false,
};

const normalizeDigits = (value: string) => value.replace(/\D/g, '');

export function PaymentBankFormModal({
  open,
  onOpenChange,
  initial,
  title,
  submitLabel,
  sensitiveOptional = false,
  lightMode = false,
  onSubmit,
}: PaymentBankFormModalProps) {
  const [form, setForm] = useState<PaymentBankFormValues>(DEFAULT_VALUES);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isEdit = Boolean(initial?.id);

  useEffect(() => {
    if (!open) return;
    setForm({
      nombre_banco: initial?.nombre_banco || '',
      numero_cuenta: initial?.numero_cuenta || '',
      aba_routing: initial?.aba_routing || '',
      titular_cuenta: initial?.titular_cuenta || '',
      es_predeterminado: Boolean(initial?.es_predeterminado),
    });
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasMaskedSensitiveValue =
      isEdit && sensitiveOptional && (form.numero_cuenta.includes('*') || form.aba_routing.includes('*'));
    if (!hasMaskedSensitiveValue) {
      const accountDigits = normalizeDigits(form.numero_cuenta);
      const routingDigits = normalizeDigits(form.aba_routing);
      if (!/^\d{4,17}$/.test(accountDigits)) {
        setValidationError('El número de cuenta debe contener entre 4 y 17 dígitos.');
        return;
      }
      if (!/^\d{9}$/.test(routingDigits)) {
        setValidationError('El número ABA / routing debe contener exactamente 9 dígitos.');
        return;
      }
    }
    setValidationError(null);
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        numero_cuenta: normalizeDigits(form.numero_cuenta),
        aba_routing: normalizeDigits(form.aba_routing),
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const resolvedTitle = title || (isEdit ? 'Editar cuenta bancaria' : 'Agregar cuenta bancaria');
  const resolvedSubmit = submitLabel || (isEdit ? 'Guardar' : 'Agregar');
  const inputClass = lightMode ? clientLight.input : undefined;
  const labelClass = lightMode ? clientLight.label : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-h-[90vh] overflow-y-auto', lightMode && clientLight.dialog)}>
        <DialogHeader>
          <DialogTitle className={lightMode ? clientLight.dialogTitle : undefined}>{resolvedTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label className={labelClass}>Nombre del banco</Label>
            <UsBankCombobox
              value={form.nombre_banco}
              onChange={(nombre_banco) => setForm((p) => ({ ...p, nombre_banco }))}
              required
              triggerClassName={lightMode ? clientLight.comboboxTrigger : undefined}
              contentClassName={lightMode ? clientLight.comboboxContent : undefined}
            />
          </div>
          <div className="grid gap-2">
            <Label className={labelClass}>Número de cuenta</Label>
            <Input
              required={!sensitiveOptional || !isEdit}
              value={form.numero_cuenta}
              maxLength={17}
              inputMode="numeric"
              onChange={(e) => setForm((p) => ({ ...p, numero_cuenta: e.target.value.replace(/\D/g, '').slice(0, 17) }))}
              placeholder={sensitiveOptional && isEdit ? 'Opcional si no cambia' : undefined}
              className={inputClass}
            />
          </div>
          <div className="grid gap-2">
            <Label className={labelClass}>ABA / Enrutamiento</Label>
            <Input
              required={!sensitiveOptional || !isEdit}
              value={form.aba_routing}
              maxLength={9}
              inputMode="numeric"
              onChange={(e) => setForm((p) => ({ ...p, aba_routing: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
              placeholder={sensitiveOptional && isEdit ? 'Opcional si no cambia' : undefined}
              className={inputClass}
            />
          </div>
          {validationError && <p className="text-sm text-red-600">{validationError}</p>}
          <div className="grid gap-2">
            <Label className={labelClass}>Titular de la cuenta</Label>
            <Input
              required
              value={form.titular_cuenta}
              onChange={(e) => setForm((p) => ({ ...p, titular_cuenta: e.target.value }))}
              className={inputClass}
            />
          </div>
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
