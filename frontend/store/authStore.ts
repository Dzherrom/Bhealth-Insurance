import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { authApi, resetAuthRefreshState, clearClientAuthStorage } from '@/lib/api';
import { isTokenExpired, resolveRoleFromLogin } from '@/lib/jwt';
import {
  clearAuthCookies,
  resolveRoleFromProfile,
  setAuthCookies,
} from '@/lib/authSession';
import { resolvePortalRole } from '@/lib/portalAccess';
import type { User, LoginData, RegisterData, UserRole } from '@/types';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  isLoading: boolean;
  error: string | null;

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

function mergeRole(
  tokenRole: UserRole | null,
  profileRole: UserRole | null,
  profileClienteId?: number | null,
): UserRole | null {
  return resolvePortalRole({
    role: tokenRole ?? undefined,
    profileRole: profileRole ?? undefined,
    profileClienteId,
  });
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        accessToken: null,
        refreshToken: null,
        role: null,
        isAuthenticated: false,
        hasHydrated: false,
        isLoading: false,
        error: null,

        login: async (data: LoginData) => {
          set({ isLoading: true, error: null });
          try {
            const tokens = await authApi.login(data);
            resetAuthRefreshState();
            const role = resolveRoleFromLogin(
              tokens.access,
              tokens.role,
              tokens.cliente_id,
            );
            setAuthCookies(tokens.access, role);
            set({
              accessToken: tokens.access,
              refreshToken: tokens.refresh,
              role,
              isAuthenticated: true,
              isLoading: false,
            });
            await get().getProfile();

            const finalRole = get().role;
            const accessToken = get().accessToken;
            if (accessToken && finalRole) {
              setAuthCookies(accessToken, finalRole);
            }
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

        getProfile: async () => {
          set({ isLoading: true, error: null });
          try {
            const profileData = await authApi.getProfile();
            const profileRole = resolveRoleFromProfile(profileData.profile);
            const currentRole = get().role;
            const role = mergeRole(currentRole, profileRole, profileData.profile?.cliente);
            const accessToken = get().accessToken;

            if (accessToken && role) {
              setAuthCookies(accessToken, role);
            }

            set({ user: profileData, role, isLoading: false });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al obtener el perfil';
            set({ error: errorMessage, isLoading: false });
          }
        },

        register: async (data: RegisterData) => {
          set({ isLoading: true, error: null });
          try {
            const user = await authApi.register(data);
            set({
              user,
              isLoading: false,
            });
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

        logout: async () => {
          try {
            await authApi.logout();
          } catch (error) {
            console.error('Error al cerrar sesión:', error);
          } finally {
            clearAuthCookies();
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

        refreshAccessToken: async () => {
          try {
            const result = await authApi.refreshToken();
            const tokenRole = resolveRoleFromLogin(
              result.access,
              result.role,
              result.cliente_id,
            );
            const profileRole = resolveRoleFromProfile(get().user?.profile);
            const role = mergeRole(tokenRole, profileRole, get().user?.profile?.cliente);
            setAuthCookies(result.access, role);
            set({
              accessToken: result.access,
              ...(result.refresh ? { refreshToken: result.refresh } : {}),
              role,
            });
          } catch (error) {
            console.error('Error al refrescar token:', error);
            throw error;
          }
        },

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

          clearTimeout(settingsUpdateTimeout);
          settingsUpdateTimeout = setTimeout(() => {
            get().updateSettings({ selectedYears: years });
          }, 500);
        },

        setError: (error: string | null) => set({ error }),
        clearError: () => set({ error: null }),
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          user: state.user,
          role: state.role,
          isAuthenticated: state.isAuthenticated,
        }),
        onRehydrateStorage: () => (state) => {
          if (state && state.accessToken) {
            if (isTokenExpired(state.accessToken)) {
              clearClientAuthStorage();
              clearAuthCookies();
              state.user = null;
              state.accessToken = null;
              state.refreshToken = null;
              state.role = null;
              state.isAuthenticated = false;
              state.error = null;
            } else {
              setAuthCookies(state.accessToken, state.role);
            }
          }
          state && (state.hasHydrated = true);
        },
      }
    ),
    { name: 'AuthStore' }
  )
);

if (typeof window !== 'undefined') {
  const finishHydration = () => {
    const { accessToken, role, isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated && accessToken && !isTokenExpired(accessToken)) {
      setAuthCookies(accessToken, role);
    }
    useAuthStore.setState({ hasHydrated: true });
  };

  useAuthStore.persist.onFinishHydration(finishHydration);
  if (useAuthStore.persist.hasHydrated()) {
    finishHydration();
  }
}
