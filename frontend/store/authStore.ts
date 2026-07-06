import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { authApi, resetAuthRefreshState, clearClientAuthStorage, refreshAccessTokenShared } from '@/lib/api';
import { isTokenExpired, resolveRoleFromLogin, resolveRoleFromAccessToken } from '@/lib/jwt';
import {
  clearAuthCookies,
  hasAuthSessionCookie,
  persistAuthSnapshot,
  readLiveAccessToken,
  readLiveRefreshToken,
  resolveRoleFromProfile,
  setAuthCookies,
  syncServerSessionCookies,
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

function syncPersistedAuthState(get: () => AuthState): void {
  const state = get();
  persistAuthSnapshot({
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    user: state.user,
    role: state.role,
    isAuthenticated: state.isAuthenticated,
  });
}

function reconcileHydratedAuthState(state: AuthState | undefined): Partial<AuthState> | null {
  if (typeof window === 'undefined' || !state) return null;

  const liveAccess = readLiveAccessToken();
  const liveRefresh = readLiveRefreshToken();
  const hasSessionCookie = hasAuthSessionCookie();

  if (liveAccess) {
    const role = state.role ?? resolveRoleFromAccessToken(liveAccess);
    setAuthCookies(liveAccess, role);
    return {
      accessToken: liveAccess,
      refreshToken: liveRefresh ?? state.refreshToken,
      role,
      isAuthenticated: true,
    };
  }

  if (state.accessToken && !isTokenExpired(state.accessToken)) {
    const role = state.role ?? resolveRoleFromAccessToken(state.accessToken);
    setAuthCookies(state.accessToken, role);
    return {
      accessToken: state.accessToken,
      refreshToken: liveRefresh ?? state.refreshToken,
      role,
      isAuthenticated: true,
    };
  }

  // Con cookie de sesión o refresh token vivo, no borrar (evita logout ~1s tras login).
  if (hasSessionCookie || liveRefresh || state.refreshToken) {
    return null;
  }

  if (!state.accessToken || isTokenExpired(state.accessToken)) {
    clearClientAuthStorage();
    clearAuthCookies();
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
      role: null,
      isAuthenticated: false,
      error: null,
    };
  }

  return null;
}

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
            syncPersistedAuthState(get);
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

            set({ user: profileData, role: role ?? currentRole, isLoading: false });
            syncPersistedAuthState(get);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al obtener el perfil';
            // Mantener sesión y rol del JWT aunque /profile/ falle (red no bloquea redirect).
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
            const access = await refreshAccessTokenShared();
            const refresh = readLiveRefreshToken();
            const tokenRole = resolveRoleFromLogin(access, null, null);
            const profileRole = resolveRoleFromProfile(get().user?.profile);
            const role = mergeRole(tokenRole, profileRole, get().user?.profile?.cliente);
            setAuthCookies(access, role);
            set({
              accessToken: access,
              ...(refresh ? { refreshToken: refresh } : {}),
              role,
              isAuthenticated: true,
            });
            syncPersistedAuthState(get);
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
          const patch = reconcileHydratedAuthState(state);
          if (patch && state) {
            Object.assign(state, patch);
          }
          if (state) state.hasHydrated = true;
        },
      }
    ),
    { name: 'AuthStore' }
  )
);

if (typeof window !== 'undefined') {
  const finishHydration = () => {
    const patch = reconcileHydratedAuthState(useAuthStore.getState());
    if (patch) {
      useAuthStore.setState(patch);
      if (patch.accessToken && patch.isAuthenticated) {
        void syncServerSessionCookies(patch.accessToken, patch.role ?? null);
      }
    } else if (hasAuthSessionCookie()) {
      const liveAccess = readLiveAccessToken();
      const liveRefresh = readLiveRefreshToken();
      if (liveAccess) {
        const role =
          useAuthStore.getState().role ?? resolveRoleFromAccessToken(liveAccess);
        useAuthStore.setState({
          accessToken: liveAccess,
          refreshToken: liveRefresh,
          role,
          isAuthenticated: true,
        });
        void syncServerSessionCookies(liveAccess, role);
      }
    }
    useAuthStore.setState({ hasHydrated: true });
  };

  useAuthStore.persist.onFinishHydration(finishHydration);
  if (useAuthStore.persist.hasHydrated()) {
    finishHydration();
  }
}
