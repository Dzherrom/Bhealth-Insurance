import { resolveApiMediaUrl } from '@/lib/api';

export interface NotaAdjuntoApi {
  id?: number;
  archivo?: string | null;
  nombre?: string | null;
}

export interface NotaApi {
  id?: number;
  contenido?: string;
  fecha_creacion?: string;
  archivo?: string | null;
  adjuntos?: NotaAdjuntoApi[];
  autor_username?: string;
  autor_nombre_completo?: string;
  autor_avatar?: string | null;
  autor_rol?: string | null;
}

export interface NotaArchivoItem {
  url: string;
  nombre: string;
  id?: number;
}

export function isImageUrl(url: string): boolean {
  return /\.(jpeg|jpg|gif|png|webp|svg|bmp)(\?|$)/i.test(url);
}

export function getNotaArchivos(nota: NotaApi): NotaArchivoItem[] {
  const items: NotaArchivoItem[] = [];

  const archivoUrl = resolveApiMediaUrl(nota.archivo);
  if (archivoUrl) {
    items.push({
      url: archivoUrl,
      nombre: archivoUrl.split('/').pop()?.split('?')[0] || 'Archivo',
    });
  }

  for (const adjunto of nota.adjuntos ?? []) {
    const url = resolveApiMediaUrl(adjunto.archivo);
    if (!url) continue;
    items.push({
      url,
      nombre: adjunto.nombre || url.split('/').pop()?.split('?')[0] || 'Archivo',
      id: adjunto.id,
    });
  }

  return items;
}

export function notaHasContent(nota: NotaApi): boolean {
  return Boolean(nota.contenido?.trim()) || getNotaArchivos(nota).length > 0;
}

export interface NotaUsuarioDisplay {
  nombre: string;
  apellido: string;
  iniciales: string;
  rol?: string;
  avatar?: string;
}

export function getLatestNota(notas?: NotaApi[] | null): NotaApi | null {
  if (!notas?.length) return null;

  return [...notas].sort((a, b) => {
    const dateA = a.fecha_creacion ? new Date(a.fecha_creacion).getTime() : 0;
    const dateB = b.fecha_creacion ? new Date(b.fecha_creacion).getTime() : 0;
    return dateB - dateA;
  })[0];
}

export function formatNotaFecha(dateString?: string): string {
  if (!dateString) return '';
  const fecha = new Date(dateString);
  if (Number.isNaN(fecha.getTime())) return '';

  const ahora = new Date();
  const diferencia = ahora.getTime() - fecha.getTime();
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

  if (dias === 0) {
    return `Hoy ${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (dias === 1) {
    return `Ayer ${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (dias < 7) {
    return `Hace ${dias} días`;
  }

  return fecha.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function mapNotaUsuario(n: {
  autor_username?: string;
  autor_nombre_completo?: string;
  autor_avatar?: string | null;
  autor_rol?: string | null;
}): NotaUsuarioDisplay {
  const username = n.autor_username || 'Usuario';
  const nombreCompleto = (n.autor_nombre_completo || username).trim();
  const nameParts = nombreCompleto.split(/\s+/).filter(Boolean);
  const iniciales = nameParts.length >= 2
    ? `${nameParts[0][0] || ''}${nameParts[nameParts.length - 1][0] || ''}`
    : nombreCompleto.slice(0, 2);

  return {
    nombre: nombreCompleto,
    apellido: nombreCompleto !== username ? `@${username}` : '',
    iniciales: (iniciales || 'U').toUpperCase(),
    rol: n.autor_rol || undefined,
    avatar: resolveApiMediaUrl(n.autor_avatar),
  };
}
