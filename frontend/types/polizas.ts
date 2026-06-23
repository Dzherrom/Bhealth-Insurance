// Tipos e interfaces para pólizas y gestión de seguros

import { BaseEntity, OptionalBaseEntity, RelacionFamiliar } from "./common";

// ===============================
// INTERFACES AUXILIARES
// ===============================

export interface ClientePolizaData {
  cliente: number;
  es_solicitante_principal: boolean;
  relacion: RelacionFamiliar;
  direccion_residencia: number;
  direccion_postal?: number;
}

export interface ClientePolizaDetails {
  id: number;
  cliente: number;
  cliente_details: {
    primer_nombre: string;
    apellido_paterno: string;
    [key: string]: any;
  };
  es_solicitante_principal: boolean;
  relacion: RelacionFamiliar;
  direccion_residencia?: number;
  direccion_postal?: number;
}

// ===============================
// INTERFACES DE REQUEST
// ===============================

export interface PolizaCreateRequest {
  id_mercado: string;
  id_miembro: string;
  costo_poliza: number;
  subsidio: number;
  prima_mensual: number;
  fecha_efectiva?: string | null; // formato YYYY-MM-DD
  fecha_envio: string; // formato YYYY-MM-DD
  id_interno: string;
  plan: number; // ID del plan
  estado: number; // ID del estado
  agente: number; // ID del agente
  clientes_data: ClientePolizaData[];
}

export interface PolizaUpdateRequest extends Partial<Omit<PolizaCreateRequest, 'clientes_data'>> {
  clientes_data?: ClientePolizaData[];
  notas_comentarios?: string | null;
  info_medico_principal?: string | null;
  medico_especializacion?: string | null;
  medico_hospital?: string | null;
  medicamentos_necesarios?: string | null;
  medicamentos_dosis?: string | null;
  medicos_principales?: Array<{
    id: number;
    poliza: number;
    nombre: string;
    especializacion?: string | null;
    hospital?: string | null;
    fecha_creacion?: string;
  }>;
  medicamentos?: Array<{
    id: number;
    poliza: number;
    nombre: string;
    dosis?: string | null;
    frecuencia?: string | null;
    activo?: boolean;
  }>;
}

// ===============================
// INTERFACES DE RESPONSE
// ===============================

export interface PolizaResponse extends BaseEntity {
  id_mercado: string;
  id_miembro: string;
  costo_poliza: string; // API returns as string
  subsidio: string; // API returns as string
  prima_mensual: string; // API returns as string
  fecha_efectiva: string;
  fecha_envio?: string;
  id_interno: string;
  plan: number;
  estado: number;
  agente: number;
  estado_nombre: string;
  plan_nombre: string;
  agente_nombre: string;
  clientes_info: ClientePolizaDetails[];
  notas_comentarios?: string | null;
  info_medico_principal?: string | null;
  medico_especializacion?: string | null;
  medico_hospital?: string | null;
  medicamentos_necesarios?: string | null;
  medicamentos_dosis?: string | null;
  medicos_principales?: Array<{
    id: number;
    poliza: number;
    nombre: string;
    especializacion?: string | null;
    hospital?: string | null;
    fecha_creacion?: string;
  }>;
  medicamentos?: Array<{
    id: number;
    poliza: number;
    nombre: string;
    dosis?: string | null;
    frecuencia?: string | null;
    activo?: boolean;
  }>;
  fecha_creacion?: string;
  fecha_modificacion?: string;
}

export interface PolizaListResponse {
  id: number;
  id_mercado: string;
  id_miembro: string;
  id_interno?: string;
  estado: number;
  agente?: number;
  plan?: number;
  agente_nombre: string;
  plan_nombre: string;
  estado_nombre: string;
  estado_documento?: string;
  estado_documento_display?: string;
  estado_pago?: string;
  estado_pago_display?: string;
  prima_mensual: string;
  subsidio?: string;
  fecha_efectiva: string;
  fecha_envio?: string;
  costo_poliza: string;
  total_miembros?: number;
  total_aplicantes?: number;
  total_dependientes?: number;
  ultima_actualizacion?: string;
  cliente_principal?: string;
  fecha_creacion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  numero_poliza?: string;
  suma_asegurada?: string;
  periodicidad_pago?: string;
  fecha_proximo_pago?: string;
  forma_pago?: string;
  notas?: string;
  clientes_info?: ClientePolizaDetails[];
}

// ===============================
// ENTIDADES RELACIONADAS
// ===============================

export interface Plan extends BaseEntity {
  nombre: string;
  descripcion?: string;
  aseguradora: number;
  precio_base: number;
  activo: boolean;
  codigo?: string;
  tipo?: string;
}

export interface EstadoPoliza extends BaseEntity {
  nombre: string;
  descripcion?: string;
  activo: boolean;
  color?: string;
}

export interface Aseguradora extends BaseEntity {
  nombre: string;
  codigo: string;
  telefono?: string;
  email?: string;
  activa: boolean;
  direccion?: number;
  sitio_web?: string;
}

// ===============================
// TIPOS DERIVADOS
// ===============================

export type PolizaCreate = PolizaCreateRequest;
export type PolizaUpdate = PolizaUpdateRequest;
export type Poliza = PolizaResponse;

// Estados comunes de pólizas
export enum EstadosPolizaComunes {
  ACTIVA = 'Activo',
  INACTIVA = 'Inactivo', 
  PENDIENTE = 'Pendiente',
  CANCELADA = 'Cancelado',
  RENOVACION = 'Renovación'
}