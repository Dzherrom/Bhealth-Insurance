'use client';

import { useEffect, useState } from 'react';
import { Loader2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { api, etiquetasApi } from '@/lib/api';
import { RemovableEtiquetaBadge } from './polizaStatusUtils';

interface EtiquetaItem {
  id: number;
  nombre: string;
  color?: string;
}

interface EtiquetasPolizaEditorProps {
  polizaId: number;
  etiquetas?: EtiquetaItem[];
  onUpdated?: () => void;
  onSaved?: () => void;
}

export function EtiquetasPolizaEditor({
  polizaId,
  etiquetas = [],
  onUpdated,
  onSaved,
}: EtiquetasPolizaEditorProps) {
  const { toast } = useToast();
  const [allEtiquetas, setAllEtiquetas] = useState<EtiquetaItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    etiquetasApi
      .list()
      .then((items) => {
        const typed = items as (EtiquetaItem & { tipo?: string })[];
        const polizaEtiquetas = typed.filter((item) => item.tipo === 'POLIZA');
        setAllEtiquetas(polizaEtiquetas.length > 0 ? polizaEtiquetas : typed);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSelectedIds(etiquetas.map((item) => item.id));
  }, [etiquetas]);

  const toggleEtiqueta = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    const currentIds = etiquetas.map((item) => item.id).sort((a, b) => a - b);
    const nextIds = [...selectedIds].sort((a, b) => a - b);

    if (
      currentIds.length === nextIds.length &&
      currentIds.every((id, index) => id === nextIds[index])
    ) {
      toast({ description: 'No hay cambios por guardar.' });
      onSaved?.();
      return;
    }

    setSaving(true);
    try {
      await api.polizas.patch(polizaId, { etiquetas_ids: selectedIds });
      toast({ title: 'Cambios guardados', description: 'Las etiquetas se actualizaron correctamente.' });
      onUpdated?.();
      onSaved?.();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudieron guardar las etiquetas.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Cargando etiquetas...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Etiquetas de póliza</h3>
        </div>

        {allEtiquetas.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No hay etiquetas configuradas. Cree etiquetas en Configuraciones.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {allEtiquetas.map((etiqueta) => {
              const isSelected = selectedIds.includes(etiqueta.id);
              return (
                <label
                  key={etiqueta.id}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-primary/40 bg-primary/5 dark:bg-primary/10'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleEtiqueta(etiqueta.id)}
                      disabled={saving}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary shrink-0"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-200 truncate">
                      {etiqueta.nombre}
                    </span>
                  </div>
                  <RemovableEtiquetaBadge label={etiqueta.nombre} color={etiqueta.color} />
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-700">
        <Button
          className="bg-primary hover:bg-primary/90 min-w-[140px]"
          onClick={handleSave}
          disabled={saving || allEtiquetas.length === 0}
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
