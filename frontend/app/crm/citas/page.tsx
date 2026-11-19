'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { CalendarDays, Check, ChevronsUpDown, Clock3, FileText, Loader2, MapPin, Search, SquarePen, User2, Plus } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { citasApi, polizasApi, type CitaResumen } from '@/lib/api';
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
  costo: string;
  pacienteId: string;
  estado: EstadoCita;
  motivo: string;
  notas: string;
};

const ITEMS_PER_PAGE = 50;

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

const formatCurrency = (value?: string | number | null) => {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export default function CitasPage() {
  const { toast } = useToast();
  const [citas, setCitas] = useState<CitaApi[]>([]);
  const [citasCount, setCitasCount] = useState(0);
  const [resumen, setResumen] = useState<CitaResumen>({ total: 0, programadas: 0, completadas: 0, canceladas: 0 });
  const [policyOptions, setPolicyOptions] = useState<PolizaApi[]>([]);
  const [selectedPoliza, setSelectedPoliza] = useState<PolizaApi | null>(null);
  const [policySearch, setPolicySearch] = useState('');
  const [isPolicyPickerOpen, setIsPolicyPickerOpen] = useState(false);
  const [isPolicySearching, setIsPolicySearching] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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
    costo: '0',
    pacienteId: '',
    estado: 'PROGRAMADA',
    motivo: '',
    notas: '',
  });

  const resetForm = () => {
    setEditingCitaId(null);
    setSelectedPoliza(null);
    setPolicyOptions([]);
    setFormValues({
      polizaCodigo: '',
      fecha: '',
      hora: '',
      proveedor: '',
      lugar: '',
      costo: '0',
      pacienteId: '',
      estado: 'PROGRAMADA',
      motivo: '',
      notas: '',
    });
    setPolicySearch('');
    setIsPolicyPickerOpen(false);
  };

  const loadCitas = useCallback(async () => {
    setIsLoading(true);
    try {
      const page = await citasApi.listPaginated({
        page: currentPage,
        page_size: ITEMS_PER_PAGE,
        search: debouncedSearch,
        estado: estadoFilter === 'ALL' ? undefined : estadoFilter,
      });
      setCitas(page.results);
      setCitasCount(page.count);
    } catch (error) {
      console.error(error);
      setCitas([]);
      setCitasCount(0);
      toast({ title: 'No se pudieron cargar las citas', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, estadoFilter, toast]);

  const loadResumen = useCallback(async () => {
    try {
      setResumen(await citasApi.resumen());
    } catch (error) {
      console.error(error);
      toast({ title: 'No se pudo cargar el resumen de citas', variant: 'destructive' });
    }
  }, [toast]);

  useEffect(() => {
    void loadCitas();
  }, [loadCitas]);

  useEffect(() => {
    void loadResumen();
  }, [loadResumen]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!isDialogOpen || policySearch.trim().length < 2) {
      setPolicyOptions([]);
      setIsPolicySearching(false);
      return;
    }

    let active = true;
    setIsPolicySearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const page = await polizasApi.listPaginated({
          page: 1,
          page_size: 30,
          search: policySearch.trim(),
        });
        if (!active) return;
        setPolicyOptions(page.results);
        const selected = page.results.find((policy) => String(policy.id) === formValues.polizaCodigo);
        if (selected) {
          setSelectedPoliza(selected);
          setFormValues((previous) => ({
            ...previous,
            pacienteId: previous.pacienteId || String(
              selected.cliente_principal_id
              ?? selected.clientes_info?.find((member) => member.es_solicitante_principal)?.cliente
              ?? '',
            ),
          }));
        }
      } catch (error) {
        if (!active) return;
        console.error(error);
        setPolicyOptions([]);
        toast({ title: 'No se pudieron buscar pólizas', variant: 'destructive' });
      } finally {
        if (active) setIsPolicySearching(false);
      }
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [formValues.polizaCodigo, isDialogOpen, policySearch, toast]);

  const citasConEstado = useMemo(
    () =>
      citas.map((cita) => ({
        ...cita,
        estado: toEstadoCita(cita.estado),
        poliza_codigo: cita.poliza_codigo || `#${cita.poliza}`,
      })),
    [citas]
  );

  const totalPages = Math.max(1, Math.ceil(citasCount / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedCitas = citasConEstado;

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
    setSelectedPoliza(null);
    setPolicyOptions([]);
    setFormValues({
      polizaCodigo: String(cita.poliza),
      fecha,
      hora,
      proveedor: cita.proveedor,
      lugar: cita.lugar,
      costo: String(cita.costo ?? '0'),
      pacienteId: cita.cliente ? String(cita.cliente) : '',
      estado: toEstadoCita(cita.estado),
      motivo: cita.motivo || '',
      notas: cita.notas || '',
    });
    setPolicySearch(cita.poliza_codigo || '');
    setIsDialogOpen(true);
  };

  const handleFormChange = <K extends keyof AppointmentFormValues>(field: K, value: AppointmentFormValues[K]) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const saveCita = async () => {
    if (!selectedPoliza || String(selectedPoliza.id) !== formValues.polizaCodigo) {
      toast({ title: 'Selecciona un codigo de poliza valido', variant: 'destructive' });
      return;
    }

    if (!formValues.pacienteId) {
      toast({ title: 'Selecciona el paciente de la póliza', variant: 'destructive' });
      return;
    }

    if (!formValues.fecha || !formValues.hora || !formValues.proveedor.trim() || !formValues.lugar.trim()) {
      toast({ title: 'Completa los campos requeridos', variant: 'destructive' });
      return;
    }

    const fecha_hora = `${formValues.fecha}T${formValues.hora}:00`;

    const payload = {
      poliza: selectedPoliza.id,
      cliente: Number(formValues.pacienteId),
      fecha_hora,
      proveedor: formValues.proveedor.trim(),
      lugar: formValues.lugar.trim(),
      costo: formValues.costo ? Number(formValues.costo) : 0,
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
      await Promise.all([loadCitas(), loadResumen()]);
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
      await Promise.all([loadCitas(), loadResumen()]);
    } catch (error) {
      console.error(error);
      setCitas((prev) =>
        prev.map((cita) => (cita.id === citaId ? { ...cita, estado: current.estado } : cita))
      );
      toast({ title: 'No se pudo cancelar la cita', variant: 'destructive' });
    }
  };

  return (
    <div className="app-page space-y-6">
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
            <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{resumen.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400">Programadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{resumen.programadas}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400">Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">{resumen.completadas}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400">Canceladas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{resumen.canceladas}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground dark:text-gray-400" />
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
                <TableHead>Costo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="pr-6 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading && paginatedCitas.length === 0 && (
                <TableRow>
                  <TableCell className="h-24 text-center text-muted-foreground dark:text-gray-400" colSpan={8}>
                    No hay citas para los filtros seleccionados.
                  </TableCell>
                </TableRow>
              )}

              {paginatedCitas.map((cita) => (
                <TableRow key={cita.id}>
                  <TableCell className="pl-6">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-2 font-medium">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground dark:text-gray-400" />
                        {formatDate(cita.fecha_hora)}
                      </span>
                      <span className="flex items-center gap-2 text-sm text-muted-foreground dark:text-gray-400">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatTime(cita.fecha_hora)}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="flex items-center gap-2">
                      <User2 className="h-3.5 w-3.5 text-muted-foreground dark:text-gray-400" />
                      {cita.proveedor}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground dark:text-gray-400" />
                      {cita.lugar}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Link
                      href={`/crm/polizas/${cita.poliza}`}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5 text-muted-foreground dark:text-gray-400" />
                      {cita.poliza_codigo || `#${cita.poliza}`}
                    </Link>
                  </TableCell>

                  <TableCell>{cita.cliente_nombre || '--'}</TableCell>
                  <TableCell>{formatCurrency(cita.costo)}</TableCell>

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

          {citasCount > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between border-t px-6 py-4">
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, citasCount)} de {citasCount} citas
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
                <span className="text-sm text-muted-foreground dark:text-gray-400">
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
        <DialogContent className="sm:max-w-2xl flex max-h-[90vh] flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{editingCitaId ? 'Editar cita' : 'Nueva cita'}</DialogTitle>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto px-1 py-2 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="polizaCodigo">Póliza</Label>
              <Popover open={isPolicyPickerOpen} onOpenChange={setIsPolicyPickerOpen} modal>
                <PopoverTrigger asChild>
                  <Button
                    id="polizaCodigo"
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={isPolicyPickerOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate text-left">
                      {selectedPoliza
                        ? `${selectedPoliza.cliente_principal || 'Sin titular'} · ${selectedPoliza.id_mercado}`
                        : 'Selecciona una póliza existente'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[100]" align="start">
                  <Command shouldFilter={false} className="overflow-hidden">
                    <CommandInput
                      placeholder="Buscar por cliente, agente, plan o código de póliza..."
                      value={policySearch}
                      onValueChange={(value) => {
                        setPolicySearch(value);
                        setSelectedPoliza(null);
                        handleFormChange('polizaCodigo', '');
                        handleFormChange('pacienteId', '');
                      }}
                    />
                    <CommandList>
                      {isPolicySearching ? (
                        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Buscando pólizas...
                        </div>
                      ) : policySearch.trim().length < 2 ? (
                        <CommandEmpty>Escribe al menos 2 caracteres para buscar.</CommandEmpty>
                      ) : policyOptions.length === 0 ? (
                        <CommandEmpty>No se encontraron pólizas.</CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {policyOptions.map((poliza) => (
                            <CommandItem
                              key={poliza.id}
                              value={String(poliza.id)}
                              onSelect={() => {
                                setSelectedPoliza(poliza);
                                handleFormChange('polizaCodigo', String(poliza.id));
                                handleFormChange(
                                  'pacienteId',
                                  String(poliza.cliente_principal_id
                                    ?? poliza.clientes_info?.find((member) => member.es_solicitante_principal)?.cliente
                                    ?? poliza.clientes_info?.[0]?.cliente
                                    ?? ''),
                                );
                                setPolicySearch(poliza.id_mercado);
                                setIsPolicyPickerOpen(false);
                              }}
                            >
                              <Check className={`mr-2 h-4 w-4 ${selectedPoliza?.id === poliza.id ? 'opacity-100' : 'opacity-0'}`} />
                              <span className="truncate">
                                {poliza.cliente_principal || 'Sin titular'} · {poliza.agente_nombre || 'Sin agente'} · {poliza.plan_nombre || 'Sin plan'} · {poliza.id_mercado}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedPoliza && (
                <div className="rounded-md border dark:border-[#334155] bg-slate-50 dark:bg-[#0f172a] px-3 py-2 text-xs text-muted-foreground dark:text-gray-400">
                  <div>{selectedPoliza.id_mercado}</div>
                  <div>
                    {selectedPoliza.clientes_info?.find((cliente) => cliente.es_solicitante_principal)?.cliente_nombre
                      || selectedPoliza.cliente_principal
                      || 'Cliente no disponible'}
                    {selectedPoliza.agente_nombre ? ` · ${selectedPoliza.agente_nombre}` : ''}
                  </div>
                  <div>{selectedPoliza.plan_nombre || 'Sin plan'}</div>
                </div>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="pacienteCita">Paciente</Label>
              <Select
                value={formValues.pacienteId}
                onValueChange={(value) => handleFormChange('pacienteId', value)}
                disabled={!selectedPoliza}
              >
                <SelectTrigger id="pacienteCita">
                  <SelectValue placeholder="Selecciona titular o dependiente" />
                </SelectTrigger>
                <SelectContent>
                  {selectedPoliza?.clientes_info?.map((member) => (
                    <SelectItem key={member.cliente} value={String(member.cliente)}>
                      {member.cliente_nombre}{member.es_solicitante_principal ? ' · Titular' : ` · ${member.relacion || 'Dependiente'}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <div className="space-y-2">
              <Label htmlFor="costoCita">Costo de la cita ($)</Label>
              <Input
                id="costoCita"
                type="number"
                min="0"
                step="0.01"
                value={formValues.costo}
                onChange={(event) => handleFormChange('costo', event.target.value)}
              />
            </div>

            <div className="space-y-2">
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

          <DialogFooter className="shrink-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={saveCita} disabled={isSaving || !selectedPoliza || !formValues.pacienteId}>{isSaving ? 'Guardando...' : editingCitaId ? 'Guardar cambios' : 'Crear cita'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
