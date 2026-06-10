'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Search, FileText, Download, Trash2, Copy, Eye, RefreshCw } from 'lucide-react';
import { consentRequestsApi, clientesApi, documentosApi, polizasApi, resolveApiMediaUrl } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const STATUS_OPTIONS = ['BORRADOR', 'ENVIADO', 'ABIERTO', 'FIRMADO', 'RECHAZADO', 'EXPIRADO', 'ERROR'] as const;

type ConsentStatus = typeof STATUS_OPTIONS[number];

type ConsentRequest = {
  id: number;
  poliza: number;
  cliente: number;
  status: ConsentStatus;
  signer_name: string;
  signer_email: string;
  signing_url?: string | null;
  provider_envelope_id?: string | null;
  documento_generado?: number | null;
  sent_at?: string | null;
  signed_at?: string | null;
  expires_at?: string | null;
  last_error?: string | null;
  metadata?: Record<string, any>;
  created_by_username?: string;
  cliente_nombre?: string;
};

type PolizaOption = { id: number; id_mercado: string; cliente?: string; proveedor?: string };
type ClienteOption = { id: number; nombre_completo: string; email?: string };
type DocumentoOption = { id: number; titulo: string; archivo?: string | null };

const emptyForm = {
  poliza: '',
  cliente: '',
  signer_name: '',
  signer_email: '',
  documento_generado: '',
  expires_at: '',
  signing_url: '',
  metadata: '{}',
};

export default function FormulariosDeFirmasPage() {
  const [forms, setForms] = useState<ConsentRequest[]>([]);
  const [polizas, setPolizas] = useState<PolizaOption[]>([]);
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ConsentStatus>('all');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<ConsentRequest | null>(null);
  const [statusValue, setStatusValue] = useState<ConsentStatus>('BORRADOR');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [formsRes, polizasRes, clientesRes, documentosRes] = await Promise.all([
        consentRequestsApi.list(),
        polizasApi.list(),
        clientesApi.list(),
        documentosApi.list(),
      ]);

      const rawForms = ((formsRes as any).results || formsRes || []) as ConsentRequest[];
      setForms(rawForms);
      setPolizas(((polizasRes as any).results || polizasRes || []).map((item: any) => ({
        id: item.id,
        id_mercado: item.id_mercado,
        cliente: item.cliente_principal || item.clientes_info?.[0]?.cliente_details?.primer_nombre,
        proveedor: item.agente_nombre,
      })));
      setClientes(((clientesRes as any).results || clientesRes || []).map((item: any) => ({
        id: item.id,
        nombre_completo: `${item.primer_nombre} ${item.apellido_paterno}`,
        email: item.email,
      })));
      setDocumentos(((documentosRes as any).results || documentosRes || []).map((item: any) => ({
        id: item.id,
        titulo: item.titulo || item.nombre || `Documento #${item.id}`,
        archivo: item.archivo,
      })));
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudieron cargar los formularios', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return forms.filter((item) => {
      const statusOk = statusFilter === 'all' || item.status === statusFilter;
      const matches = [item.signer_name, item.signer_email, item.cliente_nombre, item.created_by_username, String(item.id)]
        .join(' ')
        .toLowerCase()
        .includes(q);
      return statusOk && matches;
    });
  }, [forms, search, statusFilter]);

  const stats = useMemo(() => {
    return STATUS_OPTIONS.reduce<Record<string, number>>((acc, status) => {
      acc[status] = forms.filter((item) => item.status === status).length;
      return acc;
    }, { total: forms.length } as Record<string, number>);
  }, [forms]);

  const openDetails = (item: ConsentRequest) => {
    setSelected(item);
    setDetailsOpen(true);
  };

  const openStatusModal = (item: ConsentRequest) => {
    setSelected(item);
    setStatusValue(item.status);
    setStatusOpen(true);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setCreateOpen(true);
  };

  const createForm = async () => {
    if (!form.poliza || !form.cliente || !form.signer_name || !form.signer_email) {
      toast({ title: 'Error', description: 'Completa los campos obligatorios', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      await consentRequestsApi.create({
        poliza: Number(form.poliza),
        cliente: Number(form.cliente),
        signer_name: form.signer_name,
        signer_email: form.signer_email,
        documento_generado: form.documento_generado ? Number(form.documento_generado) : null,
        expires_at: form.expires_at || null,
        signing_url: form.signing_url || null,
        metadata: form.metadata ? JSON.parse(form.metadata) : {},
        status: 'BORRADOR',
      } as any);
      toast({ title: 'Formulario creado' });
      setCreateOpen(false);
      await loadAll();
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo crear el formulario', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await consentRequestsApi.patch(selected.id, { status: statusValue } as any);
      toast({ title: 'Estatus actualizado' });
      setStatusOpen(false);
      await loadAll();
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el estatus', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const duplicateForm = async (item: ConsentRequest) => {
    setSaving(true);
    try {
      await consentRequestsApi.create({
        poliza: item.poliza,
        cliente: item.cliente,
        signer_name: item.signer_name,
        signer_email: item.signer_email,
        documento_generado: item.documento_generado,
        expires_at: item.expires_at,
        signing_url: item.signing_url,
        metadata: item.metadata || {},
        status: 'BORRADOR',
      } as any);
      toast({ title: 'Formulario duplicado' });
      await loadAll();
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo duplicar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteForm = async (item: ConsentRequest) => {
    if (!window.confirm('¿Eliminar formulario?')) return;
    try {
      await consentRequestsApi.delete(item.id);
      toast({ title: 'Formulario eliminado' });
      await loadAll();
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    }
  };

  const downloadForm = (item: ConsentRequest) => {
    const doc = documentos.find((documento) => documento.id === item.documento_generado);
    if (doc?.archivo) {
      window.open(resolveApiMediaUrl(doc.archivo), '_blank', 'noopener,noreferrer');
      return;
    }
    if (item.signing_url) {
      window.open(item.signing_url, '_blank', 'noopener,noreferrer');
    } else {
      toast({ title: 'Sin archivo', description: 'Este formulario no tiene documento para descargar', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: ConsentStatus) => {
    switch (status) {
      case 'FIRMADO': return 'bg-emerald-100 text-emerald-800';
      case 'ENVIADO': return 'bg-blue-100 text-blue-800';
      case 'ABIERTO': return 'bg-amber-100 text-amber-800';
      case 'RECHAZADO': return 'bg-red-100 text-red-800';
      case 'EXPIRADO': return 'bg-gray-100 text-gray-800';
      case 'ERROR': return 'bg-rose-100 text-rose-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="app-page space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Formularios de firmas</h1>
          <p className="text-muted-foreground dark:text-gray-400">Gestiona formularios, estatus, descargas y duplicados.</p>
        </div>
        <Button onClick={openCreate} className="bg-blue-600 text-white hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Nuevo formulario
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription>Total</CardDescription><CardTitle>{stats.total}</CardTitle></CardHeader></Card>
        {STATUS_OPTIONS.map((status) => (
          <Card key={status}><CardHeader className="pb-2"><CardDescription>{status}</CardDescription><CardTitle>{stats[status] || 0}</CardTitle></CardHeader></Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground dark:text-gray-400" />
              <Input className="pl-10" placeholder="Buscar por nombre, correo o ID" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
              <SelectTrigger><SelectValue placeholder="Filtrar estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {STATUS_OPTIONS.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-[#0f172a] text-left text-xs uppercase text-muted-foreground dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Formulario</th>
                <th className="px-4 py-3">Poliza</th>
                <th className="px-4 py-3">Firmante</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Creado por</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const poliza = polizas.find((polizaItem) => polizaItem.id === item.poliza);
                return (
                  <tr key={item.id} className="border-t dark:border-[#334155]">
                    <td className="px-4 py-3">
                      <div className="font-medium flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground dark:text-gray-400" /> Formulario #{item.id}</div>
                      <div className="text-xs text-muted-foreground dark:text-gray-400">{item.cliente_nombre || 'Sin cliente'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{poliza?.id_mercado || `#${item.poliza}`}</div>
                      <div className="text-xs text-muted-foreground dark:text-gray-400">{poliza?.cliente || ''} {poliza?.proveedor ? `· ${poliza.proveedor}` : ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.signer_name}</div>
                      <div className="text-xs text-muted-foreground dark:text-gray-400">{item.signer_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getStatusBadge(item.status)} variant="outline">{item.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground dark:text-gray-400">{item.created_by_username || 'Sistema'}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDetails(item)}><Eye className="mr-2 h-4 w-4" /> Ver detalles</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadForm(item)}><Download className="mr-2 h-4 w-4" /> Descargar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openStatusModal(item)}><RefreshCw className="mr-2 h-4 w-4" /> Cambiar estatus</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateForm(item)}><Copy className="mr-2 h-4 w-4" /> Duplicar formulario</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteForm(item)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Eliminar formulario</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Nuevo formulario de firma</DialogTitle></DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Póliza</Label>
              <Select value={form.poliza} onValueChange={(value) => setForm((prev) => ({ ...prev, poliza: value }))}>
                <SelectTrigger><SelectValue placeholder="Selecciona póliza" /></SelectTrigger>
                <SelectContent>
                  {polizas.map((poliza) => <SelectItem key={poliza.id} value={String(poliza.id)}>{poliza.id_mercado} · {poliza.cliente || 'Sin cliente'} · {poliza.proveedor || 'Sin proveedor'}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Cliente</Label>
              <Select value={form.cliente} onValueChange={(value) => setForm((prev) => ({ ...prev, cliente: value }))}>
                <SelectTrigger><SelectValue placeholder="Selecciona cliente" /></SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => <SelectItem key={cliente.id} value={String(cliente.id)}>{cliente.nombre_completo} · {cliente.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Firmante</Label><Input value={form.signer_name} onChange={(e) => setForm((prev) => ({ ...prev, signer_name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Correo del firmante</Label><Input type="email" value={form.signer_email} onChange={(e) => setForm((prev) => ({ ...prev, signer_email: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Documento</Label><Select value={form.documento_generado} onValueChange={(value) => setForm((prev) => ({ ...prev, documento_generado: value }))}><SelectTrigger><SelectValue placeholder="Documento opcional" /></SelectTrigger><SelectContent>{documentos.map((doc) => <SelectItem key={doc.id} value={String(doc.id)}>{doc.titulo}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Expira</Label><Input type="datetime-local" value={form.expires_at} onChange={(e) => setForm((prev) => ({ ...prev, expires_at: e.target.value }))} /></div>
            <div className="space-y-2 md:col-span-2"><Label>URL de firma</Label><Input value={form.signing_url} onChange={(e) => setForm((prev) => ({ ...prev, signing_url: e.target.value }))} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Metadata JSON</Label><Input value={form.metadata} onChange={(e) => setForm((prev) => ({ ...prev, metadata: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={createForm} disabled={saving}>{saving ? 'Guardando...' : 'Crear'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Detalles del formulario</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">ID:</span> {selected.id}</p>
              <p><span className="font-medium">Póliza:</span> {polizas.find((item) => item.id === selected.poliza)?.id_mercado || selected.poliza}</p>
              <p><span className="font-medium">Cliente:</span> {selected.cliente_nombre || selected.cliente}</p>
              <p><span className="font-medium">Firmante:</span> {selected.signer_name} · {selected.signer_email}</p>
              <p><span className="font-medium">Estado:</span> {selected.status}</p>
              <p><span className="font-medium">Firma URL:</span> {selected.signing_url || '—'}</p>
              <p><span className="font-medium">Expira:</span> {selected.expires_at || '—'}</p>
              <p><span className="font-medium">Creado por:</span> {selected.created_by_username || 'Sistema'}</p>
              <p><span className="font-medium">Error:</span> {selected.last_error || '—'}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cambiar estatus</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={statusValue} onValueChange={(value) => setStatusValue(value as ConsentStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStatusOpen(false)}>Cancelar</Button>
              <Button onClick={updateStatus} disabled={saving}>{saving ? 'Guardando...' : 'Actualizar'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
