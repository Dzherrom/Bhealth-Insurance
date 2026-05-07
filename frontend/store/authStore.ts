import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { authApi } from '@/lib/api';
import type { User, LoginData, RegisterData } from '@/types';

export interface AuthState {
  // Estado
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
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
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Login
        login: async (data: LoginData) => {
          set({ isLoading: true, error: null });
          try {
            const tokens = await authApi.login(data);
            set({
              accessToken: tokens.access,
              refreshToken: tokens.refresh,
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
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              error: null,
            });
          }
        },

        // Refrescar token de acceso
        refreshAccessToken: async () => {
          try {
            const result = await authApi.refreshToken();
            set({
              accessToken: result.access,
            });
          } catch (error) {
            console.error('Error al refrescar token:', error);
            // Si falla el refresh, hacer logout
            await get().logout();
            throw error;
          }
        },

        // Obtener perfil del usuario
        getProfile: async () => {
          set({ isLoading: true, error: null });
          try {
            const user = await authApi.getProfile();
            set({
              user,
              isLoading: false,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al obtener perfil';
            set({
              error: errorMessage,
              isLoading: false,
            });
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
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);
