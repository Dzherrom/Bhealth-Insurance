import type { Cliente } from '@/types';
import { clientesApi, type ClienteWizardContext } from '@/lib/api';

export type WizardFamilyMember = {
  primerNombre: string;
  segundoNombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  sexo: string;
  telefono: string;
  email: string;
  ssn: string;
  usaTabaco: boolean;
  peso: string;
  estatura: string;
  condicionMedica: string;
  relacion: string;
  clienteId?: number | null;
};

export type WizardFormSnapshot = {
  personal: ReturnType<typeof mapClienteToWizardPersonal> & { esAplicante: boolean };
  ingresoAnual: string;
  tamanoFamilia: string;
  address: ReturnType<typeof mapDireccionToWizardAddress>;
  conyuge: WizardFamilyMember | null;
  dependientes: WizardFamilyMember[];
};

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

export function mapDireccionToWizardAddress(direccion?: DireccionLike | null) {
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

export function mapClienteToWizardAddress(cliente: Cliente) {
  const direccion =
    cliente.direccion_fisica_details ??
    (cliente as Cliente & { direccion_info?: DireccionLike }).direccion_info;

  return mapDireccionToWizardAddress(direccion);
}

export function mergeCountyOptions(apiCounties: string[], savedCondado?: string | null): string[] {
  const list = [...apiCounties];
  const condado = savedCondado?.trim();
  if (condado && !list.includes(condado)) {
    return [condado, ...list];
  }
  return list;
}

const CONYUGE_RELACIONES = new Set(['CONYUGE', 'CÓNYUGE', 'CONYUGUE', 'SPOUSE', 'ESPOSO', 'ESPOSA']);

function isConyugeRelacion(relacion?: string | null): boolean {
  if (!relacion) return false;
  return CONYUGE_RELACIONES.has(relacion.trim().toUpperCase());
}

function mapClienteDetailsToFamilyMember(
  cliente: Cliente,
  relacion: string,
  clienteId: number
): WizardFamilyMember {
  const personal = mapClienteToWizardPersonal(cliente);
  return {
    ...personal,
    relacion,
    clienteId,
  };
}

export function mapClienteWizardContext(context: ClienteWizardContext): WizardFormSnapshot {
  const cliente = context.cliente;
  const poliza = context.poliza_referencia;

  const principalLink = poliza?.clientes_info?.find((link) => link.es_solicitante_principal);
  const principalDetails = principalLink?.cliente_details ?? cliente;

  const addressSource =
    poliza?.direccion_fisica_details ??
    principalLink?.direccion_residencia_details ??
    cliente.direccion_fisica_details ??
    null;

  let conyuge: WizardFamilyMember | null = null;
  const dependientes: WizardFamilyMember[] = [];

  poliza?.clientes_info?.forEach((link) => {
    if (link.es_solicitante_principal || !link.cliente_details) return;

    const member = mapClienteDetailsToFamilyMember(
      link.cliente_details,
      link.relacion || 'DEPENDIENTE',
      link.cliente
    );

    if (isConyugeRelacion(link.relacion) && !conyuge) {
      conyuge = member;
      return;
    }

    dependientes.push(member);
  });

  const ingresoRaw =
    principalDetails.ingreso_anual ??
    cliente.ingreso_anual ??
    '0';

  const tamanoFamilia = poliza?.total_miembros
    ? String(poliza.total_miembros)
    : String(1 + dependientes.length + (conyuge ? 1 : 0));

  return {
    personal: {
      ...mapClienteToWizardPersonal(principalDetails),
      esAplicante: true,
    },
    ingresoAnual: String(ingresoRaw),
    tamanoFamilia,
    address: mapDireccionToWizardAddress(addressSource),
    conyuge,
    dependientes,
  };
}

export function buildContactEntriesFromWizard(input: {
  applicantMode: 'new' | 'existing';
  selectedExistingClienteId?: number | null;
  principal: {
    email?: string;
    ssn?: string;
  };
  conyuge?: { email?: string | null; ssn?: string | null; excludeClienteId?: number } | null;
  dependientes?: Array<{ email?: string | null; ssn?: string | null; excludeClienteId?: number }>;
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
      excludeClienteId: input.conyuge.excludeClienteId,
    });
  }

  input.dependientes?.forEach((dep, index) => {
    if (!dep.email?.trim() && !dep.ssn?.trim()) return;
    entries.push({
      key: `dependiente-${index}`,
      label: `dependiente ${index + 1}`,
      email: dep.email,
      ssn: dep.ssn,
      excludeClienteId: dep.excludeClienteId,
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
