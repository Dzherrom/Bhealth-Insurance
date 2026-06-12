'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DireccionFormFields } from './DireccionFormFields';
import { DependienteFormFields } from './DependienteFormFields';
import {
  DIRECCION_TIPOS,
  ESTATUS_MIGRATORIOS,
  emptyDependiente,
  emptyDireccion,
  getMemberName,
  isFemaleMember,
  type CambioDeVidaDatos,
  type DependienteFormData,
  type DireccionFormData,
} from './constants';

interface CambioDeVidaTipoFormProps {
  tipo: string;
  datos: CambioDeVidaDatos;
  onChange: (datos: CambioDeVidaDatos) => void;
  poliza: any;
}

function mapDireccionFromApi(details: any): DireccionFormData {
  if (!details) return emptyDireccion();
  return {
    linea1: details.linea1 || '',
    linea2: details.linea2 || '',
    ciudad: details.ciudad || '',
    estado: details.estado || '',
    zip_code: details.zip_code || '',
    condado: details.condado || '',
  };
}

export function CambioDeVidaTipoForm({ tipo, datos, onChange, poliza }: CambioDeVidaTipoFormProps) {
  const miembros = poliza?.clientes_info || [];
  const inputClass = 'h-9 dark:bg-slate-800 dark:border-slate-700';

  const update = (patch: CambioDeVidaDatos) => onChange({ ...datos, ...patch });

  const handleMiembroChange = (clienteId: string) => {
    const member = miembros.find((m: any) => String(m.cliente) === clienteId);
    update({
      miembro_id: Number(clienteId),
      miembro_nombre: member ? getMemberName(member) : '',
    });
  };

  const handleDireccionTipoChange = (direccionTipo: string) => {
    const label = DIRECCION_TIPOS.find((d) => d.value === direccionTipo)?.label || direccionTipo;
    const details = poliza?.[`${direccionTipo}_details`] || null;
    update({
      direccion_tipo: direccionTipo,
      direccion_tipo_label: label,
      direccion: mapDireccionFromApi(details),
    });
  };

  if (!tipo) return null;

  switch (tipo) {
    case 'CAMBIO_INGRESOS':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>¿Para quién es el cambio de ingresos? *</Label>
            <Select value={datos.miembro_id ? String(datos.miembro_id) : ''} onValueChange={handleMiembroChange}>
              <SelectTrigger><SelectValue placeholder="Seleccionar miembro" /></SelectTrigger>
              <SelectContent>
                {miembros.map((m: any) => (
                  <SelectItem key={m.cliente} value={String(m.cliente)}>
                    {getMemberName(m)}{m.relacion ? ` (${m.relacion})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(datos.trabaja_por_cuenta)}
              onChange={(e) => update({ trabaja_por_cuenta: e.target.checked })}
            />
            ¿Trabaja por su cuenta?
          </label>
          <div className="space-y-2">
            <Label>Nombre de la empresa / empleador</Label>
            <Input
              value={String(datos.nombre_empleador || '')}
              onChange={(e) => update({ nombre_empleador: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label>Teléfono del empleador</Label>
            <Input
              value={String(datos.telefono_empleador || '')}
              onChange={(e) => update({ telefono_empleador: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label>Cargo / ocupación *</Label>
            <Input
              value={String(datos.cargo_ocupacion || '')}
              onChange={(e) => update({ cargo_ocupacion: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label>Ingresos anuales *</Label>
            <Input
              type="number"
              min="0"
              value={String(datos.ingresos_anuales || '')}
              onChange={(e) => update({ ingresos_anuales: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      );

    case 'NUEVA_DIRECCION':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>¿Qué dirección ha cambiado? *</Label>
            <Select value={String(datos.direccion_tipo || '')} onValueChange={handleDireccionTipoChange}>
              <SelectTrigger><SelectValue placeholder="Seleccionar dirección" /></SelectTrigger>
              <SelectContent>
                {DIRECCION_TIPOS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DireccionFormFields
            value={(datos.direccion as DireccionFormData) || emptyDireccion()}
            onChange={(direccion) => update({ direccion })}
          />
        </div>
      );

    case 'CAMBIO_ESTADO_MIGRATORIO':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>¿Para quién es el cambio migratorio? *</Label>
            <Select value={datos.miembro_id ? String(datos.miembro_id) : ''} onValueChange={handleMiembroChange}>
              <SelectTrigger><SelectValue placeholder="Seleccionar miembro" /></SelectTrigger>
              <SelectContent>
                {miembros.map((m: any) => (
                  <SelectItem key={m.cliente} value={String(m.cliente)}>
                    {getMemberName(m)}{m.relacion ? ` (${m.relacion})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Estatus migratorio *</Label>
            <Select
              value={String(datos.estado_migratorio || '')}
              onValueChange={(v) => {
                const label = ESTATUS_MIGRATORIOS.find((e) => e.value === v)?.label || v;
                update({ estado_migratorio: v, estado_migratorio_label: label });
              }}
            >
              <SelectTrigger><SelectValue placeholder="Seleccionar estatus" /></SelectTrigger>
              <SelectContent>
                {ESTATUS_MIGRATORIOS.map((e) => (
                  <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'NUEVO_MIEMBRO':
      return (
        <DependienteFormFields
          value={(datos.dependiente as DependienteFormData) || emptyDependiente()}
          onChange={(dependiente) => update({ dependiente })}
        />
      );

    case 'EMBARAZO': {
      const mujeres = miembros.filter(isFemaleMember);
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>¿Quién está embarazada? *</Label>
            {mujeres.length === 0 ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                No hay miembros de sexo femenino registrados en esta póliza.
              </p>
            ) : (
              <Select value={datos.miembro_id ? String(datos.miembro_id) : ''} onValueChange={handleMiembroChange}>
                <SelectTrigger><SelectValue placeholder="Seleccionar miembro" /></SelectTrigger>
                <SelectContent>
                  {mujeres.map((m: any) => (
                    <SelectItem key={m.cliente} value={String(m.cliente)}>
                      {getMemberName(m)}{m.relacion ? ` (${m.relacion})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      );
    }

    case 'FALLECIDO':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>¿Quién ha fallecido? *</Label>
            <Select value={datos.miembro_id ? String(datos.miembro_id) : ''} onValueChange={handleMiembroChange}>
              <SelectTrigger><SelectValue placeholder="Seleccionar miembro" /></SelectTrigger>
              <SelectContent>
                {miembros.map((m: any) => (
                  <SelectItem key={m.cliente} value={String(m.cliente)}>
                    {getMemberName(m)}{m.relacion ? ` (${m.relacion})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nota adicional</Label>
            <Textarea
              value={String(datos.nota_adicional || '')}
              onChange={(e) => update({ nota_adicional: e.target.value })}
              placeholder="Información adicional sobre el fallecimiento..."
              rows={3}
            />
          </div>
        </div>
      );

    case 'OTROS':
      return (
        <div className="space-y-2">
          <Label>Descripción del cambio de vida *</Label>
          <Textarea
            value={String(datos.descripcion_cambio || '')}
            onChange={(e) => update({ descripcion_cambio: e.target.value })}
            placeholder="Describe el cambio solicitado por el cliente..."
            rows={4}
          />
        </div>
      );

    default:
      return null;
  }
}

export function validateCambioDeVidaDatos(tipo: string, datos: CambioDeVidaDatos): string | null {
  switch (tipo) {
    case 'CAMBIO_INGRESOS':
      if (!datos.miembro_id) return 'Selecciona el miembro para el cambio de ingresos.';
      if (!String(datos.cargo_ocupacion || '').trim()) return 'El cargo/ocupación es obligatorio.';
      if (!String(datos.ingresos_anuales || '').trim()) return 'Los ingresos anuales son obligatorios.';
      return null;
    case 'NUEVA_DIRECCION': {
      if (!datos.direccion_tipo) return 'Selecciona qué dirección ha cambiado.';
      const d = datos.direccion as DireccionFormData;
      if (!d?.linea1?.trim() || !d?.zip_code?.trim() || !d?.ciudad?.trim() || !d?.estado?.trim() || !d?.condado?.trim()) {
        return 'Completa todos los campos obligatorios de la dirección.';
      }
      return null;
    }
    case 'CAMBIO_ESTADO_MIGRATORIO':
      if (!datos.miembro_id) return 'Selecciona el miembro para el cambio migratorio.';
      if (!datos.estado_migratorio) return 'Selecciona el estatus migratorio.';
      return null;
    case 'NUEVO_MIEMBRO': {
      const dep = datos.dependiente as DependienteFormData;
      if (!dep?.primerNombre?.trim() || !dep?.apellidoPaterno?.trim() || !dep?.fechaNacimiento) {
        return 'Completa nombre, apellido y fecha de nacimiento del nuevo dependiente.';
      }
      return null;
    }
    case 'EMBARAZO':
      if (!datos.miembro_id) return 'Selecciona la miembro embarazada.';
      return null;
    case 'FALLECIDO':
      if (!datos.miembro_id) return 'Selecciona quién ha fallecido.';
      return null;
    case 'OTROS':
      if (!String(datos.descripcion_cambio || '').trim()) return 'La descripción del cambio es obligatoria.';
      return null;
    default:
      return 'Selecciona un tipo de evento de vida.';
  }
}
