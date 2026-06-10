'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { agenciasApi, agentesApi, aseguradorasApi, configuracionComisionesApi, planesApi, reportesComisionApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const emptyConfig = {
  agencia: '',
  aseguradora: '',
  plan: '',
  porcentaje: '',
};

export default function ComisionesPage() {
  const [configuraciones, setConfiguraciones] = useState<any[]>([]);
  const [reportes, setReportes] = useState<any[]>([]);
  const [agencias, setAgencias] = useState<any[]>([]);
  const [aseguradoras, setAseguradoras] = useState<any[]>([]);
  const [planes, setPlanes] = useState<any[]>([]);
  const [agentes, setAgentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNivel, setSelectedNivel] = useState<'AGENCIA' | 'ASEGURADORA' | 'PLAN'>('AGENCIA');
  const [form, setForm] = useState(emptyConfig);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [configRes, reportesRes, agenciasRes, aseguradorasRes, planesRes, agentesRes] = await Promise.all([
        configuracionComisionesApi.list(),
        reportesComisionApi.list(),
        agenciasApi.list(),
        aseguradorasApi.list(),
        planesApi.list(),
        agentesApi.list(),
      ]);
      setConfiguraciones((configRes as any).results || configRes || []);
      setReportes((reportesRes as any).results || reportesRes || []);
      setAgencias((agenciasRes as any).results || agenciasRes || []);
      setAseguradoras((aseguradorasRes as any).results || aseguradorasRes || []);
      setPlanes((planesRes as any).results || planesRes || []);
      setAgentes((agentesRes as any).results || agentesRes || []);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo cargar la página de comisiones', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const groupedByAgent = useMemo(() => {
    const map = new Map<string, { nombre: string; total: number; comision: number; registros: number }>();
    reportes.forEach((item) => {
      const nombre = item.agente_nombre || item.agente || 'Sin agente';
      const current = map.get(nombre) || { nombre, total: 0, comision: 0, registros: 0 };
      current.total += Number(item.prima_total || item.monto_total || 0);
      current.comision += Number(item.comision_total || item.monto_comision || 0);
      current.registros += 1;
      map.set(nombre, current);
    });
    return Array.from(map.values()).sort((a, b) => b.comision - a.comision);
  }, [reportes]);

  const filteredConfigs = useMemo(() => configuraciones.filter((item) => item.nivel === selectedNivel), [configuraciones, selectedNivel]);

  const saveConfig = async () => {
    setSaving(true);
    try {
      await configuracionComisionesApi.create({
        nivel: selectedNivel,
        agencia: form.agencia ? Number(form.agencia) : null,
        aseguradora: form.aseguradora ? Number(form.aseguradora) : null,
        plan: form.plan ? Number(form.plan) : null,
        porcentaje: Number(form.porcentaje),
        activo: true,
      } as any);
      toast({ title: 'Configuración guardada' });
      setForm(emptyConfig);
      await load();
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo guardar la comisión', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const totalComision = reportes.reduce((sum, item) => sum + Number(item.comision_total || item.monto_comision || 0), 0);
  const totalPrima = reportes.reduce((sum, item) => sum + Number(item.prima_total || item.monto_total || 0), 0);

  return (
    <div className="app-page space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Comisiones</h1>
          <p className="text-muted-foreground dark:text-gray-400">Configura porcentajes por agencia, proveedor y plan, y revisa los agentes.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardDescription>Prima total</CardDescription><CardTitle>{totalPrima.toLocaleString('es-MX', { style: 'currency', currency: 'USD' })}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Comisión total</CardDescription><CardTitle>{totalComision.toLocaleString('es-MX', { style: 'currency', currency: 'USD' })}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Agentes</CardDescription><CardTitle>{agentes.length}</CardTitle></CardHeader></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva configuración</CardTitle>
          <CardDescription>Agrega una comisión general por nivel.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Nivel</Label>
            <Select value={selectedNivel} onValueChange={(value) => setSelectedNivel(value as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="AGENCIA">Agencia</SelectItem>
                <SelectItem value="ASEGURADORA">Proveedor</SelectItem>
                <SelectItem value="PLAN">Plan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Agencia</Label>
            <Select value={form.agencia} onValueChange={(value) => setForm((prev) => ({ ...prev, agencia: value }))}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>{agencias.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.nombre || item.nombre_comercial || `Agencia #${item.id}`}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Aseguradora</Label>
            <Select value={form.aseguradora} onValueChange={(value) => setForm((prev) => ({ ...prev, aseguradora: value }))}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>{aseguradoras.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.nombre}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Plan</Label>
            <Select value={form.plan} onValueChange={(value) => setForm((prev) => ({ ...prev, plan: value }))}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>{planes.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.nombre}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Porcentaje</Label>
            <Input type="number" step="0.01" value={form.porcentaje} onChange={(e) => setForm((prev) => ({ ...prev, porcentaje: e.target.value }))} />
          </div>
          <div className="flex items-end">
            <Button onClick={saveConfig} disabled={saving} className="w-full">
              <Plus className="mr-2 h-4 w-4" /> {saving ? 'Guardando...' : 'Guardar configuración'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Comisiones por agencia / proveedor / plan</CardTitle>
            <CardDescription>Listado de reglas activas e inactivas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? <p className="text-sm text-muted-foreground dark:text-gray-400">Cargando...</p> : filteredConfigs.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{item.nivel}</p>
                  <p className="text-xs text-muted-foreground dark:text-gray-400">{item.descripcion || 'Sin descripción'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{item.porcentaje}%</Badge>
                  <Badge className={item.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'} variant="outline">
                    {item.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agentes</CardTitle>
            <CardDescription>Resumen de comisiones por agente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {groupedByAgent.map((agent) => (
              <div key={agent.nombre} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{agent.nombre}</p>
                  <p className="text-xs text-muted-foreground dark:text-gray-400">{agent.registros} registros</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{agent.comision.toLocaleString('es-MX', { style: 'currency', currency: 'USD' })}</p>
                  <p className="text-xs text-muted-foreground dark:text-gray-400">Prima: {agent.total.toLocaleString('es-MX', { style: 'currency', currency: 'USD' })}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
