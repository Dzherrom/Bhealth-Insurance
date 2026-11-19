'use client';

import { useCallback, useEffect, useState } from 'react';
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
import {
  AlertTriangle,
  Check,
  ChevronsUpDown,
  Download,
  FileText,
  Loader2,
  Plus,
  Search,
  ShieldAlert,
  SquarePen,
} from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { siniestrosApi } from '@/lib/api';
import type {
  Siniestro,
  SiniestroAdjunto,
  SiniestroCausa,
  SiniestroEstado,
  SiniestroHistorial,
  SiniestroPolizaOption,
  SiniestroTipo,
} from '@/types';
import { useToast } from '@/hooks/use-toast';

const PAGE_SIZE = 25;

const ESTADOS: Array<{ value: SiniestroEstado; label: string }> = [
  { value: 'RECIBIDO', label: 'Recibido' },
  { value: 'EN_REVISION', label: 'En revisión' },
  { value: 'ENVIADO_A_ASEGURADORA', label: 'Enviado a aseguradora' },
  { value: 'EN_SEGUIMIENTO', label: 'En seguimiento' },
  { value: 'RESUELTO', label: 'Resuelto' },
  { value: 'RECHAZADO', label: 'Rechazado' },
  { value: 'CERRADO', label: 'Cerrado' },
];

const TIPOS: Array<{ value: SiniestroTipo; label: string }> = [
  { value: 'HOGAR', label: 'Hogar' },
  { value: 'AUTO', label: 'Auto' },
  { value: 'RESPONSABILIDAD_CIVIL', label: 'Responsabilidad civil' },
  { value: 'OTRO', label: 'Otro' },
];

const CAUSAS: Array<{ value: SiniestroCausa; label: string }> = [
  { value: 'INCENDIO', label: 'Incendio' },
  { value: 'AGUA', label: 'Daño por agua o tuberías' },
  { value: 'ROBO', label: 'Robo' },
  { value: 'VANDALISMO', label: 'Vandalismo' },
  { value: 'TORMENTA_GRANIZO', label: 'Tormenta o granizo' },
  { value: 'COLISION', label: 'Colisión' },
  { value: 'ROBO_VEHICULO', label: 'Robo de vehículo' },
  { value: 'RESPONSABILIDAD_CIVIL', label: 'Responsabilidad civil' },
  { value: 'OTRO', label: 'Otro' },
];

const ESTADO_BADGE: Record<SiniestroEstado, string> = {
  RECIBIDO: 'border-blue-200 bg-blue-100 text-blue-700',
  EN_REVISION: 'border-amber-200 bg-amber-100 text-amber-700',
  ENVIADO_A_ASEGURADORA: 'border-violet-200 bg-violet-100 text-violet-700',
  EN_SEGUIMIENTO: 'border-cyan-200 bg-cyan-100 text-cyan-700',
  RESUELTO: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  RECHAZADO: 'border-red-200 bg-red-100 text-red-700',
  CERRADO: 'border-slate-200 bg-slate-100 text-slate-700',
};

interface SiniestroForm {
  poliza: number | null;
  cliente: number | null;
  tipo: SiniestroTipo;
  causa: SiniestroCausa;
  fecha_evento: string;
  lugar_evento: string;
  descripcion: string;
  monto_estimado: string;
  numero_reclamo_aseguradora: string;
  contacto_aseguradora: string;
  estado: SiniestroEstado;
}

const initialForm: SiniestroForm = {
  poliza: null,
  cliente: null,
  tipo: 'HOGAR',
  causa: 'OTRO',
  fecha_evento: '',
  lugar_evento: '',
  descripcion: '',
  monto_estimado: '',
  numero_reclamo_aseguradora: '',
  contacto_aseguradora: '',
  estado: 'RECIBIDO',
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
};

const getErrorDescription = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'Error inesperado.';
  return /HTTP 500/.test(message)
    ? 'El backend devolvió un error interno. Revisa sus logs y confirma que las migraciones del módulo estén aplicadas.'
    : message;
};

const toDatetimeLocal = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
};

export default function SiniestrosPage() {
  const { toast } = useToast();
  const [siniestros, setSiniestros] = useState<Siniestro[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState<{ total: number; por_estado: Record<string, number> }>({
    total: 0,
    por_estado: {},
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<'TODOS' | SiniestroEstado>('TODOS');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSiniestro, setEditingSiniestro] = useState<Siniestro | null>(null);
  const [form, setForm] = useState<SiniestroForm>(initialForm);
  const [policySearch, setPolicySearch] = useState('');
  const [policyOptions, setPolicyOptions] = useState<SiniestroPolizaOption[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<SiniestroPolizaOption | null>(null);
  const [isPolicyPickerOpen, setIsPolicyPickerOpen] = useState(false);
  const [isPolicySearching, setIsPolicySearching] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [history, setHistory] = useState<SiniestroHistorial[]>([]);
  const [attachments, setAttachments] = useState<SiniestroAdjunto[]>([]);

  const loadSiniestros = useCallback(async () => {
    setIsLoading(true);
    try {
      const page = await siniestrosApi.listPaginated({
        page: currentPage,
        page_size: PAGE_SIZE,
        search: debouncedSearch,
        estado: estadoFilter === 'TODOS' ? undefined : estadoFilter,
      });
      setSiniestros(page.results);
      setTotalCount(page.count);
    } catch (error) {
      console.error(error);
      setSiniestros([]);
      setTotalCount(0);
      toast({
        title: 'No se pudieron cargar los siniestros',
        description: getErrorDescription(error),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, estadoFilter, toast]);

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await siniestrosApi.resumen());
    } catch (error) {
      console.error(error);
      toast({ title: 'No se pudo cargar el resumen de siniestros', variant: 'destructive' });
    }
  }, [toast]);

  useEffect(() => {
    void loadSiniestros();
  }, [loadSiniestros]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const query = policySearch.trim();
    if (!isDialogOpen || query.length < 2) {
      setPolicyOptions([]);
      setIsPolicySearching(false);
      return;
    }

    let active = true;
    setIsPolicySearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const options = await siniestrosApi.buscarPolizas(query);
        if (!active) return;
        setPolicyOptions(options);
        const selected = options.find((policy) => policy.id === form.poliza);
        if (selected) setSelectedPolicy(selected);
      } catch (error) {
        if (!active) return;
        console.error(error);
        setPolicyOptions([]);
        toast({ title: 'No se pudieron buscar pólizas de hogar o auto', variant: 'destructive' });
      } finally {
        if (active) setIsPolicySearching(false);
      }
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [form.poliza, isDialogOpen, policySearch, toast]);

  useEffect(() => {
    if (!isDialogOpen || !editingSiniestro?.id) {
      setHistory([]);
      setAttachments([]);
      return;
    }

    let active = true;
    Promise.all([
      siniestrosApi.listHistorial(editingSiniestro.id),
      siniestrosApi.listAdjuntos(editingSiniestro.id),
    ])
      .then(([historyItems, attachmentItems]) => {
        if (!active) return;
        setHistory(historyItems);
        setAttachments(attachmentItems);
      })
      .catch((error) => {
        if (!active) return;
        console.error(error);
        toast({ title: 'No se pudo cargar el historial o las evidencias', variant: 'destructive' });
      });
    return () => {
      active = false;
    };
  }, [editingSiniestro, isDialogOpen, toast]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const resetForm = () => {
    setEditingSiniestro(null);
    setForm(initialForm);
    setPolicySearch('');
    setPolicyOptions([]);
    setSelectedPolicy(null);
    setSelectedFiles([]);
    setIsPolicyPickerOpen(false);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (siniestro: Siniestro) => {
    setEditingSiniestro(siniestro);
    setForm({
      poliza: siniestro.poliza,
      cliente: siniestro.cliente,
      tipo: siniestro.tipo,
      causa: siniestro.causa,
      fecha_evento: toDatetimeLocal(siniestro.fecha_evento),
      lugar_evento: siniestro.lugar_evento,
      descripcion: siniestro.descripcion,
      monto_estimado: siniestro.monto_estimado || '',
      numero_reclamo_aseguradora: siniestro.numero_reclamo_aseguradora || '',
      contacto_aseguradora: siniestro.contacto_aseguradora || '',
      estado: siniestro.estado,
    });
    setPolicySearch(siniestro.poliza_codigo);
    setPolicyOptions([]);
    setSelectedPolicy(null);
    setSelectedFiles([]);
    setIsDialogOpen(true);
  };

  const updateForm = <K extends keyof SiniestroForm>(key: K, value: SiniestroForm[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const saveSiniestro = async () => {
    if ((!editingSiniestro && !selectedPolicy) || !form.poliza || !form.cliente) {
      toast({ title: 'Selecciona la póliza P&C y el cliente afectado', variant: 'destructive' });
      return;
    }
    if (!form.fecha_evento || !form.lugar_evento.trim() || !form.descripcion.trim()) {
      toast({ title: 'Completa la fecha, el lugar y la descripción del evento', variant: 'destructive' });
      return;
    }

    const payload = {
      poliza: form.poliza,
      cliente: form.cliente,
      tipo: form.tipo,
      causa: form.causa,
      fecha_evento: form.fecha_evento.length === 16 ? `${form.fecha_evento}:00` : form.fecha_evento,
      lugar_evento: form.lugar_evento.trim(),
      descripcion: form.descripcion.trim(),
      monto_estimado: form.monto_estimado ? form.monto_estimado : null,
      numero_reclamo_aseguradora: form.numero_reclamo_aseguradora.trim(),
      contacto_aseguradora: form.contacto_aseguradora.trim(),
      estado: form.estado,
    };

    setIsSaving(true);
    try {
      let saved: Siniestro;
      if (editingSiniestro?.id) {
        saved = await siniestrosApi.patch(editingSiniestro.id, payload);
      } else {
        saved = await siniestrosApi.create(payload);
      }

      let uploadFailed = false;
      if (selectedFiles.length && saved.id) {
        const uploads = await Promise.allSettled(
          selectedFiles.map((file) => siniestrosApi.subirAdjunto(saved.id!, file))
        );
        uploadFailed = uploads.some((result) => result.status === 'rejected');
        uploads.forEach((result) => {
          if (result.status === 'rejected') console.error(result.reason);
        });
      }

      toast({
        title: uploadFailed
          ? 'Siniestro guardado; no se pudieron subir todas las evidencias'
          : editingSiniestro
            ? 'Siniestro actualizado'
            : 'Siniestro registrado',
        variant: uploadFailed ? 'destructive' : 'default',
      });
      setIsDialogOpen(false);
      resetForm();
      await Promise.all([loadSiniestros(), loadSummary()]);
    } catch (error) {
      console.error(error);
      toast({
        title: 'No se pudo guardar el siniestro',
        description: getErrorDescription(error),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const downloadAttachment = async (attachment: SiniestroAdjunto) => {
    if (!attachment.id) return;
    try {
      const blob = await siniestrosApi.descargarAdjunto(attachment.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = attachment.nombre;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast({ title: 'No se pudo descargar la evidencia', variant: 'destructive' });
    }
  };

  return (
    <div className="app-page space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-600" />
            <h1 className="text-3xl font-bold tracking-tight">Siniestros</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Reportes asociados únicamente a pólizas Property &amp; Casualty (hogar y auto).
          </p>
        </div>
        <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Reportar siniestro
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total" value={summary.total} />
        <SummaryCard title="Recibidos" value={summary.por_estado.RECIBIDO || 0} color="text-blue-600" />
        <SummaryCard title="En revisión" value={summary.por_estado.EN_REVISION || 0} color="text-amber-600" />
        <SummaryCard title="En seguimiento" value={summary.por_estado.EN_SEGUIMIENTO || 0} color="text-cyan-600" />
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
                placeholder="Buscar por número, póliza, cliente o descripción..."
              />
            </div>
            <Select
              value={estadoFilter}
              onValueChange={(value) => {
                setEstadoFilter(value as 'TODOS' | SiniestroEstado);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los estados</SelectItem>
                {ESTADOS.map((estado) => (
                  <SelectItem key={estado.value} value={estado.value}>{estado.label}</SelectItem>
                ))}
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
                <TableHead className="pl-6">Reporte</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Póliza</TableHead>
                <TableHead>Cliente afectado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="pr-6 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading && siniestros.length === 0 && (
                <TableRow>
                  <TableCell className="h-24 text-center text-muted-foreground" colSpan={6}>
                    No hay siniestros para los filtros seleccionados.
                  </TableCell>
                </TableRow>
              )}
              {siniestros.map((siniestro) => (
                <TableRow key={siniestro.id}>
                  <TableCell className="pl-6">
                    <div className="font-medium">{siniestro.numero_siniestro}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(siniestro.fecha_reporte)}</div>
                  </TableCell>
                  <TableCell>
                    <div>{siniestro.tipo_display}</div>
                    <div className="text-xs text-muted-foreground">{siniestro.causa_display}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(siniestro.fecha_evento)}</div>
                  </TableCell>
                  <TableCell>
                    <Link href={`/crm/polizas/${siniestro.poliza}`} className="text-blue-600 hover:underline">
                      {siniestro.poliza_codigo}
                    </Link>
                  </TableCell>
                  <TableCell>{siniestro.cliente_nombre}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={ESTADO_BADGE[siniestro.estado]}>
                      {siniestro.estado_display}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(siniestro)}>
                      <SquarePen className="mr-2 h-3.5 w-3.5" />
                      Gestionar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalCount > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t px-6 py-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, totalCount)} de {totalCount} siniestros
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)}>
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingSiniestro ? `Gestionar ${editingSiniestro.numero_siniestro}` : 'Reportar siniestro'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Póliza Property &amp; Casualty</Label>
              <Popover open={isPolicyPickerOpen} onOpenChange={setIsPolicyPickerOpen} modal>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" role="combobox" aria-expanded={isPolicyPickerOpen} disabled={Boolean(editingSiniestro)} className="w-full justify-between font-normal">
                    <span className="truncate text-left">
                      {selectedPolicy
                        ? `${selectedPolicy.id_mercado} · ${selectedPolicy.tipo_producto_nombre}`
                        : editingSiniestro
                          ? `${editingSiniestro.poliza_codigo} · ${editingSiniestro.cliente_nombre}`
                          : 'Selecciona una póliza de hogar o auto'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="z-[100] w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command shouldFilter={false} className="overflow-hidden">
                    <CommandInput
                      placeholder="Buscar por cliente, plan o código de póliza..."
                      value={policySearch}
                      onValueChange={(value) => {
                        setPolicySearch(value);
                        setSelectedPolicy(null);
                        updateForm('poliza', null);
                        updateForm('cliente', null);
                      }}
                    />
                    <CommandList>
                      {isPolicySearching ? (
                        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Buscando pólizas P&amp;C...
                        </div>
                      ) : policySearch.trim().length < 2 ? (
                        <CommandEmpty>Escribe al menos 2 caracteres para buscar.</CommandEmpty>
                      ) : policyOptions.length === 0 ? (
                        <CommandEmpty>No hay pólizas de hogar o auto asociadas a ese cliente.</CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {policyOptions.map((policy) => (
                            <CommandItem
                              key={policy.id}
                              value={String(policy.id)}
                              onSelect={() => {
                                setSelectedPolicy(policy);
                                updateForm('poliza', policy.id);
                                updateForm('cliente', null);
                                setPolicySearch(policy.id_mercado);
                                setIsPolicyPickerOpen(false);
                              }}
                            >
                              <Check className={`mr-2 h-4 w-4 ${selectedPolicy?.id === policy.id ? 'opacity-100' : 'opacity-0'}`} />
                              <span className="truncate">
                                {policy.clientes.map((cliente) => cliente.nombre).join(', ')} · {policy.id_mercado} · {policy.plan_nombre || 'Sin plan'}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">La búsqueda solo devuelve pólizas Property &amp; Casualty no archivadas y vinculadas a un cliente.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="siniestro-cliente">Cliente afectado en la póliza</Label>
              <Select
                value={form.cliente ? String(form.cliente) : ''}
                onValueChange={(value) => updateForm('cliente', Number(value))}
                disabled={!selectedPolicy || Boolean(editingSiniestro)}
              >
                <SelectTrigger id="siniestro-cliente">
                  <SelectValue placeholder="Selecciona el cliente afectado" />
                </SelectTrigger>
                <SelectContent>
                  {editingSiniestro && !selectedPolicy && form.cliente && (
                    <SelectItem value={String(form.cliente)}>{editingSiniestro.cliente_nombre}</SelectItem>
                  )}
                  {selectedPolicy?.clientes.map((cliente) => (
                    <SelectItem key={cliente.cliente_id} value={String(cliente.cliente_id)}>
                      {cliente.nombre}{cliente.es_solicitante_principal ? ' · Titular' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="siniestro-tipo">Tipo de evento</Label>
              <Select value={form.tipo} onValueChange={(value) => updateForm('tipo', value as SiniestroTipo)}>
                <SelectTrigger id="siniestro-tipo"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map((tipo) => <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>)}
                </SelectContent>
              </Select>

              <div className="space-y-2">
                <Label htmlFor="siniestro-causa">Causa del evento</Label>
                <Select value={form.causa} onValueChange={(value) => updateForm('causa', value as SiniestroCausa)}>
                  <SelectTrigger id="siniestro-causa"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CAUSAS.map((causa) => <SelectItem key={causa.value} value={causa.value}>{causa.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="siniestro-fecha">Fecha y hora del evento</Label>
              <Input id="siniestro-fecha" type="datetime-local" value={form.fecha_evento} onChange={(event) => updateForm('fecha_evento', event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siniestro-lugar">Lugar del evento</Label>
              <Input id="siniestro-lugar" value={form.lugar_evento} onChange={(event) => updateForm('lugar_evento', event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siniestro-monto">Pérdida estimada (opcional)</Label>
              <Input id="siniestro-monto" type="number" min="0" step="0.01" value={form.monto_estimado} onChange={(event) => updateForm('monto_estimado', event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siniestro-reclamo">Número de reclamo de aseguradora (opcional)</Label>
              <Input id="siniestro-reclamo" value={form.numero_reclamo_aseguradora} onChange={(event) => updateForm('numero_reclamo_aseguradora', event.target.value)} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="siniestro-contacto">Contacto de la aseguradora (opcional)</Label>
              <Input id="siniestro-contacto" value={form.contacto_aseguradora} onChange={(event) => updateForm('contacto_aseguradora', event.target.value)} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="siniestro-descripcion">Descripción de lo ocurrido</Label>
              <Textarea id="siniestro-descripcion" rows={4} value={form.descripcion} onChange={(event) => updateForm('descripcion', event.target.value)} />
            </div>

            {editingSiniestro && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="siniestro-estado">Estado del expediente</Label>
                <Select value={form.estado} onValueChange={(value) => updateForm('estado', value as SiniestroEstado)}>
                  <SelectTrigger id="siniestro-estado"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ESTADOS.map((estado) => <SelectItem key={estado.value} value={estado.value}>{estado.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="siniestro-evidencia">Evidencias (fotos, facturas o documentos)</Label>
              <Input
                id="siniestro-evidencia"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))}
              />
              {selectedFiles.length > 0 && (
                <p className="text-xs text-muted-foreground">{selectedFiles.length} archivo(s) listos para adjuntar al guardar.</p>
              )}
            </div>

            {editingSiniestro && (
              <>
                <div className="space-y-2 md:col-span-2">
                  <Label>Evidencias registradas</Label>
                  {attachments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay evidencias adjuntas.</p>
                  ) : (
                    <div className="space-y-2">
                      {attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between gap-3 rounded-md border p-2 text-sm">
                          <span className="flex min-w-0 items-center gap-2 truncate"><FileText className="h-4 w-4 shrink-0" />{attachment.nombre}</span>
                          <Button type="button" size="sm" variant="outline" onClick={() => void downloadAttachment(attachment)}>
                            <Download className="mr-2 h-4 w-4" />Descargar
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Historial de seguimiento</Label>
                  {history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aún no hay movimientos registrados.</p>
                  ) : (
                    <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-3">
                      {history.map((item) => (
                        <div key={item.id} className="border-b pb-2 last:border-b-0 last:pb-0">
                          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                            <span>{item.accion.replaceAll('_', ' ')}</span>
                            <span>{formatDate(item.fecha)}</span>
                          </div>
                          <p className="mt-1 text-sm">{item.detalles}</p>
                          {item.usuario_username && <p className="text-xs text-muted-foreground">Por {item.usuario_username}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 md:col-span-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>El registro documenta y da seguimiento al reporte. No determina cobertura ni aprobación; esa decisión corresponde a la aseguradora y a las condiciones de la póliza.</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button
              type="button"
              onClick={saveSiniestro}
              disabled={isSaving || (!editingSiniestro && !selectedPolicy) || !form.cliente}
            >
              {isSaving ? 'Guardando...' : editingSiniestro ? 'Guardar cambios' : 'Registrar siniestro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ title, value, color = 'text-slate-900' }: { title: string; value: number; color?: string }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent><p className={`text-3xl font-bold ${color}`}>{value}</p></CardContent>
    </Card>
  );
}
