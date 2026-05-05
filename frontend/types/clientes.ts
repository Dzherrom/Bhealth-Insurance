// Tipos e interfaces para clientes y direcciones

import { BaseEntity, OptionalBaseEntity, Genero, EstadoCivil, EstadoInmigracion } from "./common";

// ===============================
// INTERFACES DE REQUEST
// ===============================

export interface ClienteCreateRequest {
  primer_nombre: string;
  segundo_nombre?: string;
  apellido_paterno: string;
  apellido_materno?: string;
  genero: Genero;
  fecha_nacimiento: string; // formato YYYY-MM-DD
  ssn: string;
  email: string;
  telefono: string;
  ingreso_anual: number;
  estado_civil: EstadoCivil;
  pais_nacimiento: string;
  estado_inmigracion: EstadoInmigracion;
  direccion?: number; // ID de la dirección
}

export interface ClienteUpdateRequest extends Partial<ClienteCreateRequest> {}

export interface DireccionCreateRequest {
  calle: string;
  numero?: string;
  numero_interior?: string;
  colonia?: string;
  ciudad: string;
  provincia: string; // Estado/Provincia
  codigo_postal: string;
  pais: string;
  tipo?: 'Residencial' | 'Postal' | 'Trabajo' | 'Otro';
}

export interface DireccionUpdateRequest extends Partial<DireccionCreateRequest> {}

// ===============================
// INTERFACES DE RESPONSE
// ===============================

export interface Cliente extends BaseEntity {
  primer_nombre: string;
  segundo_nombre?: string;
  apellido_paterno: string;
  apellido_materno?: string;
  genero: Genero;
  fecha_nacimiento: string;
  ssn: string;
  email: string;
  telefono: string;
  ingreso_anual: string; // API returns as string
  estado_civil: EstadoCivil;
  pais_nacimiento: string;
  estado_inmigracion: EstadoInmigracion;
  direccion?: number;
  direccion_info?: Direccion;
  edad_calculada?: number;
  nombre_completo?: string;
  fecha_creacion?: string;
  fecha_modificacion?: string;
}

export interface Direccion extends BaseEntity {
  calle: string;
  numero?: string;
  numero_interior?: string;
  colonia?: string;
  ciudad: string;
  provincia: string;
  codigo_postal: string;
  pais: string;
  tipo?: string;
  direccion_completa?: string;
  activa?: boolean;
}

// ===============================
// INTERFACES EXTENDIDAS
// ===============================

export interface ClienteConDireccion extends Cliente {
  direccion_info: Direccion;
}

export interface ClienteListResponse {
  id: number;
  nombre_completo: string;
  email: string;
  telefono: string;
  edad_calculada: number;
  estado_inmigracion: EstadoInmigracion;
  fecha_creacion: string;
}

// ===============================
// TIPOS DERIVADOS
// ===============================

export type ClienteCreate = ClienteCreateRequest;
export type ClienteUpdate = ClienteUpdateRequest;
export type DireccionCreate = DireccionCreateRequest;
export type DireccionUpdate = DireccionUpdateRequest;

// Tipo para selección de cliente en formularios
export interface ClienteSelect {
  id: number;
  nombre_completo: string;
  email: string;
  ssn: string;
}

// Tipo para filtros de búsqueda
export interface ClienteFilters {
  nombre?: string;
  email?: string;
  estado_civil?: EstadoCivil;
  estado_inmigracion?: EstadoInmigracion;
  edad_min?: number;
  edad_max?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
}