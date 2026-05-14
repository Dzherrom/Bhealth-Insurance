'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { CalendarDays, Clock3, FileText, MapPin, Search, User2, Plus } from 'lucide-react';
import { citasApi } from '@/lib/api';

type CitaApi = Awaited<ReturnType<typeof citasApi.list>>[number];

type EstadoCita = 'PROGRAMADA' | 'COMPLETADA' | 'CANCELADA' | 'NO_ASISTIO';

const ITEMS_PER_PAGE = 50;

const MOCK_CITAS: CitaApi[] = [
  {
    id: 1,
    poliza: 34,
    cliente_nombre: null,
    fecha_hora: '2026-05-13T03:00:00',
    proveedor: 'Pepito',
    lugar: 'Florida',
    estado: 'PROGRAMADA',
  },
  {
    id: 2,
    poliza: 1,
    cliente_nombre: null,
    fecha_hora: '2026-05-15T03:00:00',
    proveedor: 'Raymundo',
    lugar: 'Florida',
    estado: 'PROGRAMADA',
  },
];

const ESTADO_LABELS: Record<EstadoCita, string> = {
  PROGRAMADA: 'Programada',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
  NO_ASISTIO: 'No asistio',
};

const ESTADO_BADGE_CLASS: Record<EstadoCita, string> = {
  PROGRAMADA: 'bg-blue-100 text-blue-700 border-blue-200',
  COMPLETADA: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CANCELADA: 'bg-red-100 text-red-700 border-red-200',
  NO_ASISTIO: 'bg-amber-100 text-amber-700 border-amber-200',
};

const toEstadoCita = (value: unknown): EstadoCita => {
  if (value === 'COMPLETADA' || value === 'CANCELADA' || value === 'NO_ASISTIO') return value;
  return 'PROGRAMADA';
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export default function CitasPage() {
  const [citas, setCitas] = useState<CitaApi[]>([]);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<'ALL' | EstadoCita>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const loadCitas = async () => {
    setIsLoading(true);
    try {
      const data = await citasApi.list();
      setCitas(data.length > 0 ? data : MOCK_CITAS);
    } catch {
      setCitas(MOCK_CITAS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCitas();
  }, []);

  const citasConEstado = useMemo(
    () => citas.map((cita) => ({ ...cita, estado: toEstadoCita(cita.estado) })),
    [citas]
  );

  const filteredCitas = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return citasConEstado.filter((cita) => {
      const statusOk = estadoFilter === 'ALL' || cita.estado === estadoFilter;
      if (!statusOk) return false;
      if (!searchTerm) return true;

      const polizaText = `#${cita.poliza}`;
      const cliente = (cita.cliente_nombre || '--').toLowerCase();

      return (
        cita.proveedor.toLowerCase().includes(searchTerm) ||
        cita.lugar.toLowerCase().includes(searchTerm) ||
        polizaText.toLowerCase().includes(searchTerm) ||
        cliente.includes(searchTerm)
      );
    });
  }, [citasConEstado, search, estadoFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCitas.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedCitas = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCitas.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCitas, currentPage]);

  const total = citasConEstado.length;
  const totalProgramadas = citasConEstado.filter((c) => c.estado === 'PROGRAMADA').length;
  const totalCompletadas = citasConEstado.filter((c) => c.estado === 'COMPLETADA').length;
  const totalCanceladas = citasConEstado.filter((c) => c.estado === 'CANCELADA').length;

  const cancelCita = async (citaId: number) => {
    const current = citasConEstado.find((cita) => cita.id === citaId);
    if (!current || current.estado !== 'PROGRAMADA') return;

    setCitas((prev) =>
      prev.map((cita) => (cita.id === citaId ? { ...cita, estado: 'CANCELADA' as EstadoCita } : cita))
    );

    try {
      await citasApi.patch(citaId, { estado: 'CANCELADA' });
    } catch {
      setCitas((prev) =>
        prev.map((cita) => (cita.id === citaId ? { ...cita, estado: current.estado } : cita))
      );
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-blue-600" />
          <h1 className="text-3xl font-bold tracking-tight">Citas</h1>
        </div>

        <Button className="bg-blue-600 text-white hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Nueva cita
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Programadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{totalProgramadas}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">{totalCompletadas}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Canceladas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{totalCanceladas}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
                placeholder="Buscar por proveedor, lugar o cliente..."
              />
            </div>

            <Select
              value={estadoFilter}
              onValueChange={(value) => {
                setEstadoFilter(value as 'ALL' | EstadoCita);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los estados</SelectItem>
                <SelectItem value="PROGRAMADA">Programada</SelectItem>
                <SelectItem value="COMPLETADA">Completada</SelectItem>
                <SelectItem value="CANCELADA">Cancelada</SelectItem>
                <SelectItem value="NO_ASISTIO">No asistio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Fecha y hora</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Lugar</TableHead>
                <TableHead>Poliza</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="pr-6 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading && paginatedCitas.length === 0 && (
                <TableRow>
                  <TableCell className="h-24 text-center text-muted-foreground" colSpan={7}>
                    No hay citas para los filtros seleccionados.
                  </TableCell>
                </TableRow>
              )}

              {paginatedCitas.map((cita) => (
                <TableRow key={cita.id}>
                  <TableCell className="pl-6">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-2 font-medium">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatDate(cita.fecha_hora)}
                      </span>
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatTime(cita.fecha_hora)}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="flex items-center gap-2">
                      <User2 className="h-3.5 w-3.5 text-muted-foreground" />
                      {cita.proveedor}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {cita.lugar}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      #{cita.poliza}
                    </span>
                  </TableCell>

                  <TableCell>{cita.cliente_nombre || '--'}</TableCell>

                  <TableCell>
                    <Badge variant="outline" className={ESTADO_BADGE_CLASS[cita.estado]}>
                      {ESTADO_LABELS[cita.estado]}
                    </Badge>
                  </TableCell>

                  <TableCell className="pr-6 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={cita.estado !== 'PROGRAMADA'}
                      onClick={() => cancelCita(cita.id!)}
                    >
                      Cancelar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredCitas.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between border-t px-6 py-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredCitas.length)} de {filteredCitas.length} citas
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Pagina {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
