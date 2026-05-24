'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { usePolizaStore } from '@/store/polizaStore';
import { useCatalogoStore } from '@/store';
import { clientesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { Cliente, PolizaCreateRequest, RelacionFamiliar } from '@/types';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PolizaFormValues {
  id_mercado: string;
  id_miembro: string;
  id_interno: string;
  fecha_efectiva: string;
  fecha_envio: string;
  plan: string;
  agente: string;
  estado: string;
  prima_mensual: number;
  costo_poliza: number;
  subsidio: number;
  cliente_id: string;
  direccion_residencia: string;
  relacion: RelacionFamiliar;
}

interface PlanGroup {
  aseguradoraId: number;
  aseguradoraNombre: string;
  planes: Array<{ id: number; nombre: string }>;
}

const isEnabled = (value: unknown): boolean => value !== false;

interface CrearPolizaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (polizaId: number) => void;
}

const today = new Date().toISOString().slice(0, 10);

type DireccionDetails = {
  id?: number | string;
  linea1?: string;
  linea2?: string;
  ciudad?: string;
  estado?: string;
  zip_code?: string;
};

const normalizeId = (value: unknown): string => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string' && value.trim() !== '') return value.trim();
  return '';
};

const formatDireccion = (direccion?: DireccionDetails): string => {
  if (!direccion) return '';

  const lineaPrincipal = [direccion.linea1, direccion.linea2].filter(Boolean).join(', ').trim();
  const ciudadEstadoZip = [direccion.ciudad, direccion.estado, direccion.zip_code].filter(Boolean).join(' ').trim();

  return [lineaPrincipal, ciudadEstadoZip].filter(Boolean).join(', ');
};

const getDireccionResidenciaDataFromCliente = (cliente?: Cliente): { id: string; texto: string } => {
  if (!cliente) return { id: '', texto: '' };

  const maybeDireccionFisica = cliente as Cliente & {
    direccion_fisica?: number | string;
    direccion_fisica_details?: DireccionDetails;
    direccion?: number | string;
    direccion_info?: DireccionDetails;
  };

  const idDireccion =
    normalizeId(maybeDireccionFisica.direccion_fisica) ||
    normalizeId(maybeDireccionFisica.direccion_fisica_details?.id) ||
    normalizeId(maybeDireccionFisica.direccion) ||
    normalizeId(maybeDireccionFisica.direccion_info?.id);

  const textoDireccion =
    formatDireccion(maybeDireccionFisica.direccion_fisica_details) ||
    formatDireccion(maybeDireccionFisica.direccion_info) ||
    (idDireccion ? `Direccion #${idDireccion}` : '');

  return { id: idDireccion, texto: textoDireccion };
};

export function CrearPolizaModal({ isOpen, onClose, onCreated }: CrearPolizaModalProps) {
  const { createPoliza, isCreating } = usePolizaStore();
  const {
    agentes,
    estadosPoliza,
    planes,
    aseguradoras,
    fetchAgentes,
    fetchEstadosPoliza,
    fetchPlanes,
    fetchAseguradoras,
  } = useCatalogoStore();
  const { toast } = useToast();
  const [clientes, setClientes] = React.useState<Cliente[]>([]);
  const [isLoadingClientes, setIsLoadingClientes] = React.useState(false);
  const [direccionResidenciaTexto, setDireccionResidenciaTexto] = React.useState('');

  const { register, handleSubmit, reset, watch, setValue } = useForm<PolizaFormValues>({
    defaultValues: {
      fecha_envio: today,
      relacion: 'Self',
      subsidio: 0,
      costo_poliza: 0,
      prima_mensual: 0,
      direccion_residencia: '',
    },
  });

  const clienteIdSeleccionado = watch('cliente_id');

  React.useEffect(() => {
    if (!clienteIdSeleccionado) {
      setValue('direccion_residencia', '');
      setDireccionResidenciaTexto('');
      return;
    }

    const clienteSeleccionado = clientes.find((cliente) => cliente.id === Number(clienteIdSeleccionado));
    const direccionData = getDireccionResidenciaDataFromCliente(clienteSeleccionado);
    setValue('direccion_residencia', direccionData.id);
    setDireccionResidenciaTexto(direccionData.texto);
  }, [clienteIdSeleccionado, clientes, setValue]);

  React.useEffect(() => {
    if (!isOpen) return;

    const loadCatalogs = async () => {
      try {
        await Promise.all([
          fetchAgentes(),
          fetchEstadosPoliza(),
          fetchPlanes(),
          fetchAseguradoras(),
        ]);
      } catch {
        // El formulario sigue disponible aunque algún catálogo falle.
      }
    };

    const loadClientes = async () => {
      setIsLoadingClientes(true);
      try {
        const list = await clientesApi.list();
        setClientes(Array.isArray(list) ? list : []);
      } catch {
        setClientes([]);
      } finally {
        setIsLoadingClientes(false);
      }
    };

    loadCatalogs();
    loadClientes();
  }, [isOpen, fetchAgentes, fetchEstadosPoliza, fetchPlanes, fetchAseguradoras]);

  const clientesOrdenados = React.useMemo(() => {
    return [...clientes].sort((a, b) => {
      const nombreA = (a.nombre_completo || `${a.primer_nombre} ${a.apellido_paterno}`).trim();
      const nombreB = (b.nombre_completo || `${b.primer_nombre} ${b.apellido_paterno}`).trim();
      return nombreA.localeCompare(nombreB, 'es');
    });
  }, [clientes]);

  const agentesActivos = React.useMemo(
    () => agentes.filter((agente) => isEnabled((agente as unknown as { activo?: boolean }).activo)),
    [agentes]
  );

  const estadosActivos = React.useMemo(
    () =>
      estadosPoliza.filter((estado) => {
        const rawEstado = estado as unknown as {
          activo?: boolean;
          disponible_para_agentes?: boolean;
        };

        // En backend, EstadoPoliza usa disponible_para_agentes; activo no siempre existe.
        return isEnabled(rawEstado.activo) && isEnabled(rawEstado.disponible_para_agentes);
      }),
    [estadosPoliza]
  );

  const planGroups = React.useMemo<PlanGroup[]>(() => {
    const aseguradorasActivas = aseguradoras.filter((aseguradora) =>
      isEnabled((aseguradora as unknown as { activa?: boolean }).activa)
    );

    return aseguradorasActivas
      .map((aseguradora) => {
        const planesAseguradora = planes
          .filter(
            (plan) =>
              isEnabled((plan as unknown as { activo?: boolean }).activo) &&
              plan.aseguradora === aseguradora.id
          )
          .map((plan) => ({ id: plan.id, nombre: plan.nombre }));

        return {
          aseguradoraId: aseguradora.id,
          aseguradoraNombre: aseguradora.nombre,
          planes: planesAseguradora,
        };
      })
      .filter((group) => group.planes.length > 0);
  }, [aseguradoras, planes]);

  const handleOpenChange = (open: boolean) => {
    if (!open && !isCreating) {
      onClose();
    }
  };

  const onSubmit = async (data: PolizaFormValues) => {
    if (!data.direccion_residencia) {
      toast({
        title: 'Dirección faltante',
        description: 'El cliente seleccionado no tiene dirección de residencia asociada.',
        variant: 'destructive',
      });
      return;
    }

    const payload: PolizaCreateRequest = {
      id_mercado: data.id_mercado.trim(),
      id_miembro: data.id_miembro.trim(),
      id_interno: data.id_interno.trim(),
      fecha_efectiva: data.fecha_efectiva ? data.fecha_efectiva : null,
      fecha_envio: data.fecha_envio,
      plan: Number(data.plan),
      agente: Number(data.agente),
      estado: Number(data.estado),
      prima_mensual: Number(data.prima_mensual),
      costo_poliza: Number(data.costo_poliza),
      subsidio: Number(data.subsidio),
      clientes_data: [
        {
          cliente: Number(data.cliente_id),
          es_solicitante_principal: true,
          relacion: data.relacion,
          direccion_residencia: Number(data.direccion_residencia),
        },
      ],
    };

    try {
      const poliza = await createPoliza(payload);
      toast({ title: 'Póliza creada', description: `Se registró ${poliza.id_mercado}.` });
      reset({
        fecha_envio: today,
        relacion: 'Self',
        subsidio: 0,
        costo_poliza: 0,
        prima_mensual: 0,
        id_mercado: '',
        id_miembro: '',
        id_interno: '',
        fecha_efectiva: '',
        plan: '',
        agente: '',
        estado: '',
        cliente_id: '',
        direccion_residencia: '',
      });
      setDireccionResidenciaTexto('');
      onClose();
      onCreated?.(poliza.id);
    } catch (error) {
      const description = error instanceof Error ? error.message : 'No se pudo crear la póliza';
      toast({ title: 'Error', description, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Póliza</DialogTitle>
          <DialogDescription>
            Llene la información base para registrar una nueva póliza.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ID de Mercado</Label>
              <Input {...register('id_mercado', { required: true })} placeholder="MKT-..." />
            </div>

            <div className="space-y-2">
              <Label>ID de Miembro</Label>
              <Input {...register('id_miembro', { required: true })} placeholder="MEM-..." />
            </div>

            <div className="space-y-2">
              <Label>ID Interno</Label>
              <Input {...register('id_interno', { required: true })} placeholder="..." />
            </div>

            <div className="space-y-2">
              <Label>Cliente principal</Label>
              <select
                {...register('cliente_id', { required: true })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                disabled={isLoadingClientes}
              >
                <option value="">{isLoadingClientes ? 'Cargando clientes...' : 'Seleccione cliente principal'}</option>
                {clientesOrdenados.map((cliente) => {
                  const nombre = (
                    cliente.nombre_completo ||
                    `${cliente.primer_nombre} ${cliente.segundo_nombre || ''} ${cliente.apellido_paterno} ${cliente.apellido_materno || ''}`
                  )
                    .replace(/\s+/g, ' ')
                    .trim();

                  return (
                    <option key={cliente.id} value={cliente.id}>
                      {nombre}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Dirección residencia (auto)</Label>
              <Input
                type="text"
                value={direccionResidenciaTexto}
                placeholder="Se completa por cliente"
                readOnly
              />
              <Input
                type="hidden"
                {...register('direccion_residencia', { required: true })}
              />
            </div>

            <div className="space-y-2">
              <Label>Plan</Label>
              <select
                {...register('plan', { required: true })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Seleccione plan</option>
                {planGroups.map((group) => (
                  <optgroup key={group.aseguradoraId} label={group.aseguradoraNombre}>
                    {group.planes.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.nombre}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Agente asignado</Label>
              <select
                {...register('agente', { required: true })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Agente asignado</option>
                {agentesActivos.map((agente) => {
                  const rawAgente = agente as unknown as {
                    nombre_completo?: string;
                    usuario_info?: {
                      first_name?: string;
                      last_name?: string;
                      username?: string;
                    };
                  };

                  const nombreDesdeUsuario = `${rawAgente.usuario_info?.first_name || ''} ${rawAgente.usuario_info?.last_name || ''}`
                    .replace(/\s+/g, ' ')
                    .trim();

                  const etiqueta =
                    rawAgente.nombre_completo ||
                    nombreDesdeUsuario ||
                    rawAgente.usuario_info?.username ||
                    `Agente ${agente.id}`;

                  return (
                    <option key={agente.id} value={agente.id}>
                      {etiqueta}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Estado de póliza</Label>
              <select
                {...register('estado', { required: true })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Seleccione estado</option>
                {estadosActivos.map((estado) => (
                  <option key={estado.id} value={estado.id}>
                    {estado.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Fecha Efectiva</Label>
              <Input type="date" {...register('fecha_efectiva')} />
            </div>

            <div className="space-y-2">
              <Label>Fecha Envío</Label>
              <Input type="date" {...register('fecha_envio', { required: true })} />
            </div>

            <div className="space-y-2">
              <Label>Prima Mensual</Label>
              <Input
                type="number"
                step="0.01"
                {...register('prima_mensual', { valueAsNumber: true, required: true })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Costo Póliza</Label>
              <Input
                type="number"
                step="0.01"
                {...register('costo_poliza', { valueAsNumber: true, required: true })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Subsidio</Label>
              <Input
                type="number"
                step="0.01"
                {...register('subsidio', { valueAsNumber: true, required: true })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Relación del solicitante</Label>
              <select
                {...register('relacion', { required: true })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="Self">Self</option>
                <option value="Spouse">Spouse</option>
                <option value="Child">Child</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={isCreating}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Guardando...' : 'Guardar Póliza'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
