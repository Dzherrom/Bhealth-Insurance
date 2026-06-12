'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';
import api, { authApi } from '@/lib/api';

const METAL_OPTIONS = [
  { value: 'BRONCE', label: 'Bronce' },
  { value: 'PLATA', label: 'Plata' },
  { value: 'ORO', label: 'Oro' },
  { value: 'PLATINO', label: 'Platino' },
];

const TIPO_VENTA_OPTIONS = [
  { value: 'NUEVA', label: 'Venta nueva' },
  { value: 'RENOVACION', label: 'Renovación' },
];

interface EditPlanDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poliza: any;
  onSaved?: () => void;
}

function toDateInputValue(value?: string | null) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parts = value.split(/[\/\-]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  }
  return '';
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-1.5 mb-3">
      {children}
    </h3>
  );
}

function FieldGroup({
  label,
  required,
  actionLabel,
  onAction,
  children,
}: {
  label: string;
  required?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className={`text-xs font-medium ${required ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'}`}>
          {label}{required ? ' (obligatorio)' : ''}
        </Label>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="text-xs font-medium text-primary hover:underline whitespace-nowrap"
          >
            {actionLabel}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export function EditPlanDetailsModal({ open, onOpenChange, poliza, onSaved }: EditPlanDetailsModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [tiposProducto, setTiposProducto] = useState<any[]>([]);
  const [aseguradoras, setAseguradoras] = useState<any[]>([]);
  const [agenteCredentials, setAgenteCredentials] = useState<{ npn?: string; ffm?: string } | null>(null);

  const [form, setForm] = useState({
    tipo_producto: '',
    aseguradora: '',
    nombre_plan: '',
    fecha_efectiva: '',
    fecha_cancelacion: '',
    metal: '',
    id_mercado: '',
    id_miembro: '',
    id_plan_cms: '',
    costo_poliza: '',
    subsidio: '',
    prima_mensual: '',
    tipo_inscripcion: '',
    ffm_mercado: '',
    npn_mercado: '',
    fecha_inscripcion_especial: '',
    razon_inscripcion_especial: '',
  });

  const resolveAgentCredentials = async (): Promise<{ npn?: string; ffm?: string } | null> => {
    try {
      const profileData = await authApi.getProfile() as any;
      const profile = profileData?.profile;
      const agenteId = profile?.agente;

      let npn: string | undefined = profile?.agente_npn || undefined;
      let ffm: string | undefined = profile?.agente_ffm || undefined;

      if ((!npn || !ffm) && agenteId) {
        const agente = await api.agentes.get(agenteId) as any;
        npn = npn || agente.npn || undefined;
        ffm = ffm || agente.ffm || undefined;
      }

      if (!npn && !ffm) {
        setAgenteCredentials(null);
        return null;
      }

      const creds = { npn, ffm };
      setAgenteCredentials(creds);
      return creds;
    } catch (error) {
      console.error('Error cargando credenciales del agente:', error);
      setAgenteCredentials(null);
      return null;
    }
  };

  useEffect(() => {
    if (!open || !poliza) return;

    const aseguradoraId = poliza.aseguradora ?? '';

    setForm({
      tipo_producto: poliza.tipo_producto ? String(poliza.tipo_producto) : '',
      aseguradora: aseguradoraId ? String(aseguradoraId) : '',
      nombre_plan: poliza.nombre_plan || poliza.plan_nombre || '',
      fecha_efectiva: toDateInputValue(poliza.fecha_efectiva),
      fecha_cancelacion: toDateInputValue(poliza.fecha_cancelacion),
      metal: poliza.metal || '',
      id_mercado: poliza.id_mercado || '',
      id_miembro: poliza.id_miembro || '',
      id_plan_cms: poliza.id_plan_cms || '',
      costo_poliza: poliza.costo_poliza?.toString() || '',
      subsidio: poliza.subsidio?.toString() || '',
      prima_mensual: poliza.prima_mensual?.toString() || '',
      tipo_inscripcion: poliza.tipo_inscripcion || '',
      ffm_mercado: poliza.ffm_mercado || '',
      npn_mercado: poliza.npn_mercado || '',
      fecha_inscripcion_especial: toDateInputValue(poliza.fecha_inscripcion_especial),
      razon_inscripcion_especial: poliza.razon_inscripcion_especial || '',
    });
  }, [open, poliza?.id]);

  useEffect(() => {
    if (!open) return;

    const loadOptions = async () => {
      try {
        const [tipos, aseg] = await Promise.all([
          api.tiposProducto.list(),
          api.aseguradoras.list(),
        ]);
        setTiposProducto(Array.isArray(tipos) ? tipos : (tipos as any).results || []);
        setAseguradoras(Array.isArray(aseg) ? aseg : (aseg as any).results || []);
      } catch (error) {
        console.error('Error cargando opciones del formulario:', error);
      }
    };

    loadOptions();
    resolveAgentCredentials();
  }, [open]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.fecha_efectiva) {
      toast({ title: 'Campo obligatorio', description: 'La fecha de efectividad es obligatoria.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        tipo_producto: form.tipo_producto ? Number(form.tipo_producto) : null,
        aseguradora: form.aseguradora ? Number(form.aseguradora) : null,
        nombre_plan: form.nombre_plan || null,
        fecha_efectiva: form.fecha_efectiva,
        fecha_cancelacion: form.fecha_cancelacion || null,
        metal: form.metal || null,
        id_mercado: form.id_mercado,
        id_miembro: form.id_miembro,
        id_plan_cms: form.id_plan_cms || null,
        costo_poliza: form.costo_poliza ? parseFloat(form.costo_poliza) : 0,
        subsidio: form.subsidio ? parseFloat(form.subsidio) : 0,
        prima_mensual: form.prima_mensual ? parseFloat(form.prima_mensual) : 0,
        tipo_inscripcion: form.tipo_inscripcion || null,
        ffm_mercado: form.ffm_mercado || null,
        npn_mercado: form.npn_mercado || null,
        fecha_inscripcion_especial: form.fecha_inscripcion_especial || null,
        razon_inscripcion_especial: form.razon_inscripcion_especial || null,
      };

      await api.polizas.patch(poliza.id, payload);
      toast({ title: 'Éxito', description: 'Información del seguro actualizada correctamente.' });
      onOpenChange(false);
      onSaved?.();
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description: error?.message || 'No se pudo actualizar la información del plan.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'h-9 dark:bg-slate-800 dark:border-slate-700';
  const selectTriggerClass = 'h-9 w-full dark:bg-slate-800 dark:border-slate-700';

  const handleUseMyFfm = async () => {
    const creds = agenteCredentials?.ffm ? agenteCredentials : await resolveAgentCredentials();
    if (!creds?.ffm) {
      toast({
        title: 'FFM no disponible',
        description: 'Tu usuario no tiene un FFM registrado. Contacta al administrador para asignarlo a tu perfil de agente.',
        variant: 'destructive',
      });
      return;
    }
    setForm((prev) => ({ ...prev, ffm_mercado: creds.ffm! }));
  };

  const handleUseMyNpn = async () => {
    const creds = agenteCredentials?.npn ? agenteCredentials : await resolveAgentCredentials();
    if (!creds?.npn) {
      toast({
        title: 'NPN no disponible',
        description: 'Tu usuario no tiene un NPN registrado. Contacta al administrador para asignarlo a tu perfil de agente.',
        variant: 'destructive',
      });
      return;
    }
    setForm((prev) => ({ ...prev, npn_mercado: creds.npn! }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[935px] w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto custom-scrollbar p-5 gap-0">
        <DialogHeader className="mb-3">
          <DialogTitle className="text-lg font-semibold">Información del Seguro</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <section>
            <SectionTitle>Información de la cobertura</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
              <FieldGroup label="Tipo de producto">
                <Select value={form.tipo_producto} onValueChange={(v) => updateField('tipo_producto', v)}>
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposProducto.map((tipo) => (
                      <SelectItem key={tipo.id} value={String(tipo.id)}>{tipo.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>

              <FieldGroup label="Aseguradora">
                <Select value={form.aseguradora} onValueChange={(v) => updateField('aseguradora', v)}>
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Seleccionar aseguradora" />
                  </SelectTrigger>
                  <SelectContent>
                    {aseguradoras.map((aseg) => (
                      <SelectItem key={aseg.id} value={String(aseg.id)}>{aseg.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>

              <div className="hidden lg:block" />

              <div className="sm:col-span-2 lg:col-span-3">
                <FieldGroup label="Nombre del plan">
                  <Input
                    placeholder="Ingrese nombre del plan"
                    value={form.nombre_plan}
                    onChange={(e) => updateField('nombre_plan', e.target.value)}
                    className={inputClass}
                  />
                </FieldGroup>
              </div>

              <FieldGroup label="Fecha de efectividad" required>
                <Input
                  type="date"
                  required
                  value={form.fecha_efectiva}
                  onChange={(e) => updateField('fecha_efectiva', e.target.value)}
                  className={inputClass}
                />
              </FieldGroup>

              <FieldGroup label="Fecha de cancelación">
                <Input
                  type="date"
                  value={form.fecha_cancelacion}
                  onChange={(e) => updateField('fecha_cancelacion', e.target.value)}
                  className={inputClass}
                />
              </FieldGroup>

              <FieldGroup label="Metal">
                <Select value={form.metal} onValueChange={(v) => updateField('metal', v)}>
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Ingrese nivel de metal" />
                  </SelectTrigger>
                  <SelectContent>
                    {METAL_OPTIONS.map((metal) => (
                      <SelectItem key={metal.value} value={metal.value}>{metal.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>

              <FieldGroup label="ID del mercado">
                <Input
                  value={form.id_mercado}
                  onChange={(e) => updateField('id_mercado', e.target.value)}
                  className={inputClass}
                />
              </FieldGroup>

              <FieldGroup label="ID del miembro">
                <Input
                  value={form.id_miembro}
                  onChange={(e) => updateField('id_miembro', e.target.value)}
                  className={inputClass}
                />
              </FieldGroup>

              <FieldGroup label="ID del plan CMS">
                <Input
                  value={form.id_plan_cms}
                  onChange={(e) => updateField('id_plan_cms', e.target.value)}
                  className={inputClass}
                />
              </FieldGroup>

              <FieldGroup label="Costo total de la póliza">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.costo_poliza}
                  onChange={(e) => updateField('costo_poliza', e.target.value)}
                  className={inputClass}
                />
              </FieldGroup>

              <FieldGroup label="Crédito fiscal / Subsidio">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.subsidio}
                  onChange={(e) => updateField('subsidio', e.target.value)}
                  className={inputClass}
                />
              </FieldGroup>

              <FieldGroup label="Prima (pago mensual)">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.prima_mensual}
                  onChange={(e) => updateField('prima_mensual', e.target.value)}
                  className={inputClass}
                />
              </FieldGroup>
            </div>
          </section>

          <section>
            <SectionTitle>Información de la inscripción</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
              <div className="sm:col-span-2 lg:col-span-3">
                <FieldGroup label="Tipo de venta">
                  <Select value={form.tipo_inscripcion} onValueChange={(v) => updateField('tipo_inscripcion', v)}>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Seleccionar tipo de venta" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPO_VENTA_OPTIONS.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldGroup>
              </div>

              <FieldGroup label="FFM usado en el mercado" actionLabel="Usar mi FFM" onAction={handleUseMyFfm}>
                <Input
                  value={form.ffm_mercado}
                  onChange={(e) => updateField('ffm_mercado', e.target.value)}
                  className={inputClass}
                />
              </FieldGroup>

              <FieldGroup label="NPN usado en el mercado" actionLabel="Usar mi NPN" onAction={handleUseMyNpn}>
                <Input
                  value={form.npn_mercado}
                  onChange={(e) => updateField('npn_mercado', e.target.value)}
                  className={inputClass}
                />
              </FieldGroup>

              <div className="hidden lg:block" />

              <FieldGroup label="Fecha inscripción periodo especial">
                <Input
                  type="date"
                  value={form.fecha_inscripcion_especial}
                  onChange={(e) => updateField('fecha_inscripcion_especial', e.target.value)}
                  className={inputClass}
                />
              </FieldGroup>

              <FieldGroup label="Razón inscripción periodo especial">
                <Input
                  value={form.razon_inscripcion_especial}
                  onChange={(e) => updateField('razon_inscripcion_especial', e.target.value)}
                  className={inputClass}
                />
              </FieldGroup>
            </div>
          </section>

          <DialogFooter className="pt-3 border-t border-slate-200 dark:border-slate-700 sm:justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cerrar
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Enviar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
