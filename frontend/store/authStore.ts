import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { authApi } from '@/lib/api';
import { extractRoleFromToken, decodeJwtPayload, isTokenExpired, resolveRoleFromLogin } from '@/lib/jwt';
import type { User, LoginData, RegisterData, UserRole } from '@/types';

// -----------------------------------------------
// Helpers de cookie para el middleware Edge
// El middleware de Next.js solo puede leer cookies,
// no localStorage, por eso sincronizamos ambos.
// -----------------------------------------------

function setAuthCookie(token: string): void {
  if (typeof document === 'undefined') return;
  const payload = decodeJwtPayload(token);
  const expStr = payload?.exp
    ? `; expires=${new Date(payload.exp * 1000).toUTCString()}`
    : '';
  document.cookie = `access_token=${token}${expStr}; path=/; SameSite=Lax`;
}

function clearAuthCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
}

export interface AuthState {
  // Estado
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** Rol extraído del claim `role` del JWT access token */
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Acciones
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  getProfile: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateSettings: (settings: any) => Promise<void>;
  updateSelectedYears: (years: string[]) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

let settingsUpdateTimeout: NodeJS.Timeout;

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        user: null,
        accessToken: null,
        refreshToken: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Login
        login: async (data: LoginData) => {
          set({ isLoading: true, error: null });
          try {
            const tokens = await authApi.login(data);
            const role = resolveRoleFromLogin(tokens.access, tokens.role);
            setAuthCookie(tokens.access);
            set({
              accessToken: tokens.access,
              refreshToken: tokens.refresh,
              role,
              isAuthenticated: true,
              isLoading: false,
            });
            // Obtener perfil del usuario después del login
            await get().getProfile();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión';
            set({
              error: errorMessage,
              isLoading: false,
              isAuthenticated: false,
            });
            throw error;
          }
        },

        // Obtener perfil del usuario
        getProfile: async () => {
          set({ isLoading: true, error: null });
          try {
            const profileData = await authApi.getProfile();
            set({ user: profileData, isLoading: false });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al obtener el perfil';
            set({ error: errorMessage, isLoading: false });
          }
        },

        // Registro
        register: async (data: RegisterData) => {
          set({ isLoading: true, error: null });
          try {
            const user = await authApi.register(data);
            set({
              user,
              isLoading: false,
            });
            // Después del registro, hacer login automáticamente
            if (data.username && data.password) {
              await get().login({
                username: data.username,
                password: data.password,
              });
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al registrarse';
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        // Logout
        logout: async () => {
          try {
            await authApi.logout();
          } catch (error) {
            console.error('Error al cerrar sesión:', error);
          } finally {
            clearAuthCookie();
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              role: null,
              isAuthenticated: false,
              error: null,
            });
          }
        },

        // Refrescar token de acceso
        refreshAccessToken: async () => {
          try {
            const result = await authApi.refreshToken();
            const role = extractRoleFromToken(result.access);
            setAuthCookie(result.access);
            set({
              accessToken: result.access,
              role,
            });
          } catch (error) {
            console.error('Error al refrescar token:', error);
            throw error;
          }
        },

        // Actualizar perfil del usuario
        updateProfile: async (data: Partial<User>) => {
          set({ isLoading: true, error: null });
          try {
            const updatedUser = await authApi.updateProfile(data);
            set({
              user: updatedUser,
              isLoading: false,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al actualizar perfil';
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        // Actualizar solo los settings
        updateSettings: async (settings: any) => {
          set({ isLoading: true, error: null });
          try {
            const updatedUser = await authApi.updateSettings(settings);
            set({ user: updatedUser, isLoading: false });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al guardar la configuración';
            set({ error: errorMessage, isLoading: false });
          }
        },

        updateSelectedYears: (years: string[]) => {
          // Optimistic update
          set(state => ({
            user: state.user ? {
              ...state.user,
              profile: {
                ...(state.user.profile!),
                settings: {
                  ...state.user.profile?.settings,
                  selectedYears: years,
                }
              }
            } : null
          }));

          // Debounced backend update
          clearTimeout(settingsUpdateTimeout);
          settingsUpdateTimeout = setTimeout(() => {
            get().updateSettings({ selectedYears: years });
          }, 500);
        },

        // Manejo de errores
        setError: (error: string | null) => set({ error }),
        clearError: () => set({ error: null }),
      }),
      {
        name: 'auth-storage', // nombre en localStorage
        partialize: (state) => ({
          // Solo persistir estos campos
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          user: state.user,
          role: state.role,
          isAuthenticated: state.isAuthenticated,
        }),
        onRehydrateStorage: () => (state) => {
          if (state && state.accessToken) {
            if (isTokenExpired(state.accessToken)) {
              clearAuthCookie();
              state.user = null;
              state.accessToken = null;
              state.refreshToken = null;
              state.role = null;
              state.isAuthenticated = false;
              state.error = null;
            } else {
              setAuthCookie(state.accessToken);
            }
          }
        },
      }
    ),
    { name: 'AuthStore' }
  )
);
