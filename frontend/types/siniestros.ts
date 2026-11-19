import type { OptionalBaseEntity } from './common';

export type SiniestroTipo = 'HOGAR' | 'AUTO' | 'RESPONSABILIDAD_CIVIL' | 'OTRO';
export type SiniestroCausa =
  | 'INCENDIO'
  | 'AGUA'
  | 'ROBO'
  | 'VANDALISMO'
  | 'TORMENTA_GRANIZO'
  | 'COLISION'
  | 'ROBO_VEHICULO'
  | 'RESPONSABILIDAD_CIVIL'
  | 'OTRO';
export type SiniestroEstado =
  | 'RECIBIDO'
  | 'EN_REVISION'
  | 'ENVIADO_A_ASEGURADORA'
  | 'EN_SEGUIMIENTO'
  | 'RESUELTO'
  | 'RECHAZADO'
  | 'CERRADO';

export interface SiniestroClienteOption {
  cliente_id: number;
  nombre: string;
  es_solicitante_principal: boolean;
  es_aplicante: boolean;
  relacion: string;
}

export interface SiniestroPolizaOption {
  id: number;
  id_mercado: string;
  plan_nombre: string | null;
  tipo_producto_nombre: string;
  fecha_efectiva: string | null;
  estado_nombre: string | null;
  clientes: SiniestroClienteOption[];
}

export interface Siniestro extends OptionalBaseEntity {
  numero_siniestro: string;
  poliza: number;
  poliza_codigo: string;
  cliente: number;
  cliente_nombre: string;
  tipo: SiniestroTipo;
  tipo_display: string;
  causa: SiniestroCausa;
  causa_display: string;
  fecha_evento: string;
  lugar_evento: string;
  descripcion: string;
  monto_estimado: string | null;
  numero_reclamo_aseguradora: string;
  contacto_aseguradora: string;
  estado: SiniestroEstado;
  estado_display: string;
  reportado_por: number | null;
  reportado_por_username: string | null;
  asignado_a: number | null;
  asignado_a_username: string | null;
  fecha_reporte: string;
  ultima_actualizacion: string;
}

export interface SiniestroCreateRequest {
  poliza: number;
  cliente: number;
  tipo: SiniestroTipo;
  causa: SiniestroCausa;
  fecha_evento: string;
  lugar_evento: string;
  descripcion: string;
  monto_estimado?: string | null;
  numero_reclamo_aseguradora?: string;
  contacto_aseguradora?: string;
  estado?: SiniestroEstado;
  asignado_a?: number | null;
}

export interface SiniestroAdjunto extends OptionalBaseEntity {
  siniestro: number;
  archivo?: string;
  nombre: string;
  descripcion: string;
  subido_por: number | null;
  subido_por_username: string | null;
  fecha_subida: string;
  download_url: string;
}

export interface SiniestroHistorial extends OptionalBaseEntity {
  siniestro: number;
  usuario: number | null;
  usuario_username: string | null;
  accion: string;
  detalles: string;
  fecha: string;
}
