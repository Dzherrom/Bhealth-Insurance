export const TIPOS_CAMBIO = [
  { value: 'NUEVA_DIRECCION', label: 'Nueva dirección' },
  { value: 'CAMBIO_INGRESOS', label: 'Cambio en los ingresos' },
  { value: 'CAMBIO_ESTADO_MIGRATORIO', label: 'Cambio en el estado migratorio' },
  { value: 'NUEVO_MIEMBRO', label: 'Nuevo miembro de la familia' },
  { value: 'EMBARAZO', label: 'Embarazo' },
  { value: 'FALLECIDO', label: 'Fallecido' },
  { value: 'OTROS', label: 'Otros cambios' },
] as const;

export const ESTADOS_CAMBIO = [
  { value: 'PENDIENTE', label: 'Pendiente', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  { value: 'EN_PROCESO', label: 'En proceso', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  { value: 'COMPLETADO', label: 'Realizado', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { value: 'CANCELADO', label: 'Cancelado', color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
] as const;

export const BLOG_FILTERS = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'PENDIENTES', label: 'Pendientes' },
  { value: 'REALIZADOS', label: 'Realizados' },
] as const;

export function isEstadoPendiente(estado: string) {
  return estado === 'PENDIENTE' || estado === 'EN_PROCESO';
}

export function isEstadoRealizado(estado: string) {
  return estado === 'COMPLETADO';
}

export function matchesBlogFilter(estado: string, filter: string) {
  if (filter === 'PENDIENTES') return isEstadoPendiente(estado);
  if (filter === 'REALIZADOS') return isEstadoRealizado(estado);
  return true;
}

export const ESTATUS_MIGRATORIOS = [
  { value: 'Ciudadano', label: 'Ciudadano' },
  { value: 'Residente_permanente', label: 'Residente permanente' },
  { value: 'Visa_trabajo', label: 'Visa de trabajo' },
  { value: 'Visa_estudiante', label: 'Visa de estudiante' },
  { value: 'Asilado', label: 'Asilado' },
  { value: 'Desconocido', label: 'Desconocido' },
  { value: 'Otro', label: 'Otro' },
] as const;

export const DIRECCION_TIPOS = [
  { value: 'direccion_fisica', label: 'Dirección física' },
  { value: 'direccion_postal', label: 'Dirección postal' },
  { value: 'direccion_facturacion', label: 'Dirección de facturación' },
] as const;

export interface DireccionFormData {
  linea1: string;
  linea2: string;
  ciudad: string;
  estado: string;
  zip_code: string;
  condado: string;
}

export interface DependienteFormData {
  primerNombre: string;
  segundoNombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  sexo: string;
  telefono: string;
  email: string;
  usaTabaco: boolean;
  peso: string;
  estatura: string;
  condicionMedica: string;
  relacion: string;
}

export const emptyDireccion = (): DireccionFormData => ({
  linea1: '',
  linea2: '',
  ciudad: '',
  estado: '',
  zip_code: '',
  condado: '',
});

export const emptyDependiente = (): DependienteFormData => ({
  primerNombre: '',
  segundoNombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  fechaNacimiento: '',
  sexo: 'Masculino',
  telefono: '',
  email: '',
  usaTabaco: false,
  peso: '',
  estatura: '',
  condicionMedica: '',
  relacion: 'DEPENDIENTE',
});

export type CambioDeVidaDatos = Record<string, unknown>;

const PORTAL_CAMPO_LABELS: Record<string, string> = {
  fecha_nacimiento: 'Fecha de nacimiento',
  direccion: 'Dirección completa',
  telefono: 'Teléfono',
  email: 'Correo electrónico',
  estatus_poliza: 'Estatus de póliza',
  ingresos: 'Ingresos',
  grupo_familiar: 'Grupo familiar',
  tarjetas_digitales: 'Tarjetas digitales',
};

export function isPortalClienteOrigen(datos?: CambioDeVidaDatos | null): boolean {
  return datos?.origen === 'PORTAL_CLIENTE';
}

function buildPortalClientDetailLines(datos: CambioDeVidaDatos): string[] {
  if (datos.tipo_solicitud === 'DOCUMENTO') {
    const lines = ['Solicitud de documento desde portal del cliente'];
    if (datos.titulo) lines.push(`Documento: ${String(datos.titulo)}`);
    if (datos.categoria) lines.push(`Categoría: ${String(datos.categoria)}`);
    if (datos.documento_id) lines.push(`ID documento: ${String(datos.documento_id)}`);
    return lines;
  }

  const campos = datos.campos_solicitados as Record<string, unknown> | undefined;
  if (!campos) return ['Solicitud desde portal del cliente'];

  return Object.entries(campos).map(([key, value]) => {
    const label = PORTAL_CAMPO_LABELS[key] || key;
    return `${label}: ${String(value ?? '')}`;
  });
}

function buildPortalClientDescripcion(datos: CambioDeVidaDatos): string {
  if (datos.tipo_solicitud === 'DOCUMENTO') {
    return `Documento solicitado: ${String(datos.titulo || 'Archivo')}`;
  }

  const campos = datos.campos_solicitados as Record<string, unknown> | undefined;
  if (!campos || Object.keys(campos).length === 0) {
    return 'Solicitud desde portal del cliente';
  }

  const keys = Object.keys(campos);
  const firstLabel = PORTAL_CAMPO_LABELS[keys[0]] || keys[0];
  if (keys.length === 1) {
    return `Solicitud portal: ${firstLabel}`;
  }
  return `Solicitud portal: ${keys.length} campos actualizados`;
}

export function getMemberName(member: any): string {
  const c = member?.cliente_details;
  if (!c) return 'Miembro';
  return `${c.primer_nombre || ''} ${c.apellido_paterno || ''}`.trim();
}

export function isFemaleMember(member: any): boolean {
  const genero = (member?.cliente_details?.genero || '').toLowerCase();
  return genero.includes('femenin') || genero === 'f';
}

export function buildBlogDetailLines(tipo: string, datos: CambioDeVidaDatos): string[] {
  if (isPortalClienteOrigen(datos)) {
    return buildPortalClientDetailLines(datos);
  }

  const lines: string[] = [];
  switch (tipo) {
    case 'CAMBIO_INGRESOS':
      if (datos.miembro_nombre) lines.push(`Miembro: ${datos.miembro_nombre}`);
      if (datos.trabaja_por_cuenta) lines.push('Trabaja por su cuenta: Sí');
      if (datos.nombre_empleador) lines.push(`Empleador: ${datos.nombre_empleador}`);
      if (datos.telefono_empleador) lines.push(`Tel. empleador: ${datos.telefono_empleador}`);
      if (datos.cargo_ocupacion) lines.push(`Cargo: ${datos.cargo_ocupacion}`);
      if (datos.ingresos_anuales) lines.push(`Ingresos anuales: $${datos.ingresos_anuales}`);
      break;
    case 'NUEVA_DIRECCION': {
      if (datos.direccion_tipo_label) lines.push(`Dirección: ${datos.direccion_tipo_label}`);
      const d = datos.direccion as DireccionFormData | undefined;
      if (d?.linea1) lines.push(`${d.linea1}${d.linea2 ? `, ${d.linea2}` : ''}`);
      if (d?.ciudad) lines.push(`${d.ciudad}, ${d.estado} ${d.zip_code}`);
      if (d?.condado) lines.push(`Condado: ${d.condado}`);
      break;
    }
    case 'CAMBIO_ESTADO_MIGRATORIO':
      if (datos.miembro_nombre) lines.push(`Miembro: ${datos.miembro_nombre}`);
      if (datos.estado_migratorio_label || datos.estado_migratorio) {
        lines.push(`Nuevo estatus: ${datos.estado_migratorio_label || datos.estado_migratorio}`);
      }
      break;
    case 'NUEVO_MIEMBRO': {
      const dep = datos.dependiente as DependienteFormData | undefined;
      if (dep) {
        lines.push(`Nombre: ${dep.primerNombre} ${dep.apellidoPaterno}`.trim());
        if (dep.fechaNacimiento) lines.push(`Nacimiento: ${dep.fechaNacimiento}`);
        if (dep.sexo) lines.push(`Sexo: ${dep.sexo}`);
      }
      break;
    }
    case 'EMBARAZO':
      if (datos.miembro_nombre) lines.push(`Miembro: ${datos.miembro_nombre}`);
      break;
    case 'FALLECIDO':
      if (datos.miembro_nombre) lines.push(`Fallecido: ${datos.miembro_nombre}`);
      if (datos.nota_adicional) lines.push(`Nota: ${datos.nota_adicional}`);
      break;
    case 'OTROS':
      if (datos.descripcion_cambio) lines.push(String(datos.descripcion_cambio));
      break;
  }
  return lines;
}

export function buildDescripcionFromDatos(tipo: string, datos: CambioDeVidaDatos): string {
  if (isPortalClienteOrigen(datos)) {
    return buildPortalClientDescripcion(datos);
  }

  switch (tipo) {
    case 'CAMBIO_INGRESOS':
      return `Cambio de ingresos para ${datos.miembro_nombre || 'miembro'} — $${datos.ingresos_anuales || '0'}/año`;
    case 'NUEVA_DIRECCION':
      return `Nueva dirección (${datos.direccion_tipo_label || datos.direccion_tipo || 'dirección'})`;
    case 'CAMBIO_ESTADO_MIGRATORIO':
      return `Cambio migratorio de ${datos.miembro_nombre || 'miembro'} → ${datos.estado_migratorio_label || datos.estado_migratorio}`;
    case 'NUEVO_MIEMBRO': {
      const dep = datos.dependiente as DependienteFormData | undefined;
      return dep
        ? `Nuevo miembro: ${dep.primerNombre} ${dep.apellidoPaterno}`.trim()
        : 'Nuevo miembro de la familia';
    }
    case 'EMBARAZO':
      return `Embarazo — ${datos.miembro_nombre || 'miembro'}`;
    case 'FALLECIDO':
      return `Fallecido — ${datos.miembro_nombre || 'miembro'}`;
    case 'OTROS':
      return String(datos.descripcion_cambio || 'Otros cambios');
    default:
      return '';
  }
}
