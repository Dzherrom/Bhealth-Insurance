import { isTokenExpired, resolveRoleFromAccessToken } from '@/lib/jwt';
import { hasAuthSessionCookie, readLiveRefreshToken, setAuthCookies } from '@/lib/authSession';
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
// En VPS con Nginx (mismo origen), usa /api relativo si no hay NEXT_PUBLIC_API_URL.
// En Render/Vercel separados, define NEXT_PUBLIC_API_URL en el build.
const DEFAULT_API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? (process.env.NEXT_PUBLIC_API_URL?.trim() || '/api')
    : 'http://127.0.0.1:8000/api';

const normalizeApiBaseUrl = (rawUrl?: string): string => {
  const source = (rawUrl || DEFAULT_API_BASE_URL).trim().replace(/\/+$/, '');
  return source.endsWith('/api') ? source : `${source}/api`;
};

export const API_BASE_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);

// Capturar fetch nativo antes de que AuthInit parchee window.fetch
const nativeFetch: typeof fetch =
  typeof window !== 'undefined' ? window.fetch.bind(window) : fetch;

const AUTH_ENDPOINTS_NO_RETRY = ['/login/refresh/', '/login/', '/logout/', '/register/'];

function isAuthEndpointNoRetry(url: string): boolean {
  return AUTH_ENDPOINTS_NO_RETRY.some((segment) => url.includes(segment));
}

function redirectToLogin(reason?: 'session_expired') {
  if (typeof window === 'undefined') return;
  const loginPath = window.location.pathname.startsWith('/client')
    ? '/client'
    : '/auth/login';
  if (window.location.pathname.startsWith(loginPath)) return;

  const suffix = reason === 'session_expired' ? '?reason=session_expired' : '';
  window.location.href = `${loginPath}${suffix}`;
}

function persistRefreshResult(result: RefreshTokenResponse) {
  if (typeof window === 'undefined') return;

  localStorage.setItem('access_token', result.access);
  if (result.refresh) {
    localStorage.setItem('refresh_token', result.refresh);
  }

  const persistedAuthRaw = localStorage.getItem('auth-storage');
  let role: string | null = null;
  
  if (persistedAuthRaw) {
    try {
      const persistedAuth = JSON.parse(persistedAuthRaw);
      if (persistedAuth?.state) {
        persistedAuth.state.accessToken = result.access;
        if (result.refresh) {
          persistedAuth.state.refreshToken = result.refresh;
        }
        role = persistedAuth.state.role || null;
        localStorage.setItem('auth-storage', JSON.stringify(persistedAuth));
      }
    } catch {
      // Ignore malformed persisted auth payload.
    }
  }

  // Update cookies so middleware knows the session is still active
  const resolvedRole = role ?? resolveRoleFromAccessToken(result.access);
  setAuthCookies(result.access, resolvedRole as any);
}

export const clearClientAuthStorage = () => {
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

/** Normaliza respuestas de listado: arreglo plano o paginación DRF { results: [] }. */
export const normalizeApiList = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (
    payload &&
    typeof payload === 'object' &&
    Array.isArray((payload as { results?: unknown }).results)
  ) {
    return (payload as { results: T[] }).results;
  }
  return [];
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

    const response = await nativeFetch(`${API_BASE_URL}/login/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    
    const result = await handleApiResponse<RefreshTokenResponse>(response);
    persistRefreshResult(result);
    
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
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: unknown) => void }> = [];
let sessionExpired = false;
let refreshPromise: Promise<string> | null = null;
let authGraceUntil = 0;

function readAuthGraceUntil(): number {
  if (typeof window === 'undefined') return 0;

  if (!authGraceUntil) {
    const raw = sessionStorage.getItem('auth_grace_until');
    if (raw) authGraceUntil = Number(raw) || 0;
  }

  if (authGraceUntil && Date.now() >= authGraceUntil) {
    authGraceUntil = 0;
    sessionStorage.removeItem('auth_grace_until');
  }

  return authGraceUntil;
}

function isInAuthGracePeriod(): boolean {
  return Date.now() < readAuthGraceUntil();
}

/** Evita logout forzado justo tras login (race rehidratación / refresh paralelo). */
export const armAuthGracePeriod = (ms = 15000) => {
  authGraceUntil = Date.now() + ms;
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('auth_grace_until', String(authGraceUntil));
  }
  resetAuthRefreshState();
};

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const resetAuthRefreshState = () => {
  sessionExpired = false;
  refreshPromise = null;
  isRefreshing = false;
  failedQueue = [];
};

async function refreshAccessTokenOnce(): Promise<string> {
  if (sessionExpired) {
    throw new Error('Session expired');
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = authApi
    .refreshToken()
    .then((result) => result.access)
    .catch((error) => {
      sessionExpired = true;
      processQueue(error, null);

      if (isInAuthGracePeriod()) {
        throw error;
      }

      const token = getAuthToken();
      const canRetryLater = hasAuthSessionCookie() || Boolean(readLiveRefreshToken());
      if ((!token || isTokenExpired(token)) && !canRetryLater) {
        clearClientAuthStorage();
        redirectToLogin('session_expired');
      }
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

/** Refresh centralizado (fetchWithAuth + authStore comparten la misma promesa). */
export const refreshAccessTokenShared = (): Promise<string> => refreshAccessTokenOnce();

if (typeof window !== 'undefined') {
  readAuthGraceUntil();
}

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
    if (sessionExpired) {
      return response;
    }

    const requestUrl = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
    if (isAuthEndpointNoRetry(requestUrl)) {
      return response;
    }

    if (isRefreshing) {
      return new Promise<Response>((resolve, reject) => {
        failedQueue.push({
          resolve: (newToken: string) => {
            const newHeaders = new Headers(init.headers);
            newHeaders.set('Authorization', `Bearer ${newToken}`);
            resolve(fetch(input, { ...init, headers: newHeaders }));
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    return refreshAccessTokenOnce()
      .then((newToken) => {
        processQueue(null, newToken);
        const newHeaders = new Headers(init.headers);
        newHeaders.set('Authorization', `Bearer ${newToken}`);
        return fetch(input, { ...init, headers: newHeaders });
      })
      .catch((err) => {
        processQueue(err, null);
        return Promise.reject(err);
      })
      .finally(() => {
        isRefreshing = false;
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
    const payload = await handleApiResponse<unknown>(response);
    return normalizeApiList<T>(payload);
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
    const payload = await handleApiResponse<unknown>(response);
    return normalizeApiList<T>(payload);
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

export interface HistorialPoliza extends OptionalBaseEntity {
  poliza: number;
  usuario?: number | null;
  usuario_username?: string;
  accion: string;
  accion_display?: string;
  detalles?: string | null;
  fecha: string;
}

export interface CarpetaDocumento extends OptionalBaseEntity {
  poliza: number;
  nombre: string;
  codigo?: string;
  es_personalizada?: boolean;
  orden?: number;
  cantidad_documentos?: number;
  fecha_creacion?: string;
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

  listPaginated: async (
    params?: { page?: number; page_size?: number; search?: string; con_usuario?: string; [key: string]: string | number | undefined }
  ): Promise<PaginatedResponse<Agente>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.set(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/agentes/${query ? `?${query}` : ''}`);
    return handleApiResponse<PaginatedResponse<Agente>>(response);
  },

  fetchAllPages: async (
    params?: { search?: string; con_usuario?: string; page_size?: number; [key: string]: string | number | undefined }
  ): Promise<Agente[]> => {
    const pageSize = params?.page_size ?? 200;
    let page = 1;
    const all: Agente[] = [];

    while (page <= 50) {
      const result = await agentesApi.listPaginated({ ...params, page, page_size: pageSize });
      all.push(...(result.results ?? []));
      if (!result.next) break;
      page += 1;
    }

    return all;
  },

  /** Agentes vinculados a un usuario CRM (los "registrados" en el sistema). */
  listRegistrados: async (search?: string): Promise<Agente[]> => {
    return agentesApi.fetchAllPages({ con_usuario: '1', search, page_size: 200 });
  },

  list: async (params?: { search?: string; con_usuario?: string; todos?: string }): Promise<Agente[]> => {
    if (params?.todos === '1') {
      return agentesApi.fetchAllPages({ search: params.search, page_size: 200 });
    }
    return agentesApi.listRegistrados(params?.search);
  },

  listPolizas: async (agenteId: number | string) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/agentes/${agenteId}/polizas/`, { method: 'GET' });
    return handleApiResponse<any[]>(response);
  },

  listClientes: async (agenteId: number | string) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/agentes/${agenteId}/clientes/`, { method: 'GET' });
    return handleApiResponse<any[]>(response);
  },
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

  listPaginated: async (
    params?: { page?: number; page_size?: number; search?: string; [key: string]: string | number | undefined },
  ): Promise<PaginatedResponse<Cliente>> => {
    const searchParams = new URLSearchParams();
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    });
    const query = searchParams.toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/clientes/${query ? `?${query}` : ''}`);
    return handleApiResponse<PaginatedResponse<Cliente>>(response);
  },

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

// 🏢 Departamentos operativos
export interface Departamento extends OptionalBaseEntity {
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export const departamentosApi = {
  list: async (): Promise<Departamento[]> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/departamentos/`);
    const payload = await handleApiResponse<Departamento[] | PaginatedResponse<Departamento>>(response);
    if (Array.isArray(payload)) return payload;
    return payload.results ?? [];
  },
};

// 👤 Gestión de Usuarios (CRM)
export const usersApi = {
  ...createCrudApi<ManagedUser, Partial<ManagedUser>, Partial<ManagedUser>>('users'),

  listPaginated: async (
    params?: { page?: number; page_size?: number; search?: string; empleados?: string; [key: string]: string | number | undefined }
  ): Promise<PaginatedResponse<ManagedUser>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.set(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    const response = await fetchWithAuth(`${API_BASE_URL}/users/${query ? `?${query}` : ''}`);
    return handleApiResponse<PaginatedResponse<ManagedUser>>(response);
  },

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
export interface PolizaPresenceViewer {
  user_id: number;
  username: string;
  display_name: string;
  mode: 'VIEW' | 'EDIT';
  last_seen: string;
  opened_at: string;
}

export interface PolizaPresenceState {
  viewers: PolizaPresenceViewer[];
  edit_lock: PolizaPresenceViewer | null;
  can_edit: boolean;
  is_locked_by_other: boolean;
  detail?: string;
  lock_holder?: PolizaPresenceViewer;
}

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

  validarEnvio: async (id: number): Promise<{
    es_cotizacion: boolean;
    puede_enviar: boolean;
    errores: string[];
  }> => {
    const response = await fetch(`${API_BASE_URL}/polizas/${id}/validar-envio/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  enviar: async (id: number): Promise<{ detail: string; poliza: PolizaResponse; es_cotizacion: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/polizas/${id}/enviar/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const err = new Error(
        errorData.detail || errorData.message || `HTTP ${response.status}`
      ) as Error & { errores?: string[] };
      if (Array.isArray(errorData.errores)) {
        err.errores = errorData.errores;
      }
      throw err;
    }
    return response.json();
  },

  getPresence: async (id: number): Promise<PolizaPresenceState> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/polizas/${id}/presence/`, { method: 'GET' });
    return handleApiResponse<PolizaPresenceState>(response);
  },

  presencePing: async (id: number, mode: 'view' | 'edit'): Promise<PolizaPresenceState> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/polizas/${id}/presence/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ mode }),
    });
    if (response.status === 409) {
      const payload = (await response.json()) as PolizaPresenceState;
      const err = new Error(payload.detail || 'Conflicto de edición') as Error & {
        status: number;
        payload: PolizaPresenceState;
      };
      err.status = 409;
      err.payload = payload;
      throw err;
    }
    return handleApiResponse<PolizaPresenceState>(response);
  },

  presenceLeave: async (id: number): Promise<void> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/polizas/${id}/presence/`, { method: 'DELETE' });
    await handleApiResponse(response);
  },

  archivar: async (id: number, nota?: string): Promise<PolizaResponse> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/polizas/${id}/archivar/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ nota: nota ?? '' }),
    });
    return handleApiResponse<PolizaResponse>(response);
  },

  desarchivar: async (id: number, nota?: string): Promise<PolizaResponse> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/polizas/${id}/desarchivar/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ nota: nota ?? '' }),
    });
    return handleApiResponse<PolizaResponse>(response);
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
  primer_nombre?: string;
  apellido_paterno?: string;
  apellido_materno?: string | null;
  nombre_completo: string;
  fecha_nacimiento?: string | null;
  direccion_completa?: string | null;
  telefono?: string | null;
  email?: string | null;
  ingresos?: string | null;
  grupo_familiar: Array<{
    cliente_id: number;
    nombre: string;
    primer_nombre?: string;
    apellido_paterno?: string;
    apellido_materno?: string | null;
    relacion: string;
    es_solicitante_principal: boolean;
    fecha_nacimiento?: string | null;
    telefono?: string | null;
    email?: string | null;
    ingresos?: string | null;
  }>;
  tarjetas_digitales: Array<{ id: number; tipo_tarjeta: string; numero_enmascarado: string; nombre_titular: string; fecha_vencimiento: string; es_predeterminado?: boolean }>;
  cuentas_bancarias?: Array<{
    id: number;
    nombre_banco: string;
    numero_enmascarado: string;
    titular_cuenta: string;
    aba_enmascarado?: string | null;
    es_predeterminado?: boolean;
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
    documento_id?: number | null;
    fecha_creacion?: string | null;
    puede_modificar?: boolean;
    puede_eliminar?: boolean;
  }>;
  elegibilidad: Record<string, unknown>;
  agente: { nombre?: string | null; npn?: string | null };
  polizas?: Array<{
    id: number;
    tipo_producto?: string | null;
    aseguradora?: string | null;
    estatus?: string | null;
    plan?: string | null;
    prima_mensual?: string;
    costo_poliza?: string;
    subsidio?: string;
    fecha_efectiva?: string | null;
    id_mercado?: string;
    metal?: string | null;
    es_principal?: boolean;
  }>;
  poliza?: {
    id: number;
    tipo_producto?: string | null;
    aseguradora?: string | null;
    estatus?: string | null;
    plan?: string | null;
    prima_mensual?: string;
    costo_poliza?: string;
    subsidio?: string;
    fecha_efectiva?: string | null;
    id_mercado?: string;
    metal?: string | null;
    es_principal?: boolean;
  } | null;
  campos_editables?: string[];
  documentos_solicitados?: Array<{
    id: number;
    titulo: string;
    categoria: string;
    estado_documento: string;
    estado_display: string;
    fecha_subida?: string | null;
    cliente_id?: number | null;
    puede_modificar?: boolean;
    puede_eliminar?: boolean;
    tiene_archivo?: boolean;
  }>;
  mensaje?: string;
}

export const portalClienteApi = {
  getDashboard: async (polizaId?: number): Promise<PortalClienteDashboard> => {
    const query = polizaId ? `?poliza_id=${polizaId}` : '';
    const response = await fetchWithAuth(`${API_BASE_URL}/portal-cliente/dashboard${query}`, { method: 'GET' });
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
  actualizarSolicitud: async (
    cambioId: number,
    payload: { descripcion?: string; campos?: Record<string, unknown> },
  ) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/portal-cliente/solicitudes/${cambioId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleApiResponse(response);
  },
  cancelarSolicitud: async (cambioId: number) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/portal-cliente/solicitudes/${cambioId}/`, {
      method: 'DELETE',
    });
    return handleApiResponse<{ mensaje: string }>(response);
  },
  actualizarDocumento: async (documentoId: number, payload: FormData) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/portal-cliente/documentos/${documentoId}/`, {
      method: 'PATCH',
      body: payload,
      headers: getAuthHeadersWithoutContentType(),
    });
    return handleApiResponse(response);
  },
  eliminarDocumento: async (documentoId: number) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/portal-cliente/documentos/${documentoId}/`, {
      method: 'DELETE',
    });
    return handleApiResponse<{ mensaje: string }>(response);
  },
  fetchDocumentoPreview: async (documentoId: number): Promise<{ blob: Blob; contentType: string }> => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/portal-cliente/documentos/${documentoId}/preview/`,
      { method: 'GET' },
    );
    if (!response.ok) {
      const message = await response.text().catch(() => '');
      throw new Error(message || 'No se pudo cargar la vista previa');
    }
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
    const blob = await response.blob();
    return { blob, contentType };
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
export const historialApi = {
  ...createReadOnlyApi<HistorialPoliza>('historial'),

  listByPoliza: async (polizaId: number | string): Promise<HistorialPoliza[]> => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/historial/?poliza=${encodeURIComponent(String(polizaId))}`,
      { method: 'GET' },
    );
    const payload = await handleApiResponse<any>(response);
    if (Array.isArray(payload)) return payload;
    if (payload?.results && Array.isArray(payload.results)) return payload.results;
    return [];
  },
};

export const carpetasDocumentosApi = {
  ...createCrudApi<CarpetaDocumento, Partial<CarpetaDocumento>, Partial<CarpetaDocumento>>('carpetas-documentos'),

  listByPoliza: async (polizaId: number | string): Promise<CarpetaDocumento[]> => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/carpetas-documentos/?poliza=${encodeURIComponent(String(polizaId))}`,
      { method: 'GET' },
    );
    const payload = await handleApiResponse<any>(response);
    if (Array.isArray(payload)) return payload;
    if (payload?.results && Array.isArray(payload.results)) return payload.results;
    return [];
  },
};

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

  fetchPreviewBlob: async (documentoId: number): Promise<{ blob: Blob; contentType: string }> => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/documentos/${documentoId}/preview/`,
      { method: 'GET' },
    );
    if (!response.ok) {
      const message = await response.text().catch(() => '');
      throw new Error(message || 'No se pudo cargar la vista previa');
    }
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
    const blob = await response.blob();
    return { blob, contentType };
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
  es_principal?: boolean;
  fecha_creacion?: string;
}

export interface MedicamentoPoliza {
  id: number;
  poliza: number;
  nombre: string;
  dosis?: string | null;
  duracion_tratamiento?: string | null;
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
  enviarGeneral: async (data: {
    mensaje: string;
    tipo?: string;
    roles?: string[];
    user_ids?: number[];
  }): Promise<any> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/notificaciones/enviar-general/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

// Deprecated: fetchWithAuth ya maneja el refresh. Se mantiene como no-op por compatibilidad.
export const setupTokenInterceptor = () => {
  if (typeof window === 'undefined') return;

  const interceptorWindow = window as typeof window & { __bhealthTokenInterceptorSetup?: boolean };
  interceptorWindow.__bhealthTokenInterceptorSetup = true;
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

export interface FlatPolicyImportSummary {
  processed_rows: number;
  created_policies: number;
  updated_policies: number;
  created_dependents: number;
  updated_dependents: number;
  errors: string[];
  imported_policies: FlatImportedPolicy[];
}

export interface FlatImportedPolicy {
  id: number;
  id_mercado: string;
  id_miembro: string;
  cliente_principal: string;
  agente_nombre: string;
  estado_nombre: string;
  fecha_efectiva: string;
  total_aplicantes: number;
  action: 'created' | 'updated';
  row_index?: number;
}

export interface FlatExportFilters {
  etiqueta?: string;
  estado?: string;
  zip_code?: string;
  aseguradora?: string;
  tipo_producto?: string;
  fecha_efectiva_desde?: string;
  fecha_efectiva_hasta?: string;
  fecha_creacion_desde?: string;
  fecha_creacion_hasta?: string;
  aplicantes_desde?: string;
  aplicantes_hasta?: string;
  agente?: string;
}

const buildFlatExportQuery = (filters?: FlatExportFilters, ids?: number[]) => {
  const params = new URLSearchParams();
  if (ids?.length) params.set('ids', ids.join(','));
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        params.set(key, String(value));
      }
    });
  }
  return params.toString();
};

export const polizasFlatApi = {
  exportExcel: async (options?: { ids?: number[]; filters?: FlatExportFilters }): Promise<Blob> => {
    const query = buildFlatExportQuery(options?.filters, options?.ids);
    const response = await fetchWithAuth(
      `${API_BASE_URL}/polizas/flat/export/${query ? `?${query}` : ''}`,
      { method: 'GET' },
    );
    if (!response.ok) {
      const message = await response.text().catch(() => '');
      throw new Error(message || 'No se pudo exportar las pólizas');
    }
    return response.blob();
  },

  importFile: async (file: File): Promise<{ message: string; summary: FlatPolicyImportSummary }> => {
    const formData = new FormData();
    formData.append('archivo', file);
    const response = await fetchWithAuth(`${API_BASE_URL}/polizas/flat/import/`, {
      method: 'POST',
      body: formData,
      headers: getAuthHeadersWithoutContentType(),
    });
    return handleApiResponse<{ message: string; summary: FlatPolicyImportSummary }>(response);
  },

  importBatch: async (payload: {
    headers: string[];
    rows: unknown[][];
    start_row_index?: number;
  }): Promise<{ message: string; summary: FlatPolicyImportSummary }> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/polizas/flat/import/batch/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleApiResponse<{ message: string; summary: FlatPolicyImportSummary }>(response);
  },

  listPreview: async (
    params?: { page?: number; page_size?: number } & FlatExportFilters,
  ): Promise<PaginatedResponse<PolizaListResponse>> => {
    const searchParams = new URLSearchParams();
    const page = params?.page ?? 1;
    const pageSize = params?.page_size ?? 10;
    searchParams.set('page', String(page));
    searchParams.set('page_size', String(pageSize));

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (key === 'page' || key === 'page_size') return;
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          searchParams.set(key, String(value));
        }
      });
    }

    const response = await fetchWithAuth(
      `${API_BASE_URL}/polizas/flat/preview/?${searchParams.toString()}`,
      { method: 'GET' },
    );
    return handleApiResponse<PaginatedResponse<PolizaListResponse>>(response);
  },
};

export const api = {
  auth: authApi,
  users: usersApi,
  departamentos: departamentosApi,
  agencias: agenciasApi,
  direcciones: direccionesApi,
  agentes: agentesApi,
  clientes: clientesApi,
  aseguradoras: aseguradorasApi,
  planes: planesApi,
  estadosPoliza: estadosPolizaApi,
  polizas: polizasApi,
  polizasFlat: polizasFlatApi,
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
  carpetasDocumentos: carpetasDocumentosApi,
  etiquetas: etiquetasApi,
  documentos: documentosApi,
  tiposProducto: tiposProductoApi,
  recordatorios: recordatoriosApi
};

export default api;
