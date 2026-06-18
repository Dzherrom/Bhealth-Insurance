import type { Cliente } from '@/types';
import { clientesApi } from '@/lib/api';

export function normalizeEmail(value?: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

export function normalizeSsn(value?: string | null): string {
  return (value ?? '').replace(/\D/g, '');
}

export function getClienteDisplayName(cliente: Pick<
  Cliente,
  'nombre_completo' | 'primer_nombre' | 'segundo_nombre' | 'apellido_paterno' | 'apellido_materno'
>): string {
  if (cliente.nombre_completo?.trim()) return cliente.nombre_completo.trim();
  return [
    cliente.primer_nombre,
    cliente.segundo_nombre,
    cliente.apellido_paterno,
    cliente.apellido_materno,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getClienteSearchLabel(cliente: Cliente): string {
  const nombre = getClienteDisplayName(cliente);
  const parts = [nombre];
  if (cliente.email?.trim()) parts.push(cliente.email.trim());
  if (cliente.telefono?.trim()) parts.push(cliente.telefono.trim());
  if (cliente.ssn?.trim()) parts.push(`SSN ${cliente.ssn.trim()}`);
  return parts.join(' · ');
}

export type ContactEntry = {
  key: string;
  label: string;
  email?: string | null;
  ssn?: string | null;
  excludeClienteId?: number;
};

export function findInternalDuplicateContacts(entries: ContactEntry[]): string | null {
  const emails = new Map<string, string>();
  const ssns = new Map<string, string>();

  for (const entry of entries) {
    const email = normalizeEmail(entry.email);
    if (email) {
      if (emails.has(email)) {
        return `El correo "${entry.email}" está repetido entre ${emails.get(email)} y ${entry.label}.`;
      }
      emails.set(email, entry.label);
    }

    const ssn = normalizeSsn(entry.ssn);
    if (ssn) {
      if (ssns.has(ssn)) {
        return `El SSN está repetido entre ${ssns.get(ssn)} y ${entry.label}.`;
      }
      ssns.set(ssn, entry.label);
    }
  }

  return null;
}

export function mapClienteToWizardPersonal(cliente: Cliente) {
  return {
    primerNombre: cliente.primer_nombre ?? '',
    segundoNombre: cliente.segundo_nombre ?? '',
    apellidoPaterno: cliente.apellido_paterno ?? '',
    apellidoMaterno: cliente.apellido_materno ?? '',
    fechaNacimiento: cliente.fecha_nacimiento?.split('T')[0] ?? '',
    sexo: cliente.genero ?? 'Masculino',
    telefono: cliente.telefono ?? '',
    email: cliente.email ?? '',
    ssn: cliente.ssn ?? '',
    usaTabaco: Boolean((cliente as Cliente & { usa_tabaco?: boolean }).usa_tabaco),
    peso: (cliente as Cliente & { peso?: string }).peso ?? '',
    estatura: (cliente as Cliente & { estatura?: string }).estatura ?? '',
    condicionMedica: (cliente as Cliente & { condicion_medica?: string }).condicion_medica ?? '',
  };
}

type DireccionLike = {
  linea1?: string;
  linea2?: string;
  ciudad?: string;
  estado?: string;
  zip_code?: string;
  condado?: string;
};

export function mapClienteToWizardAddress(cliente: Cliente) {
  const direccion =
    cliente.direccion_fisica_details ??
    (cliente as Cliente & { direccion_info?: DireccionLike }).direccion_info;

  if (!direccion) {
    return {
      direccion1: '',
      direccion2: '',
      ciudad: '',
      estadoProvincia: '',
      zipCode: '',
      condado: '',
    };
  }

  return {
    direccion1: direccion.linea1 ?? '',
    direccion2: direccion.linea2 ?? '',
    ciudad: direccion.ciudad ?? '',
    estadoProvincia: direccion.estado ?? '',
    zipCode: direccion.zip_code ?? '',
    condado: direccion.condado ?? '',
  };
}

export function buildContactEntriesFromWizard(input: {
  applicantMode: 'new' | 'existing';
  selectedExistingClienteId?: number | null;
  principal: {
    email?: string;
    ssn?: string;
  };
  conyuge?: { email?: string; ssn?: string } | null;
  dependientes?: Array<{ email?: string; ssn?: string }>;
}): ContactEntry[] {
  const entries: ContactEntry[] = [];

  if (input.applicantMode === 'new') {
    entries.push({
      key: 'principal',
      label: 'solicitante principal',
      email: input.principal.email,
      ssn: input.principal.ssn,
    });
  }

  if (input.conyuge?.email?.trim() || input.conyuge?.ssn?.trim()) {
    entries.push({
      key: 'conyuge',
      label: 'cónyuge',
      email: input.conyuge.email,
      ssn: input.conyuge.ssn,
    });
  }

  input.dependientes?.forEach((dep, index) => {
    if (!dep.email?.trim() && !dep.ssn?.trim()) return;
    entries.push({
      key: `dependiente-${index}`,
      label: `dependiente ${index + 1}`,
      email: dep.email,
      ssn: dep.ssn,
    });
  });

  return entries;
}

export async function validateContactsAgainstDatabase(entries: ContactEntry[]): Promise<string | null> {
  const internalError = findInternalDuplicateContacts(entries);
  if (internalError) return internalError;

  for (const entry of entries) {
    if (!normalizeEmail(entry.email) && !normalizeSsn(entry.ssn)) continue;

    const result = await clientesApi.verificarDuplicado({
      email: entry.email,
      ssn: entry.ssn,
      excludeId: entry.excludeClienteId,
    });

    if (result.duplicado && result.conflictos.length > 0) {
      const conflict = result.conflictos[0];
      const fieldLabel = conflict.field === 'email' ? 'correo electrónico' : 'SSN';
      return `${entry.label}: ya existe un cliente (${conflict.nombre}) con el mismo ${fieldLabel}. Seleccione "Cliente existente" o corrija los datos.`;
    }
  }

  return null;
}
