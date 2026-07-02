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
  PolizaListResponse,
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
  TipoProducto,
  MisTareasResponse,
  BaseEntity,
  OptionalBaseEntity
} from '../types';

// Configuracion base de la API.
// En produccion apunta al backend de Render por defecto; en desarrollo mantiene localhost.
// Para sobrescribir manualmente: NEXT_PUBLIC_API_URL="https://tu-backend/api".
const DEFAULT_API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://bhealth-insurance.onrender.com/api'
    : 'http://127.0.0.1:8000/api';

const normalizeApiBaseUrl = (rawUrl?: string): string => {
  const source = (rawUrl || DEFAULT_API_BASE_URL).trim().replace(/\/+$/, '');
  return source.endsWith('/api') ? source : `${source}/api`;
};

export const API_BASE_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);

const clearClientAuthStorage = () => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token');
  localStorage.removeItem('refresh');
  localStorage.removeItem('auth-storage');

  document.cookie = 'access_token=; Path=/; Max-Age=0; SameSite=Lax';
  document.cookie = 'user_role=; Path=/; Max-Age=0; SameSite=Lax';
  document.cookie = 'auth_session=; Path=/; Max-Age=0; SameSite=Lax';
  document.cookie = 'portal_client=; Path=/; Max-Age=0; SameSite=Lax';
};

// Utilidad para obtener el token de autenticación
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const directToken = localStorage.getItem('access_token');
    if (directToken) return directToken;

    // Fallback legacy key used by older frontend code.
    const legacyToken = localStorage.getItem('token');
    if (legacyToken) return legacyToken;

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
    const fieldErrors = Object.entries(errorData)
      .filter(([key]) => !['detail', 'message', 'error', 'non_field_errors'].includes(key))
      .flatMap(([key, value]) => {
        if (Array.isArray(value)) return value.map((item) => `${key}: ${item}`);
        if (typeof value === 'string') return [`${key}: ${value}`];
        return [];
      });

    const rawMessage =
      errorData.detail ||
      errorData.message ||
      errorData.error ||
      errorData.non_field_errors?.[0] ||
      fieldErrors[0] ||
      errorData.username?.[0] ||
      errorData.password?.[0] ||
      `HTTP ${response.status}`;

    const normalizedMessage = typeof rawMessage === 'string' ? rawMessage : JSON.stringify(rawMessage);

    const isLoginRequest = response.url.includes('/login/');

    if (response.status === 401 || response.status === 403) {
      if (
        isLoginRequest ||
        /no active account|unable to log in|incorrect|invalid credentials|credentials|credenciales|usuario/i.test(normalizedMessage)
      ) {
        throw new Error('Credenciales incorrectas o usuario no existe.');
      }

      throw new Error('No tienes permisos para acceder.');
    }

    throw new Error(normalizedMessage);
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

  registerCliente: async (data: RegisterData): Promise<{ id: number; username: string; email: string; cliente_id?: number | null }> => {
    const response = await fetch(`${API_BASE_URL}/register/cliente/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleApiResponse(response);
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
    let refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;

    if (!refreshToken && typeof window !== 'undefined') {
      // Fallback legacy key used by older frontend code.
      refreshToken = localStorage.getItem('refresh');
    }

    if (!refreshToken && typeof window !== 'undefined') {
      // Fallback: Zustand persisted auth storage.
      const persistedAuthRaw = localStorage.getItem('auth-storage');
      if (persistedAuthRaw) {
        try {
          const persistedAuth = JSON.parse(persistedAuthRaw);
          refreshToken = persistedAuth?.state?.refreshToken || null;
        } catch {
          refreshToken = null;
        }
      }
    }
    
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

  // Actualizar solo los settings del perfil
  updateSettings: async (settings: any): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/profile/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ settings }),
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
    clearClientAuthStorage();
  },
};

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Fetch wrapper that injects auth headers and attempts a single token refresh on 401/403.
export const fetchWithAuth = async (input: RequestInfo, init: RequestInit = {}): Promise<Response> => {
  // Simple rate limiter: ensure a minimum interval between outgoing requests
  // Configurable via NEXT_PUBLIC_API_MIN_INTERVAL_MS (milliseconds)
  const minInterval = Number(process.env.NEXT_PUBLIC_API_MIN_INTERVAL_MS) || 20;
  if (!(fetchWithAuth as any).__rateLimiter) {
    (fetchWithAuth as any).__rateLimiter = {
      last: 0,
      async wait() {
        const now = Date.now();
        const elapsed = now - (fetchWithAuth as any).__rateLimiter.last;
        const delay = Math.max(0, minInterval - elapsed);
        if (delay > 0) {
          await new Promise((r) => setTimeout(r, delay));
        }
        (fetchWithAuth as any).__rateLimiter.last = Date.now();
      },
    };
  }
  await (fetchWithAuth as any).__rateLimiter.wait();
  // Don't intercept refresh token requests
  if (typeof input === 'string' && input.includes('/login/refresh')) {
    return fetch(input, init);
  }

  const token = getAuthToken();
  const headers = new Headers(init.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(input, { ...init, headers });

  if (response.status === 401) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
      .then(newToken => {
        const newHeaders = new Headers(init.headers);
        newHeaders.set('Authorization', `Bearer ${newToken}`);
        return fetch(input, { ...init, headers: newHeaders });
      })
      .catch(err => {
        return Promise.reject(err);
      });
    }

    isRefreshing = true;

    return new Promise((resolve, reject) => {
      authApi.refreshToken()
        .then(res => {
          const newHeaders = new Headers(init.headers);
          newHeaders.set('Authorization', `Bearer ${res.access}`);
          processQueue(null, res.access);
          resolve(fetch(input, { ...init, headers: newHeaders }));
        })
        .catch(err => {
          processQueue(err, null);
          clearClientAuthStorage();
          if (typeof window !== 'undefined') {
            const loginPath = window.location.pathname.startsWith('/client')
              ? '/client'
              : '/auth/login';
            window.location.href = loginPath;
          }
          reject(err);
        })
        .finally(() => {
          isRefreshing = false;
        });
    });
  }

  return response;
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
    const response = await fetchWithAuth(`${API_BASE_URL}/${endpoint}/`, { method: 'GET' });
    return handleApiResponse<T[]>(response);
  },

  // Obtener un registro por ID
  get: async (id: number): Promise<T> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/${endpoint}/${id}/`, { method: 'GET' });
    return handleApiResponse<T>(response);
  },

  // Crear un nuevo registro
  create: async (data: TCreate): Promise<T> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/${endpoint}/`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
    return handleApiResponse<T>(response);
  },

  // Crear con multipart/form-data
  createFormData: async (data: FormData): Promise<T> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/${endpoint}/`, {
      method: 'POST',
      body: data,
      headers: getAuthHeadersWithoutContentType(),
    });
    return handleApiResponse<T>(response);
  },

  // Actualizar un registro completo
  update: async (id: number, data: TCreate): Promise<T> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/${endpoint}/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
    return handleApiResponse<T>(response);
  },

  // Actualizar parcialmente un registro
  patch: async (id: number, data: TUpdate): Promise<T> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/${endpoint}/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
    return handleApiResponse<T>(response);
  },

  // Actualizar parcialmente con multipart/form-data
  patchFormData: async (id: number, data: FormData): Promise<T> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/${endpoint}/${id}/`, {
      method: 'PATCH',
      body: data,
      headers: getAuthHeadersWithoutContentType(),
    });
    return handleApiResponse<T>(response);
  },

  // Eliminar un registro
  delete: async (id: number): Promise<void> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/${endpoint}/${id}/`, { method: 'DELETE' });
    return handleApiResponse<void>(response);
  },
});

// Función para APIs de solo lectura
const createReadOnlyApi = <T extends OptionalBaseEntity>(endpoint: string) => ({
  // Listar todos los registros
  list: async (): Promise<T[]> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/${endpoint}/`, { method: 'GET' });
    return handleApiResponse<T[]>(response);
  },

  // Obtener un registro por ID
  get: async (id: number): Promise<T> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/${endpoint}/${id}/`, { method: 'GET' });
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

export interface Etiqueta extends OptionalBaseEntity {
  nombre: string;
  color?: string;
  descripcion?: string;
  tipo?: 'DOCUMENTO' | 'POLIZA';
}

export interface Documento extends OptionalBaseEntity {
  nombre?: string;
  titulo?: string;
  archivo?: string | null;
  tipo?: string;
  categoria?: string;
  cliente?: number | null;
  poliza?: number;
  subido_por?: number | null;
  subido_por_username?: string;
  fecha_subida?: string;
  descarga_bloqueada?: boolean;
}

export interface Cita extends OptionalBaseEntity {
  poliza: number;
  poliza_codigo?: string;
  cliente?: number | null;
  cliente_nombre?: string | null;
  creado_por?: number;
  creado_por_username?: string;
  fecha_hora: string;
  proveedor: string;
  lugar: string;
  motivo?: string | null;
  estado: 'PROGRAMADA' | 'COMPLETADA' | 'CANCELADA' | 'NO_ASISTIO';
  notas?: string | null;
  medico_asignado?: number | null;
  fecha_creacion?: string;
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

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
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
export interface ClienteDuplicateCheckResult {
  duplicado: boolean;
  conflictos: Array<{
    field: 'email' | 'ssn';
    cliente_id: number;
    nombre: string;
  }>;
}

export interface ClienteWizardContext {
  cliente: Cliente;
  poliza_referencia: {
    id: number;
    total_miembros: number;
    total_aplicantes?: number;
    total_dependientes?: number;
    direccion_fisica_details?: {
      linea1?: string;
      linea2?: string;
      ciudad?: string;
      estado?: string;
      zip_code?: string;
      condado?: string;
    } | null;
    clientes_info: Array<{
      id: number;
      cliente: number;
      es_solicitante_principal: boolean;
      relacion: string;
      cliente_details?: Cliente;
      direccion_residencia_details?: {
        linea1?: string;
        linea2?: string;
        ciudad?: string;
        estado?: string;
        zip_code?: string;
        condado?: string;
      } | null;
    }>;
  } | null;
}

export const clientesApi = {
  ...createCrudApi<Cliente, ClienteCreate, ClienteUpdate>('clientes'),

  search: async (query: string, limit = 20): Promise<Cliente[]> => {
    const params = new URLSearchParams({
      search: query.trim(),
      page_size: String(limit),
    });
    const response = await fetchWithAuth(`${API_BASE_URL}/clientes/?${params.toString()}`, {
      method: 'GET',
    });
    const payload = await handleApiResponse<any>(response);
    if (Array.isArray(payload)) return payload;
    if (payload?.results && Array.isArray(payload.results)) return payload.results;
    return [];
  },

  verificarDuplicado: async (params: {
    email?: string | null;
    ssn?: string | null;
    excludeId?: number;
  }): Promise<ClienteDuplicateCheckResult> => {
    const searchParams = new URLSearchParams();
    if (params.email?.trim()) searchParams.set('email', params.email.trim());
    if (params.ssn?.trim()) searchParams.set('ssn', params.ssn.trim());
    if (params.excludeId) searchParams.set('exclude_id', String(params.excludeId));

    const response = await fetchWithAuth(
      `${API_BASE_URL}/clientes/verificar-duplicado/?${searchParams.toString()}`,
      { method: 'GET' }
    );
    return handleApiResponse<ClienteDuplicateCheckResult>(response);
  },

  getContextoPoliza: async (clienteId: number): Promise<ClienteWizardContext> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/clientes/${clienteId}/contexto-poliza/`, {
      method: 'GET',
    });
    return handleApiResponse<ClienteWizardContext>(response);
  },
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

  resetPassword: async (id: number): Promise<{ detail: string; temporary_password: string }> => {
    const response = await fetch(`${API_BASE_URL}/users/${id}/reset-password/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleApiResponse<{ detail: string; temporary_password: string }>(response);
  },

  deactivate: async (id: number): Promise<{ detail: string }> => {
    const response = await fetch(`${API_BASE_URL}/users/${id}/deactivate/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleApiResponse<{ detail: string }>(response);
  },

  activate: async (id: number): Promise<{ detail: string }> => {
    const response = await fetch(`${API_BASE_URL}/users/${id}/activate/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleApiResponse<{ detail: string }>(response);
  },
};

// 📊 Estados de Póliza
export const estadosPolizaApi = createCrudApi<EstadoPoliza>('estados-poliza');

// 📜 Pólizas - Con funciones especializadas
export const polizasApi = {
  ...createCrudApi<PolizaResponse, PolizaCreate, PolizaUpdate>('polizas'),

  listPaginated: async (
    params?: { page?: number; page_size?: number; [key: string]: string | number | boolean | undefined }
  ): Promise<PaginatedResponse<PolizaListResponse>> => {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        searchParams.append(key, String(value));
      });
    }

    const query = searchParams.toString();
    const url = `${API_BASE_URL}/polizas/${query ? `?${query}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const payload = await handleApiResponse<any>(response);

    // Compatibilidad: backend con paginación DRF o lista plana.
    if (Array.isArray(payload)) {
      return {
        count: payload.length,
        next: null,
        previous: null,
        results: payload,
      };
    }

    if (payload && Array.isArray(payload.results)) {
      return {
        count: typeof payload.count === 'number' ? payload.count : payload.results.length,
        next: payload.next ?? null,
        previous: payload.previous ?? null,
        results: payload.results,
      };
    }

    return {
      count: 0,
      next: null,
      previous: null,
      results: [],
    };
  },

  // Compatibilidad para pantallas antiguas que esperan arreglo directo.
  list: async (): Promise<PolizaListResponse[]> => {
    const page = await polizasApi.listPaginated({ page: 1, page_size: 200 });
    return page.results;
  },
  
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

  getCalendarioPrimas: async (id: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/polizas/${id}/calendario-primas/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleApiResponse<any>(response);
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

// 🔄 Cambios de vida
export const cambiosDeVidaApi = {
  ...createCrudApi<any>('cambios-de-vida'),

  listByPoliza: async (polizaId: number): Promise<any[]> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/cambios-de-vida/?poliza=${polizaId}`, { method: 'GET' });
    const payload = await handleApiResponse<any>(response);
    return Array.isArray(payload) ? payload : payload?.results || [];
  },
};

export interface PortalClienteDashboard {
  cliente_id: number;
  nombre_completo: string;
  fecha_nacimiento?: string | null;
  direccion_completa?: string | null;
  telefono?: string | null;
  email?: string | null;
  ingresos?: string | null;
  grupo_familiar: Array<{ nombre: string; relacion: string; es_solicitante_principal: boolean }>;
  tarjetas_digitales: Array<{ id: number; tipo_tarjeta: string; numero_enmascarado: string; nombre_titular: string; fecha_vencimiento: string }>;
  cuentas_bancarias?: Array<{
    id: number;
    nombre_banco: string;
    numero_enmascarado: string;
    titular_cuenta: string;
    aba_enmascarado?: string | null;
  }>;
  cambios_pendientes?: Array<{
    id: number;
    tipo: string;
    tipo_display: string;
    estado: string;
    estado_display: string;
    descripcion?: string | null;
    resumen: string;
    tipo_solicitud?: string | null;
    fecha_creacion?: string | null;
  }>;
  elegibilidad: Record<string, unknown>;
  agente: { nombre?: string | null; npn?: string | null };
  poliza?: {
    id: number;
    estatus?: string | null;
    plan?: string | null;
    prima_mensual?: string;
    costo_poliza?: string;
    subsidio?: string;
    fecha_efectiva?: string | null;
    id_mercado?: string;
  } | null;
  campos_editables?: string[];
  documentos_solicitados?: Array<{
    id: number;
    titulo: string;
    categoria: string;
    estado_documento: string;
    estado_display: string;
    fecha_subida?: string | null;
  }>;
  mensaje?: string;
}

export const portalClienteApi = {
  getDashboard: async (): Promise<PortalClienteDashboard> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/portal-cliente/dashboard/`, { method: 'GET' });
    return handleApiResponse<PortalClienteDashboard>(response);
  },
  solicitarCambio: async (payload: {
    poliza_id: number;
    campos: Record<string, unknown>;
    descripcion?: string;
  }) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/portal-cliente/solicitar-cambio/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleApiResponse(response);
  },
  solicitarDocumento: async (payload: FormData) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/portal-cliente/solicitar-documento/`, {
      method: 'POST',
      body: payload,
      headers: getAuthHeadersWithoutContentType(),
    });
    return handleApiResponse<{
      id: number;
      titulo: string;
      estado_documento: string;
      estado_display: string;
      mensaje: string;
    }>(response);
  },
};

// 📝 Notas
export const notasApi = {
  ...createCrudApi<Nota>('notas'),

  listByPoliza: async (polizaId: number | string): Promise<Nota[]> => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/notas/?poliza=${encodeURIComponent(String(polizaId))}`,
      { method: 'GET' }
    );
    const payload = await handleApiResponse<any>(response);
    if (Array.isArray(payload)) return payload;
    if (payload?.results && Array.isArray(payload.results)) return payload.results;
    return [];
  },
};

// 🕰️ Historial (Solo lectura)
export const historialApi = createReadOnlyApi<Historial>('historial');

// 🏷️ Etiquetas
export const etiquetasApi = createCrudApi<Etiqueta>('etiquetas');

// 📂 Documentos
export const documentosApi = {
  ...createCrudApi<Documento>('documentos'),

  listByPoliza: async (polizaId: number | string): Promise<Documento[]> => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/documentos/?poliza=${encodeURIComponent(String(polizaId))}`,
      { method: 'GET' }
    );
    const payload = await handleApiResponse<any>(response);
    if (Array.isArray(payload)) return payload;
    if (payload?.results && Array.isArray(payload.results)) return payload.results;
    return [];
  },
};

// 📅 Citas
export const citasApi = {
  ...createCrudApi<Cita>('citas'),
  listByPoliza: async (polizaId: number | string): Promise<Cita[]> => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/citas/?poliza=${encodeURIComponent(String(polizaId))}`,
      { method: 'GET' }
    );
    const payload = await handleApiResponse<any>(response);
    if (Array.isArray(payload)) return payload;
    if (payload?.results && Array.isArray(payload.results)) return payload.results;
    return [];
  },
};

export interface MedicoPoliza {
  id: number;
  poliza: number;
  nombre: string;
  especializacion?: string | null;
  hospital?: string | null;
  fecha_creacion?: string;
}

export interface MedicamentoPoliza {
  id: number;
  poliza: number;
  nombre: string;
  dosis?: string | null;
  frecuencia?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  activo?: boolean;
}

export const medicosPolizaApi = {
  ...createCrudApi<MedicoPoliza>('medicos-poliza'),

  listByPoliza: async (polizaId: number | string): Promise<MedicoPoliza[]> => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/medicos-poliza/?poliza=${encodeURIComponent(String(polizaId))}`,
      { method: 'GET' }
    );
    const payload = await handleApiResponse<any>(response);
    if (Array.isArray(payload)) return payload;
    if (payload?.results && Array.isArray(payload.results)) return payload.results;
    return [];
  },
};

export const medicamentosApi = {
  ...createCrudApi<MedicamentoPoliza>('medicamentos'),

  listByPoliza: async (polizaId: number | string): Promise<MedicamentoPoliza[]> => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/medicamentos/?poliza=${encodeURIComponent(String(polizaId))}`,
      { method: 'GET' }
    );
    const payload = await handleApiResponse<any>(response);
    if (Array.isArray(payload)) return payload;
    if (payload?.results && Array.isArray(payload.results)) return payload.results;
    return [];
  },
};

// � Tipos de Producto
export const tiposProductoApi = createCrudApi<TipoProducto>('tipos-producto');

// �💳 Pagos
export const tarjetasCreditoApi = createCrudApi<any>('tarjetas_credito');
export const cuentasBancariasApi = createCrudApi<any>('cuentas_bancarias');
export const infoPagoApi = {
  ...createCrudApi<any>('info_pago'),
  getByPoliza: async (polizaId: number): Promise<any | null> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/info_pago/?poliza=${polizaId}`, { method: 'GET' });
    const payload = await handleApiResponse<any>(response);
    const list = Array.isArray(payload) ? payload : payload?.results || [];
    return list.find((item: any) => Number(item.poliza) === Number(polizaId)) || null;
  },
};
export const reportesComisionApi = createCrudApi<any>('reportes_comision');
export const configuracionComisionesApi = createCrudApi<any>('configuracion-comisiones');
export const consentRequestsApi = createCrudApi<any>('consent-requests');

export const notificacionesApi = {
  list: async (): Promise<any[]> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/notificaciones/`, { method: 'GET' });
    const payload = await handleApiResponse<any>(response);
    if (Array.isArray(payload)) return payload;
    if (payload?.results && Array.isArray(payload.results)) return payload.results;
    return [];
  },
  marcarLeida: async (id: number): Promise<any> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/notificaciones/${id}/marcar_leida/`, {
      method: 'POST',
    });
    return handleApiResponse<any>(response);
  },
  marcarTodasLeidas: async (): Promise<any> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/notificaciones/marcar_todas_leidas/`, {
      method: 'POST',
    });
    return handleApiResponse<any>(response);
  },
  enviarGeneral: async (data: { mensaje: string; tipo?: string }): Promise<any> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/notificaciones/enviar-general/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleApiResponse<any>(response);
  },
};

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

  const apiBase = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
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
    const interceptorWindow = window as typeof window & { __bhealthTokenInterceptorSetup?: boolean };

    if (interceptorWindow.__bhealthTokenInterceptorSetup) {
      return;
    }

    interceptorWindow.__bhealthTokenInterceptorSetup = true;

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
          clearClientAuthStorage();
          const loginPath = window.location.pathname.startsWith('/client')
            ? '/client'
            : '/auth/login';
          window.location.href = loginPath;
          throw error;
        }
      }
      
      return response;
    };
  }
};

// Exportar todas las APIs como un objeto principal
export const documentosLegalesApi = {
  ...createCrudApi<any>('documentos-legales'),

  link: async (payload: {
    id?: number;
    cliente: number;
    tipo: string;
    documento: number;
    numero_documento?: string;
    fecha_emision?: string | null;
    fecha_vencimiento?: string | null;
  }): Promise<any> => {
    const { id, ...body } = payload;
    if (id) {
      const response = await fetchWithAuth(`${API_BASE_URL}/documentos-legales/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documento: body.documento,
          numero_documento: body.numero_documento ?? '',
          fecha_emision: body.fecha_emision ?? null,
          fecha_vencimiento: body.fecha_vencimiento ?? null,
        }),
      });
      return handleApiResponse<any>(response);
    }
    const response = await fetchWithAuth(`${API_BASE_URL}/documentos-legales/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleApiResponse<any>(response);
  },

  listByCliente: async (clienteId: number | string): Promise<any[]> => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/documentos-legales/?cliente=${encodeURIComponent(String(clienteId))}`,
      { method: 'GET' },
    );
    const payload = await handleApiResponse<any>(response);
    if (Array.isArray(payload)) return payload;
    if (payload?.results && Array.isArray(payload.results)) return payload.results;
    return [];
  },

  unlink: async (id: number): Promise<void> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/documentos-legales/${id}/`, {
      method: 'DELETE',
    });
    await handleApiResponse(response);
  },
};

export const ingresosEmpleadorApi = {
  ...createCrudApi<any>('ingresos-empleador'),

  listByCliente: async (clienteId: number | string): Promise<any[]> => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/ingresos-empleador/?cliente=${encodeURIComponent(String(clienteId))}`,
      { method: 'GET' },
    );
    const payload = await handleApiResponse<any>(response);
    if (Array.isArray(payload)) return payload.filter((item) => item.activo !== false);
    if (payload?.results && Array.isArray(payload.results)) {
      return payload.results.filter((item: any) => item.activo !== false);
    }
    return [];
  },
};

export const recordatoriosApi = {
  ...createCrudApi<any>('recordatorios'),

  listByPoliza: async (polizaId: number | string): Promise<any[]> => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/recordatorios/?poliza=${encodeURIComponent(String(polizaId))}`,
      { method: 'GET' },
    );
    const payload = await handleApiResponse<any>(response);
    if (Array.isArray(payload)) return payload;
    if (payload?.results && Array.isArray(payload.results)) return payload.results;
    return [];
  },
};

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
  cambiosDeVida: cambiosDeVidaApi,
  portalCliente: portalClienteApi,
  citas: citasApi,
  tarjetasCredito: tarjetasCreditoApi,
  cuentasBancarias: cuentasBancariasApi,
  infoPago: infoPagoApi,
  reportesComision: reportesComisionApi,
  configuracionComisiones: configuracionComisionesApi,
  consentRequests: consentRequestsApi,
  notificaciones: notificacionesApi,
  notas: notasApi,
  historial: historialApi,
  etiquetas: etiquetasApi,
  documentos: documentosApi,
  tiposProducto: tiposProductoApi,
  recordatorios: recordatoriosApi
};

export default api;
