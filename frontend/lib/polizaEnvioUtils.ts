import type { PolizaResponse } from '@/types/polizas';

const QUOTE_KEYWORDS = ['quote', 'cotiz', 'draft', 'borrad'];

export function isQuoteEstadoName(estadoNombre?: string | null): boolean {
  if (!estadoNombre) return false;
  const normalized = estadoNombre.trim().toLowerCase();
  return QUOTE_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function polizaIsQuote(poliza: Pick<PolizaResponse, 'estado_nombre' | 'id_mercado'>): boolean {
  if (isQuoteEstadoName(poliza.estado_nombre)) return true;
  return String(poliza.id_mercado || '').trim().toUpperCase().startsWith('QUOTE-');
}

export interface PolizaEnvioValidation {
  es_cotizacion: boolean;
  puede_enviar: boolean;
  errores: string[];
}

/** Client-side preview of send requirements (authoritative check is backend validar-envio). */
export function previewPolizaEnvioErrors(poliza: PolizaResponse): string[] {
  const errors: string[] = [];

  if (!polizaIsQuote(poliza)) {
    errors.push('La póliza ya fue enviada y no está en estatus de cotización.');
    return errors;
  }

  if (!poliza.fecha_efectiva) errors.push('Falta la fecha de efectividad.');
  if (!poliza.agente) errors.push('Falta asignar un agente a la póliza.');

  const hasPlan = Boolean(poliza.plan) || Boolean(poliza.plan_nombre?.trim());
  if (!hasPlan) {
    errors.push('Falta información del plan (plan asignado o aseguradora + nombre del plan).');
  }

  const prima = parseFloat(String(poliza.prima_mensual || '0'));
  const costo = parseFloat(String(poliza.costo_poliza || '0'));
  if (!(prima > 0 || costo > 0)) {
    errors.push('Faltan montos de prima o costo de la póliza.');
  }

  if (!poliza.direccion_fisica_details) {
    errors.push('Falta la dirección física de la póliza.');
  }

  const principal = poliza.clientes_info?.find((c) => c.es_solicitante_principal)
    ?? poliza.clientes_info?.[0];
  if (!principal) {
    errors.push('Falta al menos un miembro titular/aplicante en la póliza.');
  } else {
    const email = principal.cliente_details?.email?.trim();
    const telefono = principal.cliente_details?.telefono?.trim();
    if (!email) errors.push('Falta el correo electrónico del titular.');
    if (!telefono) errors.push('Falta el teléfono del titular.');
  }

  const tarjetas = poliza.tarjetas_credito?.length ?? 0;
  const cuentas = poliza.cuentas_bancarias?.length ?? 0;
  const infoPago = poliza.info_pago as { fecha_primer_pago?: string; pago_recurrente?: boolean } | null | undefined;
  const hasPayment = tarjetas > 0 || cuentas > 0 || Boolean(infoPago?.fecha_primer_pago || infoPago?.pago_recurrente);
  if (!hasPayment) {
    errors.push('Falta información de pago (tarjeta, cuenta bancaria o cronograma de pago).');
  }

  const idMiembro = String(poliza.id_miembro || '').trim().toLowerCase();
  if (!idMiembro || ['pendiente', 'pend', 'n/a', 'na', '-'].includes(idMiembro)) {
    errors.push('Falta el ID de miembro de la póliza.');
  }

  return errors;
}
