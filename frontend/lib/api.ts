// Importar tipos organizados
import {
  ApiResponse,
  AuthTokens,
  User,
  RegisterData,
  LoginData,
  RefreshTokenResponse,
  UserUpdate,
  Cliente,
  ClienteCreate,
  ClienteUpdate,
  Direccion,
  DireccionCreate,
  DireccionUpdate,
  Poliza,
  PolizaCreate,
  PolizaUpdate,
  PolizaResponse,
  Plan,
  EstadoPoliza,
  Aseguradora,
  Agencia,
  AgenciaCreate,
  AgenciaUpdate,
  Agente,
  AgenteCreate,
  AgenteUpdate,
  Tarea,
  TareaCreate,
  TareaUpdate,
  MisTareasResponse,
  BaseEntity,
  OptionalBaseEntity
} from '../types';

// Configuracion base de la API. Lee del entorno local si existe, si no, define el prod o el local.
// Para probar modo local: NEXT_PUBLIC_API_URL="http://127.0.0.1:8000/api"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

// Utilidad para obtener el token de autenticación
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const directToken = localStorage.getItem('access_token');
    if (directToken) return directToken;

    // Fallback: Zustand persist storage (auth-storage)
    const persistedAuthRaw = localStorage.getItem('auth-storage');
    if (persistedAuthRaw) {
      try {
        const persistedAuth = JSON.parse(persistedAuthRaw);
        const tokenFromPersist = persistedAuth?.state?.accessToken;
        if (tokenFromPersist) return tokenFromPersist;
      } catch {
        // Ignore malformed persisted data and continue with next fallback.
      }
    }

    // Fallback: cookie used by middleware/session sync.
    const cookieToken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('access_token='))
      ?.split('=')[1];

    if (cookieToken) return decodeURIComponent(cookieToken);
  }
  return null;
};

// Utilidad para configurar headers de autorización
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const getAuthHeadersWithoutContentType = (): HeadersInit => {
  const token = getAuthToken();
  return {
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Utilidad para manejar respuestas de la API
const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  
  return {} as T;
};

// =============================================================================
// 🔐 AUTENTICACIÓN Y PERFIL
// =============================================================================

export const authApi = {
  // Registrar nuevo usuario
  register: async (data: RegisterData): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleApiResponse<User>(response);
  },

  // Iniciar sesión
  login: async (data: LoginData): Promise<AuthTokens> => {
    const response = await fetch(`${API_BASE_URL}/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const tokens = await handleApiResponse<AuthTokens>(response);
    
    // Guardar tokens en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
    }
    
    return tokens;
  },

  // Refrescar token JWT
  refreshToken: async (): Promise<RefreshTokenResponse> => {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/login/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    
    const result = await handleApiResponse<RefreshTokenResponse>(response);
    
    // Actualizar token de acceso
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', result.access);
    }
    
    return result;
  },

  // Obtener perfil del usuario
  getProfile: async (): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/profile/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleApiResponse<User>(response);
  },

  // Actualizar perfil del usuario
  updateProfile: async (data: UserUpdate): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/profile/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleApiResponse<User>(response);
  },

  // Cerrar sesión
  logout: async (): Promise<void> => {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    
    if (refreshToken) {
      try {
        await fetch(`${API_BASE_URL}/logout/`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ refresh: refreshToken }),
        });
      } catch (error) {
        console.warn('Error during logout:', error);
      }
    }
    
    // Limpiar tokens del localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },
};

// =============================================================================
// 📋 FUNCIONES CRUD GENÉRICAS
// =============================================================================

// Función genérica para operaciones CRUD
const createCrudApi = <T extends OptionalBaseEntity, TCreate = Omit<T, 'id'>, TUpdate = Partial<TCreate>>(
  endpoint: string
) => ({
  // Listar todos los registros
  list: async (): Promise<T[]> => {
    const response = await fetch(`${API_BASE_URL}/${endpoint}/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleApiResponse<T[]>(response);
  },

  // Obtener un registro por ID
  get: async (id: number): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleApiResponse<T>(response);
  },

  // Crear un nuevo registro
  create: async (data: TCreate): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}/${endpoint}/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleApiResponse<T>(response);
  },

  // Actualizar un registro completo
  update: async (id: number, data: TCreate): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}/`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleApiResponse<T>(response);
  },

  // Actualizar parcialmente un registro
  patch: async (id: number, data: TUpdate): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleApiResponse<T>(response);
  },

  // Actualizar parcialmente con multipart/form-data
  patchFormData: async (id: number, data: FormData): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}/`, {
      method: 'PATCH',
      headers: getAuthHeadersWithoutContentType(),
      body: data,
    });
    return handleApiResponse<T>(response);
  },

  // Eliminar un registro
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleApiResponse<void>(response);
  },
});

// Función para APIs de solo lectura
const createReadOnlyApi = <T extends OptionalBaseEntity>(endpoint: string) => ({
  // Listar todos los registros
  list: async (): Promise<T[]> => {
    const response = await fetch(`${API_BASE_URL}/${endpoint}/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleApiResponse<T[]>(response);
  },

  // Obtener un registro por ID
  get: async (id: number): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleApiResponse<T>(response);
  },
});

// =============================================================================
// 🏢 INTERFACES ADICIONALES (NO INCLUIDAS EN TYPES)
// =============================================================================

interface Nota extends OptionalBaseEntity {
  titulo: string;
  contenido: string;
  cliente?: number;
  poliza?: number;
  usuario: number;
  fecha_creacion?: string;
  fecha_modificacion?: string;
}

interface Historial extends OptionalBaseEntity {
  tabla: string;
  registro_id: number;
  accion: string;
  datos_anteriores?: any;
  datos_nuevos?: any;
  usuario: number;
  fecha: string;
}

interface Etiqueta extends OptionalBaseEntity {
  nombre: string;
  color?: string;
  descripcion?: string;
}

interface Documento extends OptionalBaseEntity {
  nombre: string;
  archivo: string;
  tipo?: string;
  cliente?: number;
  poliza?: number;
  usuario: number;
  fecha_subida?: string;
}

interface ManagedUserProfile {
  role?: string;
  status?: string;
  avatar?: string | null;
  telefono?: string | null;
  agente?: number | null;
}

interface ManagedUser extends OptionalBaseEntity {
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  groups?: string[];
  profile?: ManagedUserProfile;
  is_active?: boolean;
  date_joined?: string;
  last_login?: string | null;
}

// =============================================================================
// 📋 APIS PARA CADA RECURSO
// =============================================================================

// 🏢 Agencias
export const agenciasApi = {
  ...createCrudApi<Agencia, AgenciaCreate, AgenciaUpdate>('agencias'),
};

// 📍 Direcciones
export const direccionesApi = {
  ...createCrudApi<Direccion, DireccionCreate, DireccionUpdate>('direcciones'),
};

// 🕴️ Agentes
export const agentesApi = {
  ...createCrudApi<Agente, AgenteCreate, AgenteUpdate>('agentes'),
};

// 👥 Clientes
export const clientesApi = {
  ...createCrudApi<Cliente, ClienteCreate, ClienteUpdate>('clientes'),
};

// 🏦 Aseguradoras
export const aseguradorasApi = createCrudApi<Aseguradora>('aseguradoras');

// 📄 Planes
export const planesApi = createCrudApi<Plan>('planes');

// 👤 Gestión de Usuarios (CRM)
export const usersApi = {
  ...createCrudApi<ManagedUser, Partial<ManagedUser>, Partial<ManagedUser>>('users'),

  uploadAvatar: async (id: number, avatarFile: File): Promise<ManagedUser> => {
    const formData = new FormData();
    formData.append('avatar', avatarFile);

    const response = await fetch(`${API_BASE_URL}/users/${id}/avatar/`, {
      method: 'POST',
      headers: getAuthHeadersWithoutContentType(),
      body: formData,
    });

    return handleApiResponse<ManagedUser>(response);
  },
};

// 📊 Estados de Póliza
export const estadosPolizaApi = createCrudApi<EstadoPoliza>('estados-poliza');

// 📜 Pólizas - Con funciones especializadas
export const polizasApi = {
  ...createCrudApi<PolizaResponse, PolizaCreate, PolizaUpdate>('polizas'),
  
  // Descargar documentos de póliza
  downloadDocuments: async (id: number): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/polizas/${id}/download_documents/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.blob();
  },
};

// 📋 Tareas - Con función especializada para mis tareas
export const tareasApi = {
  ...createCrudApi<Tarea, TareaCreate, TareaUpdate>('tareas'),
  
  // Obtener tareas asignadas al usuario actual
  misTareas: async (): Promise<MisTareasResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/tareas/mis_tareas/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleApiResponse<MisTareasResponse[]>(response);
  },
};

// 📝 Notas
export const notasApi = createCrudApi<Nota>('notas');

// 🕰️ Historial (Solo lectura)
export const historialApi = createReadOnlyApi<Historial>('historial');

// 🏷️ Etiquetas
export const etiquetasApi = createCrudApi<Etiqueta>('etiquetas');

// 📂 Documentos
export const documentosApi = createCrudApi<Documento>('documentos');

// =============================================================================
// 🔧 UTILIDADES ADICIONALES
// =============================================================================

// Verificar si el usuario está autenticado
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('access_token');
};

// Obtener el token actual
export const getCurrentToken = (): string | null => {
  return getAuthToken();
};

export const resolveApiMediaUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
  const serverBase = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;

  if (path.startsWith('/')) {
    return `${serverBase}${path}`;
  }

  return `${serverBase}/${path}`;
};

// Configurar interceptor para renovar token automáticamente
export const setupTokenInterceptor = () => {
  // Esta función puede ser llamada en el layout principal
  // para configurar la renovación automática de tokens
  if (typeof window !== 'undefined') {
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await originalFetch(input, init);
      
      // Si la respuesta es 401 (no autorizado), intentar renovar el token
      if (response.status === 401 && response.url.includes(API_BASE_URL)) {
        try {
          await authApi.refreshToken();
          // Reintentar la petición original con el nuevo token
          const newHeaders = {
            ...init?.headers,
            Authorization: `Bearer ${getAuthToken()}`,
          };
          return originalFetch(input, { ...init, headers: newHeaders });
        } catch (error) {
          // Si la renovación falla, redirigir al login
          await authApi.logout();
          window.location.href = '/auth/login';
          throw error;
        }
      }
      
      return response;
    };
  }
};

// Exportar todas las APIs como un objeto principal
export const recordatoriosApi = createCrudApi<any>('recordatorios');

export const api = {
  auth: authApi,
  users: usersApi,
  agencias: agenciasApi,
  direcciones: direccionesApi,
  agentes: agentesApi,
  clientes: clientesApi,
  aseguradoras: aseguradorasApi,
  planes: planesApi,
  estadosPoliza: estadosPolizaApi,
  polizas: polizasApi,
  tareas: tareasApi,
  notas: notasApi,
  historial: historialApi,
  etiquetas: etiquetasApi,
  documentos: documentosApi,
};

export default api;
