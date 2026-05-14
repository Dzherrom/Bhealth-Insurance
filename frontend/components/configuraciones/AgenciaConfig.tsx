'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Building2, Palette, Upload } from 'lucide-react';
import { resolveApiMediaUrl } from '@/lib/api';
import api from '@/services/api';
import { toast } from '@/hooks/use-toast';

const emptyBusiness = {
  nombre_legal: '',
  dba: '',
  telefono: '',
  email: '',
};

const emptyBranding = {
  titulo_portal: '',
  pie_email: '',
};

export function AgenciaConfig() {
  const [agencia, setAgencia] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [businessOpen, setBusinessOpen] = useState(false);
  const [brandingOpen, setBrandingOpen] = useState(false);
  const [businessForm, setBusinessForm] = useState<any>(emptyBusiness);
  const [brandingForm, setBrandingForm] = useState<any>(emptyBranding);
  const [logoLight, setLogoLight] = useState<File | null>(null);
  const [logoDark, setLogoDark] = useState<File | null>(null);
  const [favicon, setFavicon] = useState<File | null>(null);

  useEffect(() => {
    fetchAgencia();
  }, []);

  const fetchAgencia = async () => {
    try {
      const res = await api.get('/agencias/');
      const current = res.data.results?.[0] || res.data?.[0] || res.data;
      if (current) {
        setAgencia(current);
        setBusinessForm({
          nombre_legal: current.nombre_legal || '',
          dba: current.dba || '',
          telefono: current.telefono || '',
          email: current.email || '',
        });
        setBrandingForm({
          titulo_portal: current.titulo_portal || '',
          pie_email: current.pie_email || '',
        });
      } else {
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

  const saveBusiness = async () => {
    try {
      const payload = { ...agencia, ...businessForm };
      const res = await api.put(`/agencias/${agencia.id}/`, payload);
      setAgencia(res.data);
      setBusinessOpen(false);
      toast({ title: 'Guardado', description: 'Información de negocio actualizada.' });
    } catch (e) {
      toast({ title: 'Error', description: 'Error al actualizar la información', variant: 'destructive' });
    }
  };

  const saveBranding = async () => {
    try {
      const formData = new FormData();
      formData.append('nombre', agencia?.nombre || 'Mi Agencia');
      formData.append('titulo_portal', brandingForm.titulo_portal || '');
      formData.append('pie_email', brandingForm.pie_email || '');
      if (logoLight) formData.append('logo_light', logoLight);
      if (logoDark) formData.append('logo_dark', logoDark);
      if (favicon) formData.append('favicon', favicon);

      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/agencias/${agencia.id}/`, {
        method: 'PATCH',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!response.ok) throw new Error('No se pudo guardar branding');
      const updated = await response.json();
      setAgencia(updated);
      setBrandingOpen(false);
      setLogoLight(null);
      setLogoDark(null);
      setFavicon(null);
      toast({ title: 'Guardado', description: 'Branding del portal actualizado.' });
    } catch (e) {
      toast({ title: 'Error', description: 'Error al actualizar branding', variant: 'destructive' });
    }
  };

  if (loading) return <div className='flex justify-center p-8'><Loader2 className='h-8 w-8 animate-spin' /></div>;
  if (!agencia) return <p>No hay datos.</p>;

  return (
    <div className='space-y-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900 mb-2'>Configuración de Agencia</h1>
        <p className='text-sm text-gray-500'>Cliente desde: {agencia.cliente_desde ? new Date(agencia.cliente_desde).toLocaleDateString() : 'N/A'} | Última actualización: {agencia.ultima_actualizacion ? new Date(agencia.ultima_actualizacion).toLocaleDateString() : 'N/A'}</p>
      </div>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle className='flex items-center gap-2'><Building2 className='h-5 w-5' /> Información de negocio</CardTitle>
          <Button variant='outline' onClick={() => setBusinessOpen(true)}>Editar</Button>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-2'>
          <div>
            <p className='text-sm text-gray-500'>Nombre legal de la empresa</p>
            <p className='font-medium'>{agencia.nombre_legal || '—'}</p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Nombre comercial DBA</p>
            <p className='font-medium'>{agencia.dba || '—'}</p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Teléfono</p>
            <p className='font-medium'>{agencia.telefono || '—'}</p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Correo electrónico</p>
            <p className='font-medium'>{agencia.email || '—'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle className='flex items-center gap-2'><Palette className='h-5 w-5' /> Branding del portal</CardTitle>
          <Button variant='outline' onClick={() => setBrandingOpen(true)}>Editar</Button>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-2'>
          <div className='space-y-2'>
            <p className='text-sm text-gray-500'>Logotipo en modo claro</p>
            {agencia.logo_light ? <img src={resolveApiMediaUrl(agencia.logo_light)} alt='Logo claro' className='h-16 object-contain' /> : <p className='text-sm text-muted-foreground'>Sin cargar</p>}
          </div>
          <div className='space-y-2'>
            <p className='text-sm text-gray-500'>Logotipo en modo oscuro</p>
            {agencia.logo_dark ? <img src={resolveApiMediaUrl(agencia.logo_dark)} alt='Logo oscuro' className='h-16 object-contain bg-slate-900 p-2 rounded' /> : <p className='text-sm text-muted-foreground'>Sin cargar</p>}
          </div>
          <div className='space-y-2'>
            <p className='text-sm text-gray-500'>Favicon</p>
            {agencia.favicon ? <img src={resolveApiMediaUrl(agencia.favicon)} alt='Favicon' className='h-8 w-8 object-contain' /> : <p className='text-sm text-muted-foreground'>Sin cargar</p>}
          </div>
          <div>
            <p className='text-sm text-gray-500'>Título del portal</p>
            <p className='font-medium'>{agencia.titulo_portal || '—'}</p>
          </div>
          <div className='md:col-span-2'>
            <p className='text-sm text-gray-500'>Pie de correos electrónicos</p>
            <p className='text-sm whitespace-pre-wrap border rounded p-3 bg-slate-50'>{agencia.pie_email || '—'}</p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={businessOpen} onOpenChange={setBusinessOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar información de negocio</DialogTitle></DialogHeader>
          <div className='space-y-3'>
            <div><label className='text-sm font-medium'>Nombre legal</label><Input value={businessForm.nombre_legal} onChange={(e) => setBusinessForm((p: any) => ({ ...p, nombre_legal: e.target.value }))} /></div>
            <div><label className='text-sm font-medium'>DBA</label><Input value={businessForm.dba} onChange={(e) => setBusinessForm((p: any) => ({ ...p, dba: e.target.value }))} /></div>
            <div><label className='text-sm font-medium'>Teléfono</label><Input value={businessForm.telefono} onChange={(e) => setBusinessForm((p: any) => ({ ...p, telefono: e.target.value }))} /></div>
            <div><label className='text-sm font-medium'>Correo electrónico</label><Input type='email' value={businessForm.email} onChange={(e) => setBusinessForm((p: any) => ({ ...p, email: e.target.value }))} /></div>
            <div className='flex justify-end'><Button onClick={saveBusiness}>Guardar</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={brandingOpen} onOpenChange={setBrandingOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar branding del portal</DialogTitle></DialogHeader>
          <div className='space-y-3'>
            <div><label className='text-sm font-medium'>Título del portal</label><Input value={brandingForm.titulo_portal} onChange={(e) => setBrandingForm((p: any) => ({ ...p, titulo_portal: e.target.value }))} /></div>
            <div><label className='text-sm font-medium'>Pie de correos</label><Textarea rows={4} value={brandingForm.pie_email} onChange={(e) => setBrandingForm((p: any) => ({ ...p, pie_email: e.target.value }))} /></div>
            <div className='grid gap-3 md:grid-cols-3'>
              <label className='text-sm font-medium'>Logo claro <Input type='file' accept='image/*' onChange={(e) => setLogoLight(e.target.files?.[0] || null)} /></label>
              <label className='text-sm font-medium'>Logo oscuro <Input type='file' accept='image/*' onChange={(e) => setLogoDark(e.target.files?.[0] || null)} /></label>
              <label className='text-sm font-medium'>Favicon <Input type='file' accept='image/*' onChange={(e) => setFavicon(e.target.files?.[0] || null)} /></label>
            </div>
            <div className='flex justify-end'><Button onClick={saveBranding}>Guardar</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
