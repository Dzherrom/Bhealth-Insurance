import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Edit, Search, Trash2, Plus } from 'lucide-react';
import { direccionesApi, polizasApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface DireccionesPolizaProps {
  poliza: any;
}

const emptyDireccion = {
  linea1: '',
  linea2: '',
  ciudad: '',
  estado: '',
  zip_code: '',
  condado: '',
};

export function DireccionesPoliza({ poliza }: DireccionesPolizaProps) {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [direcciones, setDirecciones] = useState<any[]>([]);

  const [openModal, setOpenModal] = useState(false);
  const [editingDireccion, setEditingDireccion] = useState<any | null>(null);
  const [form, setForm] = useState<any>(emptyDireccion);

  const polizaId = poliza?.id;

  const slots = [
    { key: 'direccion_fisica', label: 'Fisica', color: 'border-l-blue-500' },
    { key: 'direccion_postal', label: 'Postal', color: 'border-l-purple-500' },
    { key: 'direccion_facturacion', label: 'Facturacion', color: 'border-l-green-500' },
  ] as const;

  const loadDirecciones = async () => {
    setLoading(true);
    try {
      const res = await direccionesApi.list();
      const list = (res as any).results || res || [];
      setDirecciones(list as any[]);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error al cargar direcciones', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDirecciones();
  }, [polizaId]);

  const byId = (id?: number) => direcciones.find((d) => Number(d.id) === Number(id));

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return direcciones.filter((d) =>
      [d.linea1, d.linea2, d.ciudad, d.estado, d.zip_code, d.condado].join(' ').toLowerCase().includes(q)
    );
  }, [direcciones, search]);

  const saveDireccion = async () => {
    try {
      if (editingDireccion?.id) {
        await direccionesApi.patch(editingDireccion.id, form);
      } else {
        await direccionesApi.create(form);
      }
      toast({ title: 'Direccion guardada' });
      setOpenModal(false);
      setEditingDireccion(null);
      setForm(emptyDireccion);
      await loadDirecciones();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error guardando direccion', variant: 'destructive' });
    }
  };

  const removeDireccion = async (id: number) => {
    if (!window.confirm('Eliminar direccion?')) return;
    try {
      await direccionesApi.delete(id);
      toast({ title: 'Direccion eliminada' });
      await loadDirecciones();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error eliminando direccion', variant: 'destructive' });
    }
  };

  const asignarDireccion = async (slotKey: 'direccion_fisica' | 'direccion_postal' | 'direccion_facturacion', direccionId: number) => {
    if (!polizaId) return;
    try {
      await polizasApi.patch(polizaId, { [slotKey]: direccionId } as any);
      toast({ title: 'Direccion asignada a la poliza' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Error asignando direccion', variant: 'destructive' });
    }
  };

  if (!poliza) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-primary" /> Direcciones de poliza
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {slots.map((slot) => {
              const value = byId(poliza?.[slot.key]);
              return (
                <div key={slot.key} className={`border rounded p-4 border-l-4 ${slot.color}`}>
                  <h3 className="font-bold mb-2">{slot.label}</h3>
                  {value ? (
                    <div className="text-sm space-y-1">
                      <p>{value.linea1}</p>
                      {value.linea2 && <p>{value.linea2}</p>}
                      <p>{value.ciudad}, {value.estado} {value.zip_code}</p>
                      <p className="text-muted-foreground">Condado: {value.condado || 'N/A'}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No asignada</p>
                  )}
                  <select
                    className="mt-3 w-full border rounded px-2 py-1 text-sm"
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val) {
                        asignarDireccion(slot.key, val);
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">Asignar direccion...</option>
                    {direcciones.map((d) => (
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
          <CardTitle className="text-lg">Catalogo de direcciones</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input className="pl-10" placeholder="Buscar direccion" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button onClick={() => { setOpenModal(true); setEditingDireccion(null); setForm(emptyDireccion); }}>
              <Plus className="h-4 w-4 mr-1" /> Nueva
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin direcciones</p>
          ) : (
            filtered.map((d) => (
              <div key={d.id} className="border rounded p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{d.linea1}{d.linea2 ? `, ${d.linea2}` : ''}</p>
                  <p className="text-xs text-muted-foreground">{d.ciudad}, {d.estado} {d.zip_code} - {d.condado}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setEditingDireccion(d);
                      setForm({
                        linea1: d.linea1 || '',
                        linea2: d.linea2 || '',
                        ciudad: d.ciudad || '',
                        estado: d.estado || '',
                        zip_code: d.zip_code || '',
                        condado: d.condado || '',
                      });
                      setOpenModal(true);
                    }}
                  >
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
          <DialogHeader><DialogTitle>{editingDireccion ? 'Editar direccion' : 'Nueva direccion'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Linea 1</Label><Input value={form.linea1} onChange={(e) => setForm((p: any) => ({ ...p, linea1: e.target.value }))} /></div>
            <div><Label>Linea 2</Label><Input value={form.linea2} onChange={(e) => setForm((p: any) => ({ ...p, linea2: e.target.value }))} /></div>
            <div><Label>Ciudad</Label><Input value={form.ciudad} onChange={(e) => setForm((p: any) => ({ ...p, ciudad: e.target.value }))} /></div>
            <div><Label>Estado</Label><Input value={form.estado} onChange={(e) => setForm((p: any) => ({ ...p, estado: e.target.value }))} /></div>
            <div><Label>ZIP</Label><Input value={form.zip_code} onChange={(e) => setForm((p: any) => ({ ...p, zip_code: e.target.value }))} /></div>
            <div><Label>Condado</Label><Input value={form.condado} onChange={(e) => setForm((p: any) => ({ ...p, condado: e.target.value }))} /></div>
            <div className="flex justify-end"><Button onClick={saveDireccion}>Guardar</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
