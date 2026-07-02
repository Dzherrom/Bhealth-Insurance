export function calculateAge(fechaNacimiento?: string | null): number | null {
  if (!fechaNacimiento) return null;
  let date: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)) {
    date = new Date(`${fechaNacimiento}T12:00:00`);
  } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(fechaNacimiento)) {
    const [m, d, y] = fechaNacimiento.split('/');
    date = new Date(Number(y), Number(m) - 1, Number(d));
  } else {
    date = new Date(fechaNacimiento);
  }
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return age;
}

export function maskDocumentNumber(value?: string | null): string {
  if (!value) return '—';
  if (value.length <= 4) return value;
  return `${value.slice(0, 3)}${'x'.repeat(Math.max(3, value.length - 6))}${value.slice(-3)}`;
}

export function formatIsoDateDisplay(value?: string | null): string {
  if (!value) return '—';
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-');
    return `${m}/${d}/${y}`;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US');
}

export const formatMemberBirthDate = formatIsoDateDisplay;

export function maskEmail(email?: string | null): string {
  if (!email) return '—';
  const [user, domain] = email.split('@');
  if (!domain) return email.slice(0, 2) + 'x'.repeat(Math.max(0, email.length - 2));
  const maskedUser = user.length <= 2 ? `${user[0] ?? ''}x` : `${user.slice(0, 2)}${'x'.repeat(Math.max(3, user.length - 2))}`;
  return `${maskedUser}@${domain}`;
}

export function maskPhone(phone?: string | null): string {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) return phone;
  return `${phone.slice(0, 2)}${'x'.repeat(Math.max(0, phone.length - 4))}${phone.slice(-2)}`;
}

export function formatUsd(value?: string | number | null): string {
  const num = typeof value === 'string' ? parseFloat(value || '0') : (value ?? 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number.isNaN(num) ? 0 : num);
}

export function getMemberFullName(details?: {
  primer_nombre?: string;
  segundo_nombre?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
} | null): string {
  if (!details) return '—';
  return [
    details.primer_nombre,
    details.segundo_nombre,
    details.apellido_paterno,
    details.apellido_materno,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function monthlyFromAnnual(annual: number): number {
  return annual / 12;
}
