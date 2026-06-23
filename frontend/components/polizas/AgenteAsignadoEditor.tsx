'use client';

import { useEffect, useState } from 'react';
import { Loader2, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { agentesApi, api } from '@/lib/api';

interface AgenteAsignadoEditorProps {
  polizaId: number;
  agente?: number | null;
  agenteNombre?: string;
  onUpdated?: () => void;
  onSaved?: () => void;
}

export function AgenteAsignadoEditor({
  polizaId,
  agente,
  agenteNombre,
  onUpdated,
  onSaved,
}: AgenteAsignadoEditorProps) {
  const { toast } = useToast();
  const [allAgentes, setAllAgentes] = useState<{ id: number; nombre_completo: string }[]>([]);
  const [selectedAgente, setSelectedAgente] = useState(agente ? String(agente) : '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    agentesApi
      .list()
      .then((items) =>
        setAllAgentes(
          items.map((item) => ({
            id: item.id!,
            nombre_completo: item.nombre_completo ?? item.usuario_info?.username ?? 'Sin nombre',
          }))
        )
      )
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSelectedAgente(agente ? String(agente) : '');
  }, [agente]);

  const handleSave = async () => {
    const nextAgenteId = selectedAgente ? Number(selectedAgente) : null;
    const currentAgenteId = agente ?? null;

    if (nextAgenteId === currentAgenteId) {
      toast({ description: 'No hay cambios por guardar.' });
      onSaved?.();
      return;
    }

    setSaving(true);
    try {
      await api.polizas.patch(polizaId, { agente: nextAgenteId ?? undefined });
      toast({ title: 'Cambios guardados', description: 'El agente asignado se actualizó correctamente.' });
      onUpdated?.();
      onSaved?.();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el agente asignado.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedNombre =
    allAgentes.find((item) => item.id === Number(selectedAgente))?.nombre_completo ||
    agenteNombre ||
    'Sin agente';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Cargando agentes...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <UserCheck className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Agente asignado a la póliza</h3>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Actual: <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedNombre}</span>
        </p>

        <select
          value={selectedAgente}
          onChange={(e) => setSelectedAgente(e.target.value)}
          disabled={saving}
          className="w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Sin agente asignado</option>
          {allAgentes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nombre_completo}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-700">
        <Button
          className="bg-primary hover:bg-primary/90 min-w-[140px]"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar cambios'
          )}
        </Button>
      </div>
    </div>
  );
}
