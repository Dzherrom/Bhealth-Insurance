export const CAMPO_LABELS: Record<string, string> = {
  fecha_nacimiento: 'Fecha de nacimiento',
  direccion: 'Dirección completa',
  telefono: 'Teléfono',
  email: 'Correo electrónico',
  estatus_poliza: 'Estatus de póliza',
  ingresos: 'Ingresos anuales',
  grupo_familiar: 'Grupo familiar',
  tarjetas_digitales: 'Tarjetas digitales',
  cuentas_bancarias: 'Cuentas bancarias',
};

export const MIEMBRO_CAMPOS = [
  { value: 'telefono', label: 'Teléfono' },
  { value: 'email', label: 'Correo electrónico' },
  { value: 'fecha_nacimiento', label: 'Fecha de nacimiento' },
  { value: 'ingresos', label: 'Ingresos anuales' },
  { value: 'direccion', label: 'Dirección' },
];

export const DOCUMENTO_CATEGORIAS = [
  { value: 'IDENTIFICACION', label: 'Identificación' },
  { value: 'ESTATUS_MIGRATORIO', label: 'Estatus migratorio' },
  { value: 'CARTA_MERCADO', label: 'Carta de mercado' },
  { value: 'ASEGURANZA', label: 'Aseguranza' },
  { value: 'CONSENTIMIENTO', label: 'Consentimiento' },
  { value: 'OTRO', label: 'Otro documento' },
];

export const POLIZA_DETAIL_FIELDS = [
  { key: 'estatus', label: 'Estatus' },
  { key: 'plan', label: 'Plan asignado' },
  { key: 'tipo_producto', label: 'Tipo de producto' },
  { key: 'aseguradora', label: 'Aseguradora' },
  { key: 'metal', label: 'Metal del plan' },
  { key: 'prima_mensual', label: 'Prima mensual', format: 'currency' },
  { key: 'costo_poliza', label: 'Costo de póliza', format: 'currency' },
  { key: 'subsidio', label: 'Subsidio', format: 'currency' },
  { key: 'fecha_efectiva', label: 'Fecha efectiva', format: 'date' },
  { key: 'id_mercado', label: 'ID mercado' },
] as const;

export const cardClass =
  'border-[#e2e8f0] bg-white shadow-sm transition-all duration-300 hover:shadow-md';

/** Clases explícitas de modo claro para el portal (anula estilos dark del tema global). */
export const clientLight = {
  input:
    '!bg-white dark:!bg-white border-[#e2e8f0] !text-[#0f172a] placeholder:text-[#94a3b8] shadow-sm focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20',
  textarea:
    '!bg-white dark:!bg-white border-[#e2e8f0] !text-[#0f172a] placeholder:text-[#94a3b8] shadow-sm focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20',
  label: 'text-[#334155] font-medium',
  selectTrigger:
    '!w-full min-w-0 max-w-full !bg-white dark:!bg-white border-[#e2e8f0] !text-[#0f172a] shadow-sm [&_svg]:!text-[#64748b] data-[placeholder]:!text-[#94a3b8]',
  selectContent:
    '!bg-white dark:!bg-white border border-[#e2e8f0] !text-[#0f172a] shadow-lg z-[200]',
  selectItem:
    '!text-[#0f172a] focus:!bg-emerald-50 focus:!text-emerald-900 data-[highlighted]:!bg-emerald-50 data-[highlighted]:!text-emerald-900',
  dialog:
    '!bg-white dark:!bg-white border-[#e2e8f0] !text-[#0f172a] shadow-xl',
  dialogTitle: 'text-[#0f172a]',
  dialogDescription: 'text-[#64748b]',
  nativeSelect:
    'flex h-10 w-full rounded-md border border-[#e2e8f0] bg-white px-3 py-1 text-sm text-[#0f172a] shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
  comboboxTrigger:
    '!w-full !bg-white dark:!bg-white border-[#e2e8f0] !text-[#0f172a] hover:!bg-[#f8fafc] shadow-sm',
  comboboxContent:
    '!bg-white dark:!bg-white border border-[#e2e8f0] !text-[#0f172a] shadow-lg z-[200]',
  cardOverflow: 'min-w-0 overflow-hidden',
  outlineButton:
    '!bg-white dark:!bg-white border-[#e2e8f0] !text-[#334155] hover:!bg-[#f8fafc] hover:!text-[#0f172a] shadow-sm',
  outlineButtonDanger:
    '!bg-white dark:!bg-white border-[#e2e8f0] !text-red-600 hover:!bg-red-50 hover:!text-red-700 hover:!border-red-200 shadow-sm',
};

export function formatCurrency(value?: string | null) {
  if (!value) return '—';
  const num = parseFloat(value);
  if (Number.isNaN(num)) return value;
  return `$${num.toLocaleString('es-MX')}`;
}

export function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-MX');
}

export function previewFileType(contentType: string): 'pdf' | 'jpg' | 'png' | 'doc' {
  if (contentType.includes('pdf')) return 'pdf';
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
  return 'doc';
}
