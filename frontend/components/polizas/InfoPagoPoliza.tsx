import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Landmark, Calendar, Search, Plus, Trash2, Edit } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cuentasBancariasApi, infoPagoApi, tarjetasCreditoApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface InfoPagoPolizaProps {
  poliza: any;
}

const emptyCard = {
  tipo_tarjeta: 'VISA',
  numero: '',
  nombre_titular: '',
  cvv: '',
  fecha_vencimiento: '',
};

const emptyBank = {
  nombre_banco: '',
  numero_cuenta: '',
  aba_routing: '',
  titular_cuenta: '',
};

export function InfoPagoPoliza({ poliza }: InfoPagoPolizaProps) {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [infoPago, setInfoPago] = useState<any>(null);
  const [tarjetas, setTarjetas] = useState<any[]>([]);
  const [cuentas, setCuentas] = useState<any[]>([]);

  const [openInfoModal, setOpenInfoModal] = useState(false);
  const [openCardModal, setOpenCardModal] = useState(false);
  const [openBankModal, setOpenBankModal] = useState(false);

  const [editingCard, setEditingCard] = useState<any | null>(null);
  const [editingBank, setEditingBank] = useState<any | null>(null);

  const [infoForm, setInfoForm] = useState({
    pago_recurrente: false,
    fecha_primer_pago: '',
    dia_pago_preferido: '',
  });

  const [cardForm, setCardForm] = useState<any>(emptyCard);
  const [bankForm, setBankForm] = useState<any>(emptyBank);

  const polizaId = poliza?.id;

  const loadData = async () => {
    if (!polizaId) return;
    setLoading(true);
    try {
      const [infoRes, cardsRes, banksRes] = await Promise.all([
        infoPagoApi.list(),
        tarjetasCreditoApi.list(),
        cuentasBancariasApi.list(),
      ]);

      const infos = (infoRes as any).results || infoRes || [];
      const cards = (cardsRes as any).results || cardsRes || [];
      const banks = (banksRes as any).results || banksRes || [];

      const info = infos.find((x: any) => Number(x.poliza) === Number(polizaId)) || null;
      const cardsForPoliza = cards.filter((x: any) => Number(x.poliza) === Number(polizaId));
      const banksForPoliza = banks.filter((x: any) => Number(x.poliza) === Number(polizaId));

      setInfoPago(info);
      setTarjetas(cardsForPoliza);
      setCuentas(banksForPoliza);

      setInfoForm({
        pago_recurrente: Boolean(info?.pago_recurrente),
        fecha_primer_pago: info?.fecha_primer_pago || '',
        dia_pago_preferido: info?.dia_pago_preferido ? String(info.dia_pago_preferido) : '',
      });
    } catch (error) {
      console.error(error);
      toast({ title: 'Error al cargar pagos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [polizaId]);

  const rows = useMemo(() => {
    const cardRows = tarjetas.map((item) => ({
      id: `card-${item.id}`,
      tipo: 'Tarjeta',
      nombre: item.nombre_titular,
      detalle: `${item.tipo_tarjeta} ****${String(item.numero || '').slice(-4)}`,
      extra: item.fecha_vencimiento || '',
    }));

    const bankRows = cuentas.map((item) => ({
      id: `bank-${item.id}`,
      tipo: 'Cuenta',
      nombre: item.titular_cuenta,
      detalle: `${item.nombre_banco} ****${String(item.numero_cuenta || '').slice(-4)}`,
      extra: item.aba_routing ? `ABA: ${item.aba_routing}` : '',
    }));

    const allRows = [...cardRows, ...bankRows];
    const q = search.toLowerCase();

    return allRows.filter((r) =>
      [r.tipo, r.nombre, r.detalle, r.extra].join(' ').toLowerCase().includes(q)
    );
  }, [tarjetas, cuentas, search]);

  const saveInfoPago = async () => {
    if (!polizaId) return;
    try {
      const payload = {
        poliza: polizaId,
        pago_recurrente: infoForm.pago_recurrente,
        fecha_primer_pago: infoForm.fecha_primer_pago || null,
        dia_pago_preferido: infoForm.dia_pago_preferido ? Number(infoForm.dia_pago_preferido) : null,
      };

      if (infoPago?.id) {
        await infoPagoApi.patch(infoPago.id, payload as any);
      } else {
        await infoPagoApi.create(payload as any);
      }

      toast({ title: 'Info de pago guardada' });
      setOpenInfoModal(false);
      await loadData();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error guardando info de pago', variant: 'destructive' });
    }
  };

  const saveCard = async () => {
    if (!polizaId) return;
    try {
      const payload = { ...cardForm, poliza: polizaId };
      if (editingCard?.id) {
        await tarjetasCreditoApi.patch(editingCard.id, payload);
      } else {
        await tarjetasCreditoApi.create(payload);
      }
      toast({ title: 'Tarjeta guardada' });
      setOpenCardModal(false);
      setEditingCard(null);
      setCardForm(emptyCard);
      await loadData();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error guardando tarjeta', variant: 'destructive' });
    }
  };

  const saveBank = async () => {
    if (!polizaId) return;
    try {
      const payload = { ...bankForm, poliza: polizaId };
      if (editingBank?.id) {
        await cuentasBancariasApi.patch(editingBank.id, payload);
      } else {
        await cuentasBancariasApi.create(payload);
      }
      toast({ title: 'Cuenta guardada' });
      setOpenBankModal(false);
      setEditingBank(null);
      setBankForm(emptyBank);
      await loadData();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error guardando cuenta', variant: 'destructive' });
    }
  };

  const removeCard = async (id: number) => {
    if (!window.confirm('Eliminar tarjeta?')) return;
    try {
      await tarjetasCreditoApi.delete(id);
      toast({ title: 'Tarjeta eliminada' });
      await loadData();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error eliminando tarjeta', variant: 'destructive' });
    }
  };

  const removeBank = async (id: number) => {
    if (!window.confirm('Eliminar cuenta?')) return;
    try {
      await cuentasBancariasApi.delete(id);
      toast({ title: 'Cuenta eliminada' });
      await loadData();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error eliminando cuenta', variant: 'destructive' });
    }
  };

  if (!poliza) return <div className="p-4">Cargando pagos...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl flex items-center">
            <Calendar className="w-5 h-5 mr-2" /> Cronograma y formato de pago
          </CardTitle>
          <Button variant="outline" onClick={() => setOpenInfoModal(true)}>Editar cronograma</Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 border rounded-lg">
              <p className="text-sm font-semibold text-muted-foreground">Pago recurrente</p>
              <p className="text-lg font-bold">{infoPago?.pago_recurrente ? 'Si' : 'No'}</p>
            </div>
            <div className="p-4 bg-slate-50 border rounded-lg">
              <p className="text-sm font-semibold text-muted-foreground">Fecha 1er pago</p>
              <p className="text-lg font-bold">{infoPago?.fecha_primer_pago || 'Pendiente'}</p>
            </div>
            <div className="p-4 bg-slate-50 border rounded-lg">
              <p className="text-sm font-semibold text-muted-foreground">Dia preferido</p>
              <p className="text-lg font-bold">{infoPago?.dia_pago_preferido || 'No definido'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tabla de pagos y medios</CardTitle>
          <div className="relative w-full max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" placeholder="Buscar medio de pago" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Titular</TableHead>
                <TableHead>Detalle</TableHead>
                <TableHead>Extra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.tipo}</TableCell>
                  <TableCell>{row.nombre}</TableCell>
                  <TableCell>{row.detalle}</TableCell>
                  <TableCell>{row.extra}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">Sin resultados</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center text-blue-800">
              <CreditCard className="w-5 h-5 mr-2" /> Tarjetas
            </CardTitle>
            <Button size="sm" onClick={() => { setCardForm(emptyCard); setEditingCard(null); setOpenCardModal(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Agregar
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? <p className="text-sm text-muted-foreground">Cargando...</p> : tarjetas.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay tarjetas registradas.</p>
            ) : (
              tarjetas.map((t) => (
                <div key={t.id} className="border rounded p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t.tipo_tarjeta} ****{String(t.numero || '').slice(-4)}</p>
                    <p className="text-xs text-muted-foreground">{t.nombre_titular} - {t.fecha_vencimiento}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => { setEditingCard(t); setCardForm({ ...t }); setOpenCardModal(true); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => removeCard(t.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center text-emerald-800">
              <Landmark className="w-5 h-5 mr-2" /> Cuentas bancarias
            </CardTitle>
            <Button size="sm" onClick={() => { setBankForm(emptyBank); setEditingBank(null); setOpenBankModal(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Agregar
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? <p className="text-sm text-muted-foreground">Cargando...</p> : cuentas.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay cuentas registradas.</p>
            ) : (
              cuentas.map((b) => (
                <div key={b.id} className="border rounded p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{b.nombre_banco} ****{String(b.numero_cuenta || '').slice(-4)}</p>
                    <p className="text-xs text-muted-foreground">{b.titular_cuenta} - ABA {b.aba_routing}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => { setEditingBank(b); setBankForm({ ...b }); setOpenBankModal(true); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => removeBank(b.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={openInfoModal} onOpenChange={setOpenInfoModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar cronograma</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={infoForm.pago_recurrente}
                onChange={(e) => setInfoForm((p) => ({ ...p, pago_recurrente: e.target.checked }))}
              />
              <Label>Pago recurrente</Label>
            </div>
            <div>
              <Label>Fecha primer pago</Label>
              <Input type="date" value={infoForm.fecha_primer_pago} onChange={(e) => setInfoForm((p) => ({ ...p, fecha_primer_pago: e.target.value }))} />
            </div>
            <div>
              <Label>Dia preferido (1-31)</Label>
              <Input type="number" min={1} max={31} value={infoForm.dia_pago_preferido} onChange={(e) => setInfoForm((p) => ({ ...p, dia_pago_preferido: e.target.value }))} />
            </div>
            <div className="flex justify-end">
              <Button onClick={saveInfoPago}>Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openCardModal} onOpenChange={setOpenCardModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingCard ? 'Editar tarjeta' : 'Nueva tarjeta'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Tipo</Label><Input value={cardForm.tipo_tarjeta} onChange={(e) => setCardForm((p: any) => ({ ...p, tipo_tarjeta: e.target.value }))} /></div>
            <div><Label>Numero</Label><Input value={cardForm.numero} onChange={(e) => setCardForm((p: any) => ({ ...p, numero: e.target.value }))} /></div>
            <div><Label>Titular</Label><Input value={cardForm.nombre_titular} onChange={(e) => setCardForm((p: any) => ({ ...p, nombre_titular: e.target.value }))} /></div>
            <div><Label>CVV</Label><Input value={cardForm.cvv} onChange={(e) => setCardForm((p: any) => ({ ...p, cvv: e.target.value }))} /></div>
            <div><Label>Vencimiento (MM/YY)</Label><Input value={cardForm.fecha_vencimiento} onChange={(e) => setCardForm((p: any) => ({ ...p, fecha_vencimiento: e.target.value }))} /></div>
            <div className="flex justify-end"><Button onClick={saveCard}>Guardar</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openBankModal} onOpenChange={setOpenBankModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingBank ? 'Editar cuenta' : 'Nueva cuenta'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Banco</Label><Input value={bankForm.nombre_banco} onChange={(e) => setBankForm((p: any) => ({ ...p, nombre_banco: e.target.value }))} /></div>
            <div><Label>Numero de cuenta</Label><Input value={bankForm.numero_cuenta} onChange={(e) => setBankForm((p: any) => ({ ...p, numero_cuenta: e.target.value }))} /></div>
            <div><Label>ABA / Routing</Label><Input value={bankForm.aba_routing} onChange={(e) => setBankForm((p: any) => ({ ...p, aba_routing: e.target.value }))} /></div>
            <div><Label>Titular</Label><Input value={bankForm.titular_cuenta} onChange={(e) => setBankForm((p: any) => ({ ...p, titular_cuenta: e.target.value }))} /></div>
            <div className="flex justify-end"><Button onClick={saveBank}>Guardar</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
