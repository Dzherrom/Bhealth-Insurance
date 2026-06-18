import { resolveApiMediaUrl } from '@/lib/api';

export interface NotaUsuarioDisplay {
  nombre: string;
  apellido: string;
  iniciales: string;
  rol?: string;
  avatar?: string;
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
