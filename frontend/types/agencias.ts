// Tipos e interfaces para agencias, agentes y tareas

import { BaseEntity, OptionalBaseEntity } from "./common";

// ===============================
// AGENCIAS - INTERFACES DE REQUEST
// ===============================

export interface AgenciaCreateRequest {
  nombre: string;
  codigo?: string;
  direccion?: number; // ID de la dirección
  telefono?: string;
  email?: string;
  activa?: boolean;
}

export interface AgenciaUpdateRequest extends Partial<AgenciaCreateRequest> {}

// ===============================
// AGENCIAS - INTERFACES DE RESPONSE
// ===============================

export interface Agencia extends BaseEntity {
  nombre: string;
  codigo: string;
  direccion?: number;
  telefono?: string;
  email?: string;
  activa: boolean;
  fecha_creacion?: string;
  fecha_modificacion?: string;
}

// ===============================
// AGENTES - INTERFACES
// ===============================

export interface AgenteCreateRequest {
  usuario: number; // ID del usuario
  agencia: number; // ID de la agencia
  codigo_agente: string;
  telefono?: string;
  activo?: boolean;
}

export interface AgenteUpdateRequest extends Partial<AgenteCreateRequest> {}

export interface Agente extends BaseEntity {
  usuario: number;
  agencia: number;
  codigo_agente: string;
  telefono?: string;
  activo: boolean;
  usuario_info?: {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  agencia_info?: {
    nombre: string;
    codigo: string;
  };
  fecha_creacion?: string;
}

// ===============================
// TAREAS - INTERFACES DE REQUEST
// ===============================

export interface TareaCreateRequest {
  poliza: number; // ID de la póliza
  asignado_a: number; // ID del usuario
  titulo: string;
  descripcion: string;
  fecha_limite: string; // formato ISO string con timezone
  prioridad?: 'Baja' | 'Media' | 'Alta' | 'Urgente';
  tipo?: 'Seguimiento' | 'Documentación' | 'Renovación' | 'Reclamación' | 'Otro';
}

export interface TareaUpdateRequest extends Partial<TareaCreateRequest> {
  completada?: boolean;
  fecha_completada?: string;
  notas_completado?: string;
}

// ===============================
// TAREAS - INTERFACES DE RESPONSE
// ===============================

export interface Tarea extends BaseEntity {
  poliza: number;
  asignado_a: number;
  titulo: string;
  descripcion: string;
  fecha_limite: string;
  completada: boolean;
  fecha_completada?: string;
  prioridad: string;
  tipo: string;
  notas_completado?: string;
  poliza_info?: {
    id_mercado: string;
    cliente_principal: string;
  };
  asignado_info?: {
    username: string;
    first_name: string;
    last_name: string;
  };
  fecha_creacion: string;
  fecha_modificacion?: string;
}

export interface MisTareasResponse {
  id: number;
  titulo: string;
  poliza_id_mercado: string;
  completada: boolean;
  fecha_limite: string;
  prioridad: string;
  descripcion: string;
  dias_restantes?: number;
  estado_urgencia?: 'normal' | 'proximo' | 'vencido';
}

// ===============================
// TIPOS DERIVADOS
// ===============================

export type AgenciaCreate = AgenciaCreateRequest;
export type AgenciaUpdate = AgenciaUpdateRequest;
export type AgenteCreate = AgenteCreateRequest;
export type AgenteUpdate = AgenteUpdateRequest;
export type TareaCreate = TareaCreateRequest;
export type TareaUpdate = TareaUpdateRequest;

// ===============================
// TIPOS PARA FILTROS Y BÚSQUEDAS
// ===============================

export interface TareaFilters {
  completada?: boolean;
  prioridad?: string;
  tipo?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  asignado_a?: number;
  poliza?: number;
}

export interface AgenciaFilters {
  activa?: boolean;
  nombre?: string;
  codigo?: string;
}

export interface AgenteFilters {
  activo?: boolean;
  agencia?: number;
  codigo_agente?: string;
}

// ===============================
// ENUMS PARA OPCIONES
// ===============================

export enum PrioridadTarea {
  BAJA = 'Baja',
  MEDIA = 'Media',
  ALTA = 'Alta',
  URGENTE = 'Urgente'
}

export enum TipoTarea {
  SEGUIMIENTO = 'Seguimiento',
  DOCUMENTACION = 'Documentación',
  RENOVACION = 'Renovación',
  RECLAMACION = 'Reclamación',
  OTRO = 'Otro'
}