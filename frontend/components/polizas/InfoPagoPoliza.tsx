import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cuentasBancariasApi, infoPagoApi, tarjetasCreditoApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { PaymentMethodsSection } from '@/components/polizas/PaymentMethodsSection';

interface InfoPagoPolizaProps {
  poliza: any;
}

export function InfoPagoPoliza({ poliza }: InfoPagoPolizaProps) {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [infoPago, setInfoPago] = useState<any>(null);
  const [tarjetas, setTarjetas] = useState<any[]>([]);
  const [cuentas, setCuentas] = useState<any[]>([]);

  const [openInfoModal, setOpenInfoModal] = useState(false);

  const [infoForm, setInfoForm] = useState({
    pago_recurrente: false,
    fecha_primer_pago: '',
    dia_pago_preferido: '',
  });

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
              <p className="text-sm font-semibold text-muted-foreground dark:text-gray-400">Pago recurrente</p>
              <p className="text-lg font-bold">{infoPago?.pago_recurrente ? 'Si' : 'No'}</p>
            </div>
            <div className="p-4 bg-slate-50 border rounded-lg">
              <p className="text-sm font-semibold text-muted-foreground dark:text-gray-400">Fecha 1er pago</p>
              <p className="text-lg font-bold">{infoPago?.fecha_primer_pago || 'Pendiente'}</p>
            </div>
            <div className="p-4 bg-slate-50 border rounded-lg">
              <p className="text-sm font-semibold text-muted-foreground dark:text-gray-400">Dia preferido</p>
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
                  <TableCell colSpan={4} className="text-center text-muted-foreground dark:text-gray-400">
                    {loading ? 'Cargando...' : 'Sin resultados'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PaymentMethodsSection
        polizaId={polizaId}
        tarjetas={tarjetas}
        cuentas={cuentas}
        onRefresh={loadData}
      />

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
    </div>
  );
}
