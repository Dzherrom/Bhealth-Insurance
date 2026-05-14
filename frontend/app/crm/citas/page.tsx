'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { CalendarDays, Clock3, FileText, MapPin, Search, SquarePen, User2, Plus } from 'lucide-react';
import { citasApi, polizasApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type CitaApi = Awaited<ReturnType<typeof citasApi.list>>[number];
type PolizaApi = Awaited<ReturnType<typeof polizasApi.list>>[number];

type EstadoCita = 'PROGRAMADA' | 'COMPLETADA' | 'CANCELADA' | 'NO_ASISTIO';

type AppointmentFormValues = {
  polizaCodigo: string;
  fecha: string;
  hora: string;
  proveedor: string;
  lugar: string;
  estado: EstadoCita;
  motivo: string;
  notas: string;
};

const ITEMS_PER_PAGE = 50;

const MOCK_CITAS: CitaApi[] = [
  {
    id: 1,
    poliza: 34,
    poliza_codigo: 'MKT-DEMO-034',
    cliente_nombre: null,
    fecha_hora: '2026-05-13T03:00:00',
    proveedor: 'Pepito',
    lugar: 'Florida',
    estado: 'PROGRAMADA',
  },
  {
    id: 2,
    poliza: 1,
    poliza_codigo: 'MKT-DEMO-001',
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
  const { toast } = useToast();
  const [citas, setCitas] = useState<CitaApi[]>([]);
  const [polizas, setPolizas] = useState<PolizaApi[]>([]);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<'ALL' | EstadoCita>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCitaId, setEditingCitaId] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<AppointmentFormValues>({
    polizaCodigo: '',
    fecha: '',
    hora: '',
    proveedor: '',
    lugar: '',
    estado: 'PROGRAMADA',
    motivo: '',
    notas: '',
  });

  const polizaByCodigo = useMemo(
    () => new Map(polizas.map((poliza) => [poliza.id_mercado, poliza])),
    [polizas]
  );

  const selectedPoliza = useMemo(
    () => polizaByCodigo.get(formValues.polizaCodigo.trim()),
    [formValues.polizaCodigo, polizaByCodigo]
  );

  const resetForm = () => {
    setEditingCitaId(null);
    setFormValues({
      polizaCodigo: '',
      fecha: '',
      hora: '',
      proveedor: '',
      lugar: '',
      estado: 'PROGRAMADA',
      motivo: '',
      notas: '',
    });
  };

  const loadCitas = async () => {
    setIsLoading(true);
    try {
      const [data, polizasData] = await Promise.all([citasApi.list(), polizasApi.list()]);
      setPolizas(polizasData);
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
    () =>
      citas.map((cita) => ({
        ...cita,
        estado: toEstadoCita(cita.estado),
        poliza_codigo: cita.poliza_codigo || polizas.find((poliza) => poliza.id === cita.poliza)?.id_mercado || `#${cita.poliza}`,
      })),
    [citas, polizas]
  );

  const filteredCitas = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return citasConEstado.filter((cita) => {
      const statusOk = estadoFilter === 'ALL' || cita.estado === estadoFilter;
      if (!statusOk) return false;
      if (!searchTerm) return true;

      const polizaText = `${cita.poliza_codigo || `#${cita.poliza}`}`;
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

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (cita: CitaApi) => {
    const citaDate = new Date(cita.fecha_hora);
    const fecha = Number.isNaN(citaDate.getTime()) ? '' : citaDate.toISOString().split('T')[0];
    const hora = Number.isNaN(citaDate.getTime())
      ? ''
      : citaDate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', hour12: false });

    setEditingCitaId(cita.id ?? null);
    setFormValues({
      polizaCodigo: cita.poliza_codigo || polizas.find((poliza) => poliza.id === cita.poliza)?.id_mercado || '',
      fecha,
      hora,
      proveedor: cita.proveedor,
      lugar: cita.lugar,
      estado: toEstadoCita(cita.estado),
      motivo: cita.motivo || '',
      notas: cita.notas || '',
    });
    setIsDialogOpen(true);
  };

  const handleFormChange = <K extends keyof AppointmentFormValues>(field: K, value: AppointmentFormValues[K]) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const saveCita = async () => {
    const selectedPoliza = polizaByCodigo.get(formValues.polizaCodigo.trim());
    if (!selectedPoliza) {
      toast({ title: 'Selecciona un codigo de poliza valido', variant: 'destructive' });
      return;
    }

    if (!formValues.fecha || !formValues.hora || !formValues.proveedor.trim() || !formValues.lugar.trim()) {
      toast({ title: 'Completa los campos requeridos', variant: 'destructive' });
      return;
    }

    const clientePrincipal = selectedPoliza.clientes_info?.find((cliente) => cliente.es_solicitante_principal)?.cliente;
    const fecha_hora = `${formValues.fecha}T${formValues.hora}:00`;

    const payload = {
      poliza: selectedPoliza.id,
      cliente: clientePrincipal || null,
      fecha_hora,
      proveedor: formValues.proveedor.trim(),
      lugar: formValues.lugar.trim(),
      estado: formValues.estado,
      motivo: formValues.motivo.trim(),
      notas: formValues.notas.trim(),
    };

    setIsSaving(true);
    try {
      if (editingCitaId) {
        await citasApi.patch(editingCitaId, payload);
        toast({ title: 'Cita actualizada' });
      } else {
        await citasApi.create(payload as never);
        toast({ title: 'Cita creada' });
      }

      setIsDialogOpen(false);
      resetForm();
      await loadCitas();
    } catch (error) {
      console.error(error);
      toast({ title: 'No se pudo guardar la cita', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

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

        <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={openCreateDialog}>
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
                    <Link
                      href={`/crm/polizas/${cita.poliza}`}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      {cita.poliza_codigo || `#${cita.poliza}`}
                    </Link>
                  </TableCell>

                  <TableCell>{cita.cliente_nombre || '--'}</TableCell>

                  <TableCell>
                    <Badge variant="outline" className={ESTADO_BADGE_CLASS[cita.estado]}>
                      {ESTADO_LABELS[cita.estado]}
                    </Badge>
                  </TableCell>

                  <TableCell className="pr-6 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(cita)}
                      >
                        <SquarePen className="mr-2 h-3.5 w-3.5" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        disabled={cita.estado !== 'PROGRAMADA'}
                        onClick={() => cancelCita(cita.id!)}
                      >
                        Cancelar
                      </Button>
                    </div>
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

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCitaId ? 'Editar cita' : 'Nueva cita'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="polizaCodigo">Póliza</Label>
              <Select value={formValues.polizaCodigo} onValueChange={(value) => handleFormChange('polizaCodigo', value)}>
                <SelectTrigger id="polizaCodigo">
                  <SelectValue placeholder="Selecciona una póliza existente" />
                </SelectTrigger>
                <SelectContent>
                  {polizas.map((poliza) => (
                    <SelectItem key={poliza.id} value={poliza.id_mercado}>
                      {poliza.id_mercado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPoliza && (
                <div className="rounded-md border bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
                  <div>{selectedPoliza.id_mercado}</div>
                  <div>
                    {(() => {
                      const clientePrincipal = selectedPoliza.clientes_info?.find((cliente) => cliente.es_solicitante_principal)?.cliente_details;
                      if (!clientePrincipal) return 'Cliente no disponible';
                      return `${clientePrincipal.primer_nombre} ${clientePrincipal.apellido_paterno}`.trim();
                    })()}
                    {selectedPoliza.agente_nombre ? ` · ${selectedPoliza.agente_nombre}` : ''}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input id="fecha" type="date" value={formValues.fecha} onChange={(event) => handleFormChange('fecha', event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora">Hora</Label>
              <Input id="hora" type="time" value={formValues.hora} onChange={(event) => handleFormChange('hora', event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proveedor">Proveedor</Label>
              <Input id="proveedor" value={formValues.proveedor} onChange={(event) => handleFormChange('proveedor', event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lugar">Lugar</Label>
              <Input id="lugar" value={formValues.lugar} onChange={(event) => handleFormChange('lugar', event.target.value)} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="estado">Estado</Label>
              <Select value={formValues.estado} onValueChange={(value) => handleFormChange('estado', value as EstadoCita)}>
                <SelectTrigger id="estado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROGRAMADA">Programada</SelectItem>
                  <SelectItem value="COMPLETADA">Completada</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                  <SelectItem value="NO_ASISTIO">No asistio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="motivo">Motivo</Label>
              <Textarea id="motivo" value={formValues.motivo} onChange={(event) => handleFormChange('motivo', event.target.value)} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea id="notas" value={formValues.notas} onChange={(event) => handleFormChange('notas', event.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={saveCita} disabled={isSaving}>{isSaving ? 'Guardando...' : editingCitaId ? 'Guardar cambios' : 'Crear cita'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
