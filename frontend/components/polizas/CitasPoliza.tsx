'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CalendarDays, Clock3, MapPin, Plus, Search, SquarePen, Stethoscope, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { citasApi, type Cita } from '@/lib/api';
import { EditCitaPolizaModal } from './EditCitaPolizaModal';

type ClientePolizaMember = {
  id?: number;
  cliente: number;
  es_solicitante_principal?: boolean;
  relacion?: string;
  cliente_details?: {
    primer_nombre?: string;
    apellido_paterno?: string;
    apellido_materno?: string;
  };
};

interface CitasPolizaProps {
  polizaId: number;
  clientesInfo: ClientePolizaMember[];
}

type EstadoCita = Cita['estado'];

const ESTADO_LABELS: Record<EstadoCita, string> = {
  PROGRAMADA: 'Programada',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
  NO_ASISTIO: 'No asistió',
};

const ESTADO_BADGE_CLASS: Record<EstadoCita, string> = {
  PROGRAMADA: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
  COMPLETADA: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
  CANCELADA: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900',
  NO_ASISTIO: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
};

const toEstadoCita = (value: unknown): EstadoCita => {
  if (value === 'COMPLETADA' || value === 'CANCELADA' || value === 'NO_ASISTIO') return value;
  return 'PROGRAMADA';
};

const parseCitaDate = (value: string): number => {
  const direct = new Date(value).getTime();
  if (!Number.isNaN(direct)) return direct;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return 0;
  const [, mm, dd, yyyy, hh, min, ss] = match;
  return new Date(
    Number(yyyy),
    Number(mm) - 1,
    Number(dd),
    Number(hh),
    Number(min),
    Number(ss)
  ).getTime();
};

const formatDate = (value: string) => {
  const timestamp = parseCitaDate(value);
  if (!timestamp) return value || '--';
  return new Date(timestamp).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatTime = (value: string) => {
  const timestamp = parseCitaDate(value);
  if (!timestamp) return '--:--';
  return new Date(timestamp).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export function CitasPoliza({ polizaId, clientesInfo }: CitasPolizaProps) {
  const { toast } = useToast();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<'ALL' | EstadoCita>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const loadRequestRef = useRef(0);

  const loadCitas = useCallback(async (options?: { silent?: boolean }) => {
    if (!polizaId) return;
    const requestId = ++loadRequestRef.current;
    if (!options?.silent) {
      setIsLoading(true);
    }
    try {
      const data = await citasApi.listByPoliza(polizaId);
      if (requestId !== loadRequestRef.current) return;
      setCitas(Array.isArray(data) ? data : []);
    } catch (error) {
      if (requestId !== loadRequestRef.current) return;
      console.error(error);
      toast({ title: 'Error', description: 'No se pudieron cargar las citas médicas.', variant: 'destructive' });
    } finally {
      if (requestId === loadRequestRef.current) {
        setIsLoading(false);
      }
    }
  }, [polizaId, toast]);

  const handleSaved = useCallback(async (savedCita?: Cita) => {
    if (savedCita?.id) {
      setCitas((prev) => {
        const exists = prev.some((c) => c.id === savedCita.id);
        if (exists) {
          return prev.map((c) => (c.id === savedCita.id ? savedCita : c));
        }
        return [...prev, savedCita];
      });
    } else {
      await loadCitas({ silent: true });
    }
  }, [loadCitas]);

  useEffect(() => {
    loadCitas();
  }, [loadCitas]);

  const filteredCitas = useMemo(() => {
    const term = search.trim().toLowerCase();
    return citas
      .map((cita) => ({ ...cita, estado: toEstadoCita(cita.estado) }))
      .filter((cita) => {
        if (estadoFilter !== 'ALL' && cita.estado !== estadoFilter) return false;
        if (!term) return true;
        return (
          (cita.cliente_nombre || '').toLowerCase().includes(term) ||
          (cita.proveedor || '').toLowerCase().includes(term) ||
          (cita.lugar || '').toLowerCase().includes(term) ||
          (cita.motivo || '').toLowerCase().includes(term)
        );
      })
      .sort((a, b) => parseCitaDate(b.fecha_hora) - parseCitaDate(a.fecha_hora));
  }, [citas, search, estadoFilter]);

  const showInitialLoading = isLoading && citas.length === 0;
  const tableRows = filteredCitas.length > 0 ? filteredCitas : citas;

  const stats = useMemo(() => ({
    total: citas.length,
    programadas: citas.filter((c) => toEstadoCita(c.estado) === 'PROGRAMADA').length,
    completadas: citas.filter((c) => toEstadoCita(c.estado) === 'COMPLETADA').length,
    canceladas: citas.filter((c) => toEstadoCita(c.estado) === 'CANCELADA').length,
  }), [citas]);

  const openCreate = () => {
    setSelectedCita(null);
    setModalOpen(true);
  };

  const openEdit = (cita: Cita) => {
    setSelectedCita(cita);
    setModalOpen(true);
  };

  const handleQuickCancel = async (cita: Cita) => {
    if (!cita.id || toEstadoCita(cita.estado) !== 'PROGRAMADA') return;
    if (!window.confirm('¿Marcar esta cita como cancelada?')) return;

    try {
      const updated = await citasApi.patch(cita.id, { estado: 'CANCELADA' });
      toast({ title: 'Cita cancelada' });
      setCitas((prev) => prev.map((item) => (item.id === cita.id ? updated : item)));
      await loadCitas({ silent: true });
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudo cancelar la cita.', variant: 'destructive' });
    }
  };

  const handleQuickDelete = async (cita: Cita) => {
    if (!cita.id || !window.confirm('¿Eliminar esta cita médica permanentemente?')) return;

    try {
      await citasApi.delete(cita.id);
      toast({ title: 'Cita eliminada' });
      setCitas((prev) => prev.filter((item) => item.id !== cita.id));
      await loadCitas({ silent: true });
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudo eliminar la cita.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white shadow-sm border border-slate-100 rounded-lg dark:bg-slate-800 dark:border-slate-800 p-4 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Citas médicas</h2>
          </div>
          <Button
            className="bg-teal-600 hover:bg-teal-700 text-white"
            onClick={openCreate}
            disabled={clientesInfo.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva cita
          </Button>
        </div>

        {clientesInfo.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 dark:border-slate-700 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Agrega al menos un miembro a la póliza para registrar citas médicas.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <StatCard label="Total" value={stats.total} />
              <StatCard label="Programadas" value={stats.programadas} className="text-blue-600" />
              <StatCard label="Completadas" value={stats.completadas} className="text-emerald-600" />
              <StatCard label="Canceladas" value={stats.canceladas} className="text-red-600" />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por paciente, proveedor o lugar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={estadoFilter} onValueChange={(v) => setEstadoFilter(v as 'ALL' | EstadoCita)}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los estados</SelectItem>
                  {Object.entries(ESTADO_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showInitialLoading ? (
              <p className="text-center text-gray-500 py-10">Cargando citas...</p>
            ) : citas.length === 0 ? (
              <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-lg py-10 text-center">
                <Stethoscope className="h-8 w-8 text-teal-300 dark:text-teal-700 mx-auto mb-2" />
                <p className="font-medium text-gray-800 dark:text-white">No hay citas registradas</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Programa la primera cita médica para esta póliza.
                </p>
              </div>
            ) : (
              <>
                {filteredCitas.length === 0 ? (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mb-3">
                    Ninguna cita coincide con los filtros. Mostrando todas las citas de la póliza.
                  </p>
                ) : null}
              <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-700">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha y hora</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Lugar</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableRows.map((cita) => {
                      const estado = toEstadoCita(cita.estado);
                      return (
                      <TableRow key={cita.id ?? `${cita.fecha_hora}-${cita.proveedor}`}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-sm font-medium">
                              <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                              {formatDate(cita.fecha_hora)}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Clock3 className="h-3.5 w-3.5" />
                              {formatTime(cita.fecha_hora)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{cita.cliente_nombre || '—'}</TableCell>
                        <TableCell className="text-sm">{cita.proveedor}</TableCell>
                        <TableCell>
                          <div className="flex items-start gap-1.5 text-sm max-w-[180px]">
                            <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{cita.lugar}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={ESTADO_BADGE_CLASS[estado]}>
                            {ESTADO_LABELS[estado]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cita)} title="Editar">
                              <SquarePen className="h-4 w-4" />
                            </Button>
                            {estado === 'PROGRAMADA' ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-amber-600 hover:text-amber-700"
                                onClick={() => handleQuickCancel(cita)}
                                title="Cancelar cita"
                              >
                                <CalendarDays className="h-4 w-4" />
                              </Button>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              onClick={() => handleQuickDelete(cita)}
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              </>
            )}
          </>
        )}
      </div>

      <EditCitaPolizaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        polizaId={polizaId}
        clientesInfo={clientesInfo}
        cita={selectedCita}
        onSaved={handleSaved}
      />
    </div>
  );
}

function StatCard({ label, value, className = '' }: { label: string; value: number; className?: string }) {
  return (
    <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40 px-3 py-2">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-2xl font-bold ${className || 'text-gray-900 dark:text-white'}`}>{value}</p>
    </div>
  );
}
