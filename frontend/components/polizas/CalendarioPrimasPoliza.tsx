import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, AlertTriangle, Clock3, DollarSign } from 'lucide-react';
import { polizasApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface CalendarioPrimasPolizaProps {
  polizaId: number;
}

export function CalendarioPrimasPoliza({ polizaId }: CalendarioPrimasPolizaProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      if (!polizaId) return;
      setLoading(true);
      try {
        const response = await polizasApi.getCalendarioPrimas(polizaId);
        setData(response);
      } catch (error) {
        console.error(error);
        toast({ title: 'Error cargando calendario de primas', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [polizaId]);

  const pagos = useMemo(() => data?.pagos || [], [data]);
  const stats = data?.stats;

  const estadoClass = (estado: string) => {
    if (estado === 'VENCIDA') return 'bg-red-100 text-red-700';
    if (estado === 'PROXIMA') return 'bg-amber-100 text-amber-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" /> Programadas</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats?.total_programadas ?? 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Vencidas</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{stats?.vencidas ?? 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock3 className="h-4 w-4" /> Proximas 30 dias</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-amber-600">{stats?.proximas_30_dias ?? 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" /> Total programado</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">${Number(stats?.monto_total_programado || 0).toFixed(2)}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calendario de primas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : pagos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay pagos programados.</p>
          ) : (
            <div className="space-y-2">
              {pagos.map((p: any) => (
                <div key={p.indice} className="border rounded-md p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">Cuota #{p.indice}</p>
                    <p className="text-sm text-muted-foreground">{new Date(p.fecha).toLocaleDateString('es-ES')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">${Number(p.monto || 0).toFixed(2)}</span>
                    <span className={`text-xs px-2 py-1 rounded ${estadoClass(p.estado)}`}>{p.estado}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
