export const RECORDATORIO_TIPOS = [
  { value: 'ESTADO_MIGRATORIO', label: 'Estado migratorio' },
  { value: 'VERIFICACION_INGRESOS', label: 'Verificación de ingresos' },
  { value: 'REALIZAR_PAGO', label: 'Realizar pago' },
  { value: 'CARGAR_DOCUMENTOS', label: 'Cargar documentos' },
  { value: 'ACTUALIZAR_INFO_CLIENTE', label: 'Actualizar información del cliente' },
  { value: 'OTRO', label: 'Otro' },
] as const;

export const RECORDATORIO_ANTELACIONES = [
  { value: '30m', label: '30 minutos antes' },
  { value: '1h', label: '1 hora antes' },
  { value: '2h', label: '2 horas antes' },
  { value: '1d', label: '1 día antes' },
  { value: '3d', label: '3 días antes' },
  { value: '7d', label: '7 días antes' },
] as const;

export const RECORDATORIO_MOTIVOS = [
  { value: 'SEGUIMIENTO', label: 'Seguimiento' },
  { value: 'URGENTE', label: 'Urgente' },
  { value: 'RENOVACION', label: 'Renovación' },
  { value: 'VERIFICACION_PENDIENTE', label: 'Verificación pendiente' },
  { value: 'CONTACTO_CLIENTE', label: 'Contacto con cliente' },
] as const;

export type RecordatorioTipo = (typeof RECORDATORIO_TIPOS)[number]['value'];
export type RecordatorioAntelacion = (typeof RECORDATORIO_ANTELACIONES)[number]['value'];
export type RecordatorioMotivo = (typeof RECORDATORIO_MOTIVOS)[number]['value'];

export function getRecordatorioTipoLabel(value?: string | null) {
  return RECORDATORIO_TIPOS.find((item) => item.value === value)?.label ?? value ?? '—';
}

export function getRecordatorioAntelacionLabel(value?: string | null) {
  return RECORDATORIO_ANTELACIONES.find((item) => item.value === value)?.label ?? value ?? '—';
}

export function getRecordatorioMotivoLabel(value?: string | null) {
  if (!value) return '';
  return RECORDATORIO_MOTIVOS.find((item) => item.value === value)?.label ?? value;
}
