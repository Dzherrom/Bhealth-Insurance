export const RELACIONES_FAMILIARES = [
  { value: 'HIJO', label: 'Hijo' },
  { value: 'CONYUGE', label: 'Cónyuge' },
  { value: 'PADRE_MADRE', label: 'Padre o madre' },
  { value: 'PAREJA_HECHO', label: 'Pareja de hecho' },
  { value: 'HERMANO_HERMANA', label: 'Hermano o hermana' },
  { value: 'SOBRINO_SOBRIINA', label: 'Sobrino o sobrina' },
  { value: 'TUTORADO', label: 'Tutorado' },
  { value: 'NIETO_NIETA', label: 'Nieto o nieta' },
  { value: 'DEPENDIENTE_PATROCINADO', label: 'Dependiente patrocinado' },
  { value: 'DEPENDIENTE_COLATERAL', label: 'Dependiente colateral' },
  { value: 'HIJO_ACOGIDO', label: 'Hijo acogido' },
  { value: 'EX_CONYUGE', label: 'Ex-cónyuge' },
  { value: 'OTRO_PARIENTE', label: 'Otro pariente' },
  { value: 'OTRA_RELACION', label: 'Otra relación' },
] as const;

export type RelacionFamiliarValue = (typeof RELACIONES_FAMILIARES)[number]['value'];

export const ESTADOS_CIVILES = [
  { value: 'Casado/a', label: 'Casado/a' },
  { value: 'Cabeza de familia', label: 'Cabeza de familia' },
  { value: 'Soltero/a', label: 'Soltero/a' },
  { value: 'Viudo/a', label: 'Viudo/a' },
  { value: 'Otro', label: 'Otro' },
] as const;

export type EstadoCivilValue = (typeof ESTADOS_CIVILES)[number]['value'];

export const PAISES_NACIMIENTO = [
  'Afganistán',
  'Albania',
  'Alemania',
  'Andorra',
  'Angola',
  'Antigua y Barbuda',
  'Arabia Saudita',
  'Argelia',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaiyán',
  'Bahamas',
  'Bangladés',
  'Barbados',
  'Baréin',
  'Bélgica',
  'Belice',
  'Benín',
  'Bielorrusia',
  'Birmania',
  'Bolivia',
  'Bosnia y Herzegovina',
  'Botsuana',
  'Brasil',
  'Brunéi',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Bután',
  'Cabo Verde',
  'Camboya',
  'Camerún',
  'Canadá',
  'Catar',
  'Chad',
  'Chile',
  'China',
  'Chipre',
  'Colombia',
  'Comoras',
  'Corea del Norte',
  'Corea del Sur',
  'Costa de Marfil',
  'Costa Rica',
  'Croacia',
  'Cuba',
  'Dinamarca',
  'Dominica',
  'Ecuador',
  'Egipto',
  'El Salvador',
  'Emiratos Árabes Unidos',
  'Eritrea',
  'Eslovaquia',
  'Eslovenia',
  'España',
  'Estados Unidos',
  'Estonia',
  'Esuatini',
  'Etiopía',
  'Filipinas',
  'Finlandia',
  'Fiyi',
  'Francia',
  'Gabón',
  'Gambia',
  'Georgia',
  'Ghana',
  'Granada',
  'Grecia',
  'Guatemala',
  'Guinea',
  'Guinea-Bisáu',
  'Guinea Ecuatorial',
  'Guyana',
  'Haití',
  'Honduras',
  'Hungría',
  'India',
  'Indonesia',
  'Irak',
  'Irán',
  'Irlanda',
  'Islandia',
  'Islas Marshall',
  'Islas Salomón',
  'Israel',
  'Italia',
  'Jamaica',
  'Japón',
  'Jordania',
  'Kazajistán',
  'Kenia',
  'Kirguistán',
  'Kiribati',
  'Kuwait',
  'Laos',
  'Lesoto',
  'Letonia',
  'Líbano',
  'Liberia',
  'Libia',
  'Liechtenstein',
  'Lituania',
  'Luxemburgo',
  'Macedonia del Norte',
  'Madagascar',
  'Malasia',
  'Malaui',
  'Maldivas',
  'Malí',
  'Malta',
  'Marruecos',
  'Mauricio',
  'Mauritania',
  'México',
  'Micronesia',
  'Moldavia',
  'Mónaco',
  'Mongolia',
  'Montenegro',
  'Mozambique',
  'Namibia',
  'Nauru',
  'Nepal',
  'Nicaragua',
  'Níger',
  'Nigeria',
  'Noruega',
  'Nueva Zelanda',
  'Omán',
  'Países Bajos',
  'Pakistán',
  'Palaos',
  'Panamá',
  'Papúa Nueva Guinea',
  'Paraguay',
  'Perú',
  'Polonia',
  'Portugal',
  'Reino Unido',
  'República Centroafricana',
  'República Checa',
  'República del Congo',
  'República Democrática del Congo',
  'República Dominicana',
  'Ruanda',
  'Rumania',
  'Rusia',
  'Samoa',
  'San Cristóbal y Nieves',
  'San Marino',
  'San Vicente y las Granadinas',
  'Santa Lucía',
  'Santo Tomé y Príncipe',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Sierra Leona',
  'Singapur',
  'Siria',
  'Somalia',
  'Sri Lanka',
  'Sudáfrica',
  'Sudán',
  'Sudán del Sur',
  'Suecia',
  'Suiza',
  'Surinam',
  'Tailandia',
  'Tanzania',
  'Tayikistán',
  'Timor Oriental',
  'Togo',
  'Tonga',
  'Trinidad y Tobago',
  'Túnez',
  'Turkmenistán',
  'Turquía',
  'Tuvalu',
  'Ucrania',
  'Uganda',
  'Uruguay',
  'Uzbekistán',
  'Vanuatu',
  'Vaticano',
  'Venezuela',
  'Vietnam',
  'Yemen',
  'Yibuti',
  'Zambia',
  'Zimbabue',
] as const;

const RELACION_LABELS = Object.fromEntries(
  RELACIONES_FAMILIARES.map((item) => [item.value, item.label]),
) as Record<string, string>;

const CONYUGE_VALUES = new Set(['CONYUGE', 'CÓNYUGE', 'CONYUGUE', 'SPOUSE', 'ESPOSO', 'ESPOSA']);

export function getRelacionFamiliarLabel(value?: string | null): string {
  if (!value) return '—';
  const normalized = value.trim().toUpperCase();
  if (RELACION_LABELS[normalized]) return RELACION_LABELS[normalized];
  if (normalized === 'DEPENDIENTE') return 'Dependiente';
  return value;
}

export function isConyugeRelacion(value?: string | null): boolean {
  if (!value) return false;
  return CONYUGE_VALUES.has(value.trim().toUpperCase());
}

export function normalizePaisNacimiento(value?: string | null): string {
  if (!value || value === 'Desconocido') return '';
  if (value === 'USA') return 'Estados Unidos';
  return value;
}

export function normalizeEstadoCivil(value?: string | null): string {
  if (!value || value === 'Desconocido') return '';
  const map: Record<string, string> = {
    CASADO: 'Casado/a',
    CASADA: 'Casado/a',
    SOLTERO: 'Soltero/a',
    SOLTERA: 'Soltero/a',
    VIUDO: 'Viudo/a',
    VIUDA: 'Viudo/a',
    DIVORCIADO: 'Otro',
    DIVORCIADA: 'Otro',
  };
  const upper = value.trim().toUpperCase();
  return map[upper] || value;
}

export const IDIOMAS_PREFERIDOS = [
  { value: 'ES', label: 'Español' },
  { value: 'EN', label: 'Inglés' },
] as const;

export const ESTATUS_MIGRATORIOS = [
  { value: 'ASILO', label: 'Asilo' },
  { value: 'CIUDADANO', label: 'Ciudadano' },
  { value: 'ESTUDIANTE', label: 'Estudiante' },
  { value: 'PAROLE_HUMANITARIO', label: 'Parole humanitario' },
  { value: 'RESIDENTE', label: 'Residente' },
  { value: 'PROTECCION_TEMPORAL', label: 'Estatus de protección temporal' },
  { value: 'AUTORIZACION_TRABAJO', label: 'Autorización de trabajo' },
  { value: 'OTROS', label: 'Otros' },
] as const;

export const DOCUMENTOS_LEGALES = [
  { key: 'ssn', label: 'Seguro Social (SSN)' },
  { key: 'green_card', label: 'Green card' },
  { key: 'permiso_trabajo', label: 'Permiso de trabajo' },
  { key: 'pasaporte', label: 'Pasaporte' },
  { key: 'licencia', label: 'Licencia de conducir' },
] as const;

export type LegalDocumentType = (typeof DOCUMENTOS_LEGALES)[number]['key'];

export const CATEGORIA_POR_TIPO_LEGAL: Record<LegalDocumentType, string> = {
  ssn: 'IDENTIFICACION',
  green_card: 'ESTATUS_MIGRATORIO',
  permiso_trabajo: 'ESTATUS_MIGRATORIO',
  pasaporte: 'IDENTIFICACION',
  licencia: 'IDENTIFICACION',
};

export function getEstatusMigratorioLabel(value?: string | null): string {
  if (!value) return '—';
  const normalized = value.trim().toUpperCase();
  const found = ESTATUS_MIGRATORIOS.find(
    (item) => item.value === normalized || item.label.toLowerCase() === value.trim().toLowerCase(),
  );
  return found?.label ?? value;
}

export function getIdiomaLabel(value?: string | null): string {
  if (!value) return 'ES';
  return IDIOMAS_PREFERIDOS.find((item) => item.value === value)?.label ?? value;
}

export function isCiudadanoStatus(value?: string | null): boolean {
  if (!value) return false;
  const v = value.trim().toUpperCase();
  return v === 'CIUDADANO' || v === 'CIUDADANA' || value.toLowerCase() === 'ciudadano';
}
