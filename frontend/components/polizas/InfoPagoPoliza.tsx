import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Landmark, Calendar, Banknote } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function InfoPagoPoliza({ poliza }: any) {
  if (!poliza) return <div className="p-4">Cargando pagos...</div>;

  const TDC = poliza.tarjetas_credito || [];
  const Bancos = poliza.cuentas_bancarias || [];
  const InfoPago = poliza.info_pago || {};

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Calendar className="w-5 h-5 mr-2" /> Cronograma y Formato de Pago
          </CardTitle>
        </CardHeader>
        <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 border rounded-lg">
                 <p className="text-sm font-semibold text-muted-foreground">Pago Recurrente</p>
                 <p className="text-lg font-bold">{InfoPago.pago_recurrente ? 'Sí, activado' : 'No'}</p>
              </div>
              <div className="p-4 bg-slate-50 border rounded-lg">
                 <p className="text-sm font-semibold text-muted-foreground">Fecha 1er Pago</p>
                 <p className="text-lg font-bold">{InfoPago.fecha_primer_pago || 'Pendiente'}</p>
              </div>
              <div className="p-4 bg-slate-50 border rounded-lg">
                 <p className="text-sm font-semibold text-muted-foreground">Día Preferido Mensual</p>
                 <p className="text-lg font-bold">Día {InfoPago.dia_preferido_pago || 'No fijado'}</p>
              </div>
           </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-blue-800">
              <CreditCard className="w-5 h-5 mr-2" /> Tarjetas Registradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {TDC.length === 0 ? <p className="text-sm text-muted-foreground">No hay tarjetas registradas.</p> : (
               <Table>
                 <TableHeader><TableRow><TableHead>Tarjeta</TableHead><TableHead>Vence</TableHead><TableHead>CVV</TableHead></TableRow></TableHeader>
                 <TableBody>
                   {TDC.map((t: any) => (
                     <TableRow key={t.id}>
                       <TableCell className="font-mono text-xs"><span className="uppercase text-slate-500 font-bold">{t.tipo_tarjeta}</span> **** {t.numero_tarjeta.slice(-4)}</TableCell>
                       <TableCell>{t.fecha_vencimiento}</TableCell>
                       <TableCell className="text-slate-400">***</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-emerald-800">
              <Landmark className="w-5 h-5 mr-2" /> Cuentas Bancarias
            </CardTitle>
          </CardHeader>
          <CardContent>
             {Bancos.length === 0 ? <p className="text-sm text-muted-foreground">No hay cuentas bancarias registradas.</p> : (
               <Table>
                 <TableHeader><TableRow><TableHead>Banco</TableHead><TableHead>Tipo</TableHead><TableHead>Ruteo / Cuenta</TableHead></TableRow></TableHeader>
                 <TableBody>
                   {Bancos.map((b: any) => (
                     <TableRow key={b.id}>
                       <TableCell className="font-semibold">{b.nombre_banco}</TableCell>
                       <TableCell>{b.tipo_cuenta}</TableCell>
                       <TableCell className="font-mono text-xs">
                          {b.numero_rutina ? R: *** : ''} <br/>
                          C: ****{b.numero_cuenta.slice(-4)}
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
