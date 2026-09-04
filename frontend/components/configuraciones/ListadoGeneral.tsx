'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { clientesApi, usersApi } from '@/lib/api';

interface ListadoEmpleado {
  id: number;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile?: {
    role?: string | null;
    status?: string | null;
    telefono?: string | null;
  } | null;
}

interface ListadoCliente {
  id: number;
  primer_nombre?: string | null;
  segundo_nombre?: string | null;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  nombre_completo?: string | null;
  id_miembro?: string | null;
  codigos_miembro?: string[];
  email?: string | null;
  estado_inmigracion?: string | null;
}

function getPayloadResults<T>(payload: T[] | { results?: T[] }): T[] {
  return Array.isArray(payload) ? payload : payload.results ?? [];
}

function employeeName(employee: ListadoEmpleado): string {
  const fullName = `${employee.first_name ?? ''} ${employee.last_name ?? ''}`.trim();
  return fullName || employee.username || employee.email || `Empleado ${employee.id}`;
}

function clientName(client: ListadoCliente): string {
  if (client.nombre_completo?.trim()) return client.nombre_completo;
  return [
    client.primer_nombre,
    client.segundo_nombre,
    client.apellido_paterno,
    client.apellido_materno,
  ]
    .filter(Boolean)
    .join(' ') || `Cliente ${client.id}`;
}

function clientMemberCodes(client: ListadoCliente): string {
  return client.codigos_miembro?.join(', ') || client.id_miembro || '';
}

function getPageWindow(page: number, totalPages: number): number[] {
  const firstPage = Math.floor((page - 1) / 10) * 10 + 1;
  const lastPage = Math.min(firstPage + 9, totalPages);
  return Array.from({ length: lastPage - firstPage + 1 }, (_, index) => firstPage + index);
}

export function ListadoGeneral() {
  const [search, setSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [empleados, setEmpleados] = useState<ListadoEmpleado[]>([]);
  const [clientes, setClientes] = useState<ListadoCliente[]>([]);
  const [loadingEmpleados, setLoadingEmpleados] = useState(true);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [employeePage, setEmployeePage] = useState(1);
  const [employeeTotal, setEmployeeTotal] = useState(0);
  const [clientPage, setClientPage] = useState(1);
  const [clientTotal, setClientTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEmployees = async () => {
      setLoadingEmpleados(true);
      try {
        const result = await usersApi.listPaginated({
          empleados: '1',
          page: employeePage,
          page_size: 25,
          search: search.trim(),
        });
        setEmpleados(getPayloadResults(result) as ListadoEmpleado[]);
        setEmployeeTotal(result.count ?? 0);
      } catch {
        setEmpleados([]);
        setEmployeeTotal(0);
        setError('No se pudieron cargar los empleados.');
      } finally {
        setLoadingEmpleados(false);
      }
    };
    void loadEmployees();
  }, [employeePage, search]);

  useEffect(() => {
    const loadClients = async () => {
      setLoadingClientes(true);
      try {
        const result = await clientesApi.listPaginated({
          page: clientPage,
          page_size: 25,
          search: clientSearch.trim(),
        });
        setClientes(getPayloadResults(result));
        setClientTotal(result.count ?? 0);
      } catch {
        setClientes([]);
        setClientTotal(0);
        setError('No se pudieron cargar los clientes.');
      } finally {
        setLoadingClientes(false);
      }
    };
    void loadClients();
  }, [clientPage, clientSearch]);

  useEffect(() => {
    setClientPage(1);
  }, [clientSearch]);

  useEffect(() => {
    setEmployeePage(1);
  }, [search]);

  const filteredEmpleados = useMemo(() => {
    const q = search.toLowerCase();
    return empleados.filter((empleado) =>
      `${employeeName(empleado)} ${empleado.username ?? ''} ${empleado.email ?? ''} ${empleado.profile?.role ?? ''}`
        .toLowerCase()
        .includes(q),
    );
  }, [empleados, search]);

  const filteredClientes = useMemo(() => {
    const q = clientSearch.toLowerCase();
    return clientes.filter((cliente) =>
      `${clientName(cliente)} ${cliente.email ?? ''} ${clientMemberCodes(cliente)}`
        .toLowerCase()
        .includes(q),
    );
  }, [clientes, clientSearch]);

  const clientTotalPages = Math.max(1, Math.ceil(clientTotal / 25));
  const employeeTotalPages = Math.max(1, Math.ceil(employeeTotal / 25));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Listado general</CardTitle>
        </CardHeader>
        <CardContent>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar empleados" />
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Agentes / Empleados</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {loadingEmpleados ? <p className="text-sm text-muted-foreground dark:text-gray-400">Cargando...</p> : filteredEmpleados.map((empleado) => (
              <div key={empleado.id} className="flex items-center justify-between rounded border p-3">
                <div>
                  <p className="font-medium">{employeeName(empleado)}</p>
                  <p className="text-xs text-muted-foreground dark:text-gray-400">
                    {empleado.email || empleado.username || 'Sin correo'}
                  </p>
                </div>
                <Badge variant="outline">{empleado.profile?.role || 'Empleado'}</Badge>
              </div>
            ))}
            {!loadingEmpleados && filteredEmpleados.length === 0 && (
              <p className="text-sm text-muted-foreground dark:text-gray-400">No se encontraron empleados.</p>
            )}
            {!loadingEmpleados && employeeTotal > 0 && (
              <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {empleados.length} de {employeeTotal} empleados
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEmployeePage((page) => Math.max(1, page - 1))}
                    disabled={employeePage === 1}
                  >
                    Anterior
                  </Button>
                  {getPageWindow(employeePage, employeeTotalPages).map((page) => (
                    <Button
                      key={page}
                      variant={employeePage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEmployeePage(page)}
                      aria-label={`Ir a página ${page} de empleados`}
                      aria-current={employeePage === page ? 'page' : undefined}
                    >
                      {page}
                    </Button>
                  ))}
                  <span className="min-w-24 text-center text-sm">
                    Página {employeePage} de {employeeTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEmployeePage((page) => Math.min(employeeTotalPages, page + 1))}
                    disabled={employeePage === employeeTotalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clientes registrados</CardTitle>
            <Input
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              placeholder="Buscar por nombre, correo o código de miembro"
              className="mt-3"
            />
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingClientes ? <p className="text-sm text-muted-foreground dark:text-gray-400">Cargando...</p> : filteredClientes.map((cliente) => (
              <div key={cliente.id} className="flex items-center justify-between rounded border p-3">
                <div>
                  <p className="font-medium">{clientName(cliente)}</p>
                  <p className="text-xs text-muted-foreground dark:text-gray-400">
                    {cliente.email || 'Sin correo'}
                    {clientMemberCodes(cliente) ? ` · Código(s): ${clientMemberCodes(cliente)}` : ''}
                  </p>
                </div>
                <Badge variant="outline">{cliente.estado_inmigracion || 'Cliente'}</Badge>
              </div>
            ))}
            {!loadingClientes && filteredClientes.length === 0 && (
              <p className="text-sm text-muted-foreground dark:text-gray-400">No se encontraron clientes.</p>
            )}
            {!loadingClientes && clientTotal > 0 && (
              <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {clientes.length} de {clientTotal} clientes
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setClientPage((page) => Math.max(1, page - 1))}
                    disabled={clientPage === 1}
                  >
                    Anterior
                  </Button>
                  {getPageWindow(clientPage, clientTotalPages).map((page) => (
                    <Button
                      key={page}
                      variant={clientPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setClientPage(page)}
                      aria-label={`Ir a página ${page} de clientes`}
                      aria-current={clientPage === page ? 'page' : undefined}
                    >
                      {page}
                    </Button>
                  ))}
                  <span className="min-w-24 text-center text-sm">
                    Página {clientPage} de {clientTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setClientPage((page) => Math.min(clientTotalPages, page + 1))}
                    disabled={clientPage === clientTotalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}