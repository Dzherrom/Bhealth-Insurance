import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Edit, Trash2, Plus } from 'lucide-react';
import { direccionesApi, polizasApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { collectPolicyAddresses, formatDireccion } from './polizaUtils';

interface DireccionesPolizaProps {
  poliza: any;
  onRefresh?: () => void;
}

const emptyDireccion = {
  linea1: '',
  linea2: '',
  ciudad: '',
  estado: '',
  zip_code: '',
  condado: '',
};

const slots = [
  { key: 'direccion_fisica' as const, label: 'Física', color: 'border-l-blue-500' },
  { key: 'direccion_postal' as const, label: 'Postal', color: 'border-l-purple-500' },
  { key: 'direccion_facturacion' as const, label: 'Facturación', color: 'border-l-green-500' },
];

export function DireccionesPoliza({ poliza, onRefresh }: DireccionesPolizaProps) {
  const [openModal, setOpenModal] = useState(false);
  const [editingDireccion, setEditingDireccion] = useState<any | null>(null);
  const [form, setForm] = useState<any>(emptyDireccion);
  const [assignSlot, setAssignSlot] = useState<string>('');

  const polizaId = poliza?.id;
  const policyAddresses = useMemo(() => collectPolicyAddresses(poliza), [poliza]);

  const resolveSlotValue = (slotKey: 'direccion_fisica' | 'direccion_postal' | 'direccion_facturacion') => {
    const id = poliza?.[slotKey];
    if (id) {
      const fromPolicy = policyAddresses.find((d) => Number(d.id) === Number(id));
      if (fromPolicy) return fromPolicy;
    }
    return poliza?.[`${slotKey}_details`] || null;
  };

  const asignarDireccion = async (
    slotKey: 'direccion_fisica' | 'direccion_postal' | 'direccion_facturacion',
    direccionId: number | null
  ) => {
    if (!polizaId) return;
    try {
      await polizasApi.patch(polizaId, { [slotKey]: direccionId } as any);
      toast({ title: direccionId ? 'Dirección asignada' : 'Dirección desvinculada' });
      onRefresh?.();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error al asignar dirección', variant: 'destructive' });
    }
  };

  const saveDireccion = async () => {
    if (!form.linea1?.trim() || !form.ciudad?.trim() || !form.estado?.trim() || !form.zip_code?.trim()) {
      toast({ title: 'Complete los campos obligatorios de la dirección', variant: 'destructive' });
      return;
    }

    try {
      if (editingDireccion?.id) {
        await direccionesApi.patch(editingDireccion.id, form);
        toast({ title: 'Dirección actualizada' });
      } else {
        const created = await direccionesApi.create(form);
        let slotToAssign = assignSlot as 'direccion_fisica' | 'direccion_postal' | 'direccion_facturacion' | '';
        if (!slotToAssign) {
          const emptySlot = slots.find((slot) => !poliza?.[slot.key]);
          slotToAssign = emptySlot?.key || 'direccion_fisica';
        }
        if (created?.id && slotToAssign) {
          await polizasApi.patch(polizaId, { [slotToAssign]: created.id } as any);
        }
        toast({ title: 'Dirección creada y vinculada a la póliza' });
      }
      setOpenModal(false);
      setEditingDireccion(null);
      setForm(emptyDireccion);
      setAssignSlot('');
      onRefresh?.();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error guardando dirección', variant: 'destructive' });
    }
  };

  const removeDireccion = async (id: number) => {
    if (!window.confirm('¿Eliminar esta dirección de la póliza?')) return;

    const slotUsages = slots
      .filter((slot) => Number(poliza?.[slot.key]) === Number(id))
      .map((slot) => slot.key);

    try {
      for (const slotKey of slotUsages) {
        await polizasApi.patch(polizaId, { [slotKey]: null } as any);
      }
      await direccionesApi.delete(id);
      toast({ title: 'Dirección eliminada' });
      onRefresh?.();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error eliminando dirección', variant: 'destructive' });
    }
  };

  const openCreateModal = () => {
    setEditingDireccion(null);
    setForm(emptyDireccion);
    setAssignSlot('direccion_fisica');
    setOpenModal(true);
  };

  const openEditModal = (direccion: any) => {
    setEditingDireccion(direccion);
    setForm({
      linea1: direccion.linea1 || '',
      linea2: direccion.linea2 || '',
      ciudad: direccion.ciudad || '',
      estado: direccion.estado || '',
      zip_code: direccion.zip_code || '',
      condado: direccion.condado || '',
    });
    setAssignSlot('');
    setOpenModal(true);
  };

  if (!poliza) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-primary" /> Direcciones de la póliza
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Solo se pueden usar direcciones vinculadas a esta póliza. Cree una nueva dirección o seleccione una existente de esta póliza.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {slots.map((slot) => {
              const value = resolveSlotValue(slot.key);
              return (
                <div key={slot.key} className={`border rounded p-4 border-l-4 ${slot.color}`}>
                  <h3 className="font-bold mb-2">{slot.label}</h3>
                  {value ? (
                    <div className="text-sm space-y-1">
                      <p>{formatDireccion(value)}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No asignada</p>
                  )}
                  <select
                    className="mt-3 w-full border rounded px-2 py-1 text-sm bg-white dark:bg-slate-800"
                    value={poliza?.[slot.key] || ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      asignarDireccion(slot.key, val);
                    }}
                  >
                    <option value="">Sin asignar</option>
                    {policyAddresses.map((d) => (
                      <option key={d.id} value={d.id}>
                        #{d.id} - {d.linea1}, {d.ciudad}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Direcciones de esta póliza</CardTitle>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-1" /> Nueva dirección
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {policyAddresses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Esta póliza aún no tiene direcciones. Cree una nueva para comenzar.</p>
          ) : (
            policyAddresses.map((d) => (
              <div key={d.id} className="border rounded p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">#{d.id} - {d.linea1}{d.linea2 ? `, ${d.linea2}` : ''}</p>
                  <p className="text-xs text-muted-foreground">{formatDireccion(d)}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => openEditModal(d)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => removeDireccion(d.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDireccion ? 'Editar dirección' : 'Nueva dirección'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Línea 1 *</Label><Input value={form.linea1} onChange={(e) => setForm((p: any) => ({ ...p, linea1: e.target.value }))} /></div>
            <div><Label>Línea 2</Label><Input value={form.linea2} onChange={(e) => setForm((p: any) => ({ ...p, linea2: e.target.value }))} /></div>
            <div><Label>Ciudad *</Label><Input value={form.ciudad} onChange={(e) => setForm((p: any) => ({ ...p, ciudad: e.target.value }))} /></div>
            <div><Label>Estado *</Label><Input value={form.estado} onChange={(e) => setForm((p: any) => ({ ...p, estado: e.target.value }))} /></div>
            <div><Label>ZIP *</Label><Input value={form.zip_code} onChange={(e) => setForm((p: any) => ({ ...p, zip_code: e.target.value }))} /></div>
            <div><Label>Condado</Label><Input value={form.condado} onChange={(e) => setForm((p: any) => ({ ...p, condado: e.target.value }))} /></div>
            {!editingDireccion && (
              <div>
                <Label>Asignar como</Label>
                <select
                  className="mt-1 w-full border rounded px-2 py-2 text-sm bg-white dark:bg-slate-800"
                  value={assignSlot}
                  onChange={(e) => setAssignSlot(e.target.value)}
                >
                  {slots.map((slot) => (
                    <option key={slot.key} value={slot.key}>{slot.label}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex justify-end"><Button onClick={saveDireccion}>Guardar</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
