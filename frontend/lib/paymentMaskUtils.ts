export function maskCardNumber(value?: string | null): string {
  if (!value) return '—';
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 4) return value;
  const last4 = digits.slice(-4);
  return `${'x'.repeat(Math.max(12, digits.length - 4))}${last4}`;
}

export function maskCvv(value?: string | null): string {
  if (!value) return 'xxx';
  return 'x'.repeat(Math.max(3, value.length));
}

export function maskAccountNumber(value?: string | null): string {
  if (!value) return '—';
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 4) return value;
  const last4 = digits.slice(-4);
  return `xxxx xxxx ${last4}`;
}

export function maskRoutingNumber(value?: string | null): string {
  if (!value) return '—';
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return value;
  return `${'x'.repeat(Math.max(10, digits.length - 2))}${digits.slice(-2)}`;
}

export function formatPaymentCreatedAt(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

export function formatCardTypeLabel(value?: string | null): string {
  if (!value) return '—';
  const map: Record<string, string> = {
    VISA: 'Visa',
    MASTERCARD: 'Mastercard',
    AMEX: 'American Express',
    DISCOVER: 'Discover',
    DEBITO: 'Débito',
    CREDITO: 'Crédito',
    DEBIT: 'Débito',
    CREDIT: 'Crédito',
  };
  const key = value.trim().toUpperCase();
  return map[key] || value;
}
