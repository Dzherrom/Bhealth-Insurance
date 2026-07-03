// Tipos e interfaces para pólizas y gestión de seguros

import { BaseEntity, OptionalBaseEntity } from "./common";
import type { Direccion } from "./clientes";

// ===============================
// INTERFACES AUXILIARES
// ===============================

export interface PolizaEtiqueta {
  id: number;
  nombre: string;
  color?: string;
}

export interface ClientePolizaData {
  cliente: number;
  es_solicitante_principal: boolean;
  es_aplicante?: boolean;
  relacion: string;
  direccion_residencia?: number | null;
  direccion_postal?: number | null;
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
  es_aplicante?: boolean;
  relacion: string;
  direccion_residencia?: number | null;
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

export interface PolizaUpdateRequest extends Partial<Omit<PolizaCreateRequest, 'clientes_data' | 'agente'>> {
  clientes_data?: ClientePolizaData[];
  agente?: number | null;
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
  etiquetas_ids?: number[];
  estado_documento?: string | null;
  total_miembros?: number;
  total_aplicantes?: number;
  total_dependientes?: number;
}

// ===============================
// INTERFACES DE RESPONSE
// ===============================

export interface OtraPoliza {
  id: number;
  id_mercado: string;
  fecha_efectiva?: string | null;
  estado?: string | null;
  agente?: string | null;
  cliente?: string | null;
  asignado?: string[];
}

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
  agente_registro?: number | null;
  agente_registro_nombre?: string | null;
  estado_documento?: string | null;
  metal?: string | null;
  id_plan_cms?: string | null;
  ffm_mercado?: string | null;
  npn_mercado?: string | null;
  tipo_inscripcion?: string | null;
  fecha_cancelacion?: string | null;
  etiquetas?: PolizaEtiqueta[];
  direccion_fisica_details?: Direccion | null;
  direccion_postal_details?: Direccion | null;
  direccion_facturacion_details?: Direccion | null;
  info_pago?: {
    id?: number;
    estado_pago?: string | null;
  } | null;
  tarjetas_credito?: Array<Record<string, unknown>>;
  cuentas_bancarias?: Array<Record<string, unknown>>;
  notas?: Array<Record<string, unknown>>;
  documentos?: Array<Record<string, unknown>>;
  otras_polizas?: OtraPoliza[];
  archivada?: boolean;
  archivada_en?: string | null;
  archivada_por?: number | null;
  archivada_por_nombre?: string | null;
  presence?: {
    viewers: Array<{ user_id: number; display_name: string; mode: string }>;
    can_edit: boolean;
  };
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
  agente_nombre: string;
  agente_npn?: string | null;
  agente_registro?: number | null;
  agente_registro_nombre?: string | null;
  asistente_nombre?: string | null;
  asistente_npn?: string | null;
  plan?: number;
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
  archivada?: boolean;
  archivada_en?: string | null;
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