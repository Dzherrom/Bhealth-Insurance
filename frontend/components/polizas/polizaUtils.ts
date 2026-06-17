export function parseDateForInput(value?: string | null): string {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const mdy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const [, m, d, y] = mdy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const parsed = new Date(value);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  return '';
}

export function formatFechaDisplay(value?: string | null): string {
  if (!value) return '-';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-');
    return `${m}/${d}/${y}`;
  }
  const parsed = new Date(value);
  if (!isNaN(parsed.getTime())) return parsed.toLocaleDateString();
  return value;
}

export function formatDireccion(direccion?: {
  linea1?: string;
  linea2?: string;
  ciudad?: string;
  estado?: string;
  zip_code?: string;
  condado?: string;
} | null): string {
  if (!direccion) return '-';
  const lineas = [direccion.linea1, direccion.linea2].filter(Boolean);
  const ciudad = [direccion.ciudad, direccion.estado, direccion.zip_code].filter(Boolean).join(', ');
  const parts = [...lineas, ciudad].filter(Boolean);
  if (direccion.condado) parts.push(`Condado: ${direccion.condado}`);
  return parts.join(' · ') || '-';
}

export function getPrincipalMember(clientesInfo?: any[]) {
  return (clientesInfo || []).find((m) => m.es_solicitante_principal) || null;
}

export function collectPolicyAddresses(poliza: any): any[] {
  const byId = new Map<number, any>();
  const add = (details: any) => {
    if (details?.id) byId.set(Number(details.id), details);
  };

  add(poliza?.direccion_fisica_details);
  add(poliza?.direccion_postal_details);
  add(poliza?.direccion_facturacion_details);

  (poliza?.clientes_info || []).forEach((member: any) => {
    add(member.direccion_residencia_details);
    add(member.direccion_postal_details);
  });

  return Array.from(byId.values());
}

export function formatCurrencyValue(amount?: string | number | null): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount || '0') : Number(amount || 0);
  if (!numAmount) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(numAmount);
}
