import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, Circle, Edit, Plus, Search, Trash2 } from 'lucide-react';
import { tareasApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface TareasPolizaProps {
  polizaId: number;
  userId?: number;
}

const initialForm = {
  titulo: '',
  descripcion: '',
  fecha_limite: '',
  completada: false,
};

export function TareasPoliza({ polizaId, userId }: TareasPolizaProps) {
  const [search, setSearch] = useState('');
  const [tareas, setTareas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(initialForm);

  const loadTareas = async () => {
    if (!polizaId) return;
    setLoading(true);
    try {
      const res = await tareasApi.list();
      const list = (res as any).results || res || [];
      setTareas(list.filter((t: any) => Number(t.poliza) === Number(polizaId)));
    } catch (error) {
      console.error(error);
      toast({ title: 'Error al cargar tareas', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTareas();
  }, [polizaId]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tareas.filter((t) => `${t.titulo} ${t.descripcion || ''}`.toLowerCase().includes(q));
  }, [search, tareas]);

  const save = async () => {
    try {
      const payload = {
        poliza: polizaId,
        titulo: form.titulo,
        descripcion: form.descripcion,
        fecha_limite: form.fecha_limite ? `${form.fecha_limite}T23:59:00` : null,
        completada: form.completada,
        asignado_a: userId || null,
      };

      if (editing?.id) {
        await tareasApi.patch(editing.id, payload as any);
      } else {
        await tareasApi.create(payload as any);
      }

      toast({ title: 'Tarea guardada' });
      setOpenModal(false);
      setEditing(null);
      setForm(initialForm);
      await loadTareas();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error guardando tarea', variant: 'destructive' });
    }
  };

  const toggleCompletada = async (tarea: any) => {
    try {
      await tareasApi.patch(tarea.id, { completada: !tarea.completada } as any);
      await loadTareas();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error actualizando estado', variant: 'destructive' });
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Eliminar tarea?')) return;
    try {
      await tareasApi.delete(id);
      toast({ title: 'Tarea eliminada' });
      await loadTareas();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error eliminando tarea', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Tareas de la poliza</CardTitle>
          <Button onClick={() => { setEditing(null); setForm(initialForm); setOpenModal(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Nueva tarea
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4 max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" placeholder="Buscar tarea" />
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay tareas.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((tarea) => (
                <div key={tarea.id} className="border rounded-md p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleCompletada(tarea)}>
                      {tarea.completada ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5 text-gray-400" />}
                    </button>
                    <div>
                      <p className={`font-medium ${tarea.completada ? 'line-through text-muted-foreground' : ''}`}>{tarea.titulo}</p>
                      {tarea.descripcion && <p className="text-sm text-muted-foreground">{tarea.descripcion}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setEditing(tarea);
                        setForm({
                          titulo: tarea.titulo || '',
                          descripcion: tarea.descripcion || '',
                          fecha_limite: tarea.fecha_limite ? String(tarea.fecha_limite).slice(0, 10) : '',
                          completada: Boolean(tarea.completada),
                        });
                        setOpenModal(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => remove(tarea.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar tarea' : 'Nueva tarea'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Titulo</Label>
              <Input value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} />
            </div>
            <div>
              <Label>Descripcion</Label>
              <Textarea value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))} />
            </div>
            <div>
              <Label>Fecha limite</Label>
              <Input type="date" value={form.fecha_limite} onChange={(e) => setForm((p) => ({ ...p, fecha_limite: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.completada}
                onChange={(e) => setForm((p) => ({ ...p, completada: e.target.checked }))}
              />
              Completada
            </label>
            <div className="flex justify-end">
              <Button onClick={save}>Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
