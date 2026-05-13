'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import api from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function AgenciaConfig() {
  const [agencia, setAgencia] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgencia();
  }, []);

  const fetchAgencia = async () => {
    try {
      const res = await api.get('/agencias/');
      if (res.data.results && res.data.results.length > 0) {
        setAgencia(res.data.results[0]);
      } else if (res.data.length > 0) {
        setAgencia(res.data[0]);
      } else {
        // Create an empty basic one if doesn't exist
        const postRes = await api.post('/agencias/', { nombre: 'Mi Agencia' });
        setAgencia(postRes.data);
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'No se pudo cargar la agencia', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await api.put(`/agencias/${agencia.id}/`, agencia);
      setAgencia(res.data);
      toast({ title: 'Guardado', description: 'Configuracion de Agencia actualizada.' });
    } catch (e) {
      toast({ title: 'Error', description: 'Error al actualizar', variant: 'destructive' });
    }
  };

  if (loading) return <div className='flex justify-center p-8'><Loader2 className='h-8 w-8 animate-spin' /></div>;
  if (!agencia) return <p>No hay datos.</p>;

  return (
    <div className='space-y-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900 mb-2'>Agencia</h1>
        <p className='text-sm text-gray-500'>
          Cliente desde: {agencia.cliente_desde ? new Date(agencia.cliente_desde).toLocaleDateString() : 'N/A'} | Última actualización: {agencia.ultima_actualizacion ? new Date(agencia.ultima_actualizacion).toLocaleDateString() : 'N/A'}
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='text-sm font-medium'>Nombre</label>
              <Input value={agencia.nombre || ''} onChange={(e) => setAgencia({...agencia, nombre: e.target.value})} />
            </div>
            <div>
              <label className='text-sm font-medium'>Nombre Legal</label>
              <Input value={agencia.nombre_legal || ''} onChange={(e) => setAgencia({...agencia, nombre_legal: e.target.value})} />
            </div>
            <div>
              <label className='text-sm font-medium'>DBA</label>
              <Input value={agencia.dba || ''} onChange={(e) => setAgencia({...agencia, dba: e.target.value})} />
            </div>
            <div>
              <label className='text-sm font-medium'>Teléfono</label>
              <Input value={agencia.telefono || ''} onChange={(e) => setAgencia({...agencia, telefono: e.target.value})} />
            </div>
            <div>
              <label className='text-sm font-medium'>Correo Electrónico</label>
              <Input value={agencia.email || ''} onChange={(e) => setAgencia({...agencia, email: e.target.value})} />
            </div>
            <div>
              <label className='text-sm font-medium'>Código Postal</label>
              <Input value={agencia.codigo_postal || ''} onChange={(e) => setAgencia({...agencia, codigo_postal: e.target.value})} />
            </div>
          </div>
          <div>
            <label className='text-sm font-medium'>Dirección Negocio</label>
            <Textarea value={agencia.direccion_negocio || ''} onChange={(e) => setAgencia({...agencia, direccion_negocio: e.target.value})} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Branding del Portal</CardTitle></CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <label className='text-sm font-medium'>Título del Portal</label>
            <Input value={agencia.titulo_portal || ''} onChange={(e) => setAgencia({...agencia, titulo_portal: e.target.value})} />
          </div>
          <div>
            <label className='text-sm font-medium'>Pie de Correos Electrónicos</label>
            <Textarea rows={4} value={agencia.pie_email || ''} onChange={(e) => setAgencia({...agencia, pie_email: e.target.value})} />
          </div>
        </CardContent>
      </Card>

      <div className='flex justify-end'>
        <Button onClick={handleSave}>Guardar Cambios</Button>
      </div>
    </div>
  );
}
