'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { agentesApi, clientesApi } from '@/lib/api';

export function ListadoGeneral() {
  const [search, setSearch] = useState('');
  const [agentes, setAgentes] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [agentesRes, clientesRes] = await Promise.all([agentesApi.list(), clientesApi.list()]);
        setAgentes((agentesRes as any).results || agentesRes || []);
        setClientes((clientesRes as any).results || clientesRes || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredAgentes = useMemo(() => {
    const q = search.toLowerCase();
    return agentes.filter((agente) => `${agente.nombre_completo} ${agente.npn}`.toLowerCase().includes(q));
  }, [agentes, search]);

  const filteredClientes = useMemo(() => {
    const q = search.toLowerCase();
    return clientes.filter((cliente) => `${cliente.primer_nombre} ${cliente.apellido_paterno} ${cliente.email}`.toLowerCase().includes(q));
  }, [clientes, search]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Listado general</CardTitle>
        </CardHeader>
        <CardContent>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar agentes o clientes" />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Agentes / Empleados</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {loading ? <p className="text-sm text-muted-foreground dark:text-gray-400">Cargando...</p> : filteredAgentes.map((agente) => (
              <div key={agente.id} className="flex items-center justify-between rounded border p-3">
                <div>
                  <p className="font-medium">{agente.nombre_completo}</p>
                  <p className="text-xs text-muted-foreground dark:text-gray-400">NPN: {agente.npn}</p>
                </div>
                <Badge variant="outline">{agente.agencia_nombre || 'Sin agencia'}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Clientes registrados</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {loading ? <p className="text-sm text-muted-foreground dark:text-gray-400">Cargando...</p> : filteredClientes.map((cliente) => (
              <div key={cliente.id} className="flex items-center justify-between rounded border p-3">
                <div>
                  <p className="font-medium">{cliente.primer_nombre} {cliente.apellido_paterno}</p>
                  <p className="text-xs text-muted-foreground dark:text-gray-400">{cliente.email}</p>
                </div>
                <Badge variant="outline">{cliente.estado_inmigracion || 'Cliente'}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}