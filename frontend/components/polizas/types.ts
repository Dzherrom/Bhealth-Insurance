import { PolizaResponse } from '@/types/polizas';

// Tipo simplificado para la interfaz de pólizas
export interface Poliza {
  id: number;
  id_mercado: string;
  id_miembro: string;
  agente_nombre: string;
  plan_nombre: string;
  estado_nombre: string;
  prima_mensual: number;
  fecha_efectiva: string;
  costo_poliza: number;
  cliente_principal?: string;
  fecha_creacion: string;
}

export type PolizaStatus = 'Activo' | 'Inactivo' | 'Pendiente' | 'Cancelado' | 'Renovación';
export type PolizaPlan = 'Básico' | 'Premium' | 'VIP' | 'Familiar';

export interface PolizaFilters {
  search: string;
  status: string;
  plan: string;
  agente: string;
  user?: string;
  groupOfUsers?: string;
  assignedTo?: string;
  role?: string;
  referredByAgency?: string;
  referredToAgency?: string;
  state?: string;
  zipCode?: string;
  carrier?: string;
  memberId?: string;
  productType?: string;
  documentsStatus?: string;
  paymentStatus?: string;
  saleType?: string;
}