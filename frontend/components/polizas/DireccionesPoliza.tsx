import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, ArrowRight } from 'lucide-react';

export function DireccionesPoliza({ poliza }: any) {
  if (!poliza) return null;

  const fis = poliza.direccion_fisica_details || {};
  const pos = poliza.direccion_postal_details || {};
  const fac = poliza.direccion_facturacion_details || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-primary"/> Direcciones
        </CardTitle>
      </CardHeader>
      <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="border rounded p-4 border-l-4 border-l-blue-500">
               <h3 className="font-bold mb-2 flex items-center"><ArrowRight className="w-4 h-4 mr-1 text-blue-500"/> Física</h3>
               {fis.calle ? (
                  <div className="text-sm space-y-1">
                     <p>{fis.calle} {fis.apartamento && Apt: }</p>
                     <p>{fis.ciudad}, {fis.estado} {fis.codigo_postal}</p>
                     <p className="font-semibold mt-2 border-t pt-1">Condado: <span className="text-muted-foreground">{fis.condado_details?.nombre || 'N/A'}</span></p>
                  </div>
               ) : <p className="text-sm text-muted-foreground">No registrada</p>}
            </div>

            <div className="border rounded p-4 border-l-4 border-l-purple-500">
               <h3 className="font-bold mb-2 flex items-center"><ArrowRight className="w-4 h-4 mr-1 text-purple-500"/> Postal</h3>
               {pos.calle ? (
                  <div className="text-sm space-y-1">
                     <p>{pos.calle} {pos.apartamento && Apt: }</p>
                     <p>{pos.ciudad}, {pos.estado} {pos.codigo_postal}</p>
                     <p className="font-semibold mt-2 border-t pt-1">Condado: <span className="text-muted-foreground">{pos.condado_details?.nombre || 'N/A'}</span></p>
                  </div>
               ) : <p className="text-sm text-muted-foreground">Misma que física</p>}
            </div>

            <div className="border rounded p-4 border-l-4 border-l-green-500">
               <h3 className="font-bold mb-2 flex items-center"><ArrowRight className="w-4 h-4 mr-1 text-green-500"/> Facturación</h3>
               {fac.calle ? (
                  <div className="text-sm space-y-1">
                     <p>{fac.calle} {fac.apartamento && Apt: }</p>
                     <p>{fac.ciudad}, {fac.estado} {fac.codigo_postal}</p>
                     <p className="font-semibold mt-2 border-t pt-1">Condado: <span className="text-muted-foreground">{fac.condado_details?.nombre || 'N/A'}</span></p>
                  </div>
               ) : <p className="text-sm text-muted-foreground">Misma que física</p>}
            </div>

          </div>
      </CardContent>
    </Card>
  );
}
