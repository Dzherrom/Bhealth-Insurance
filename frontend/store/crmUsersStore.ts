import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { UserRole } from '@/types/auth';

export type { UserRole };
export type UserStatus = 'activo' | 'inactivo' | 'pendiente';

export interface CRMUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  lastLogin: string;
  createdAt: string;
  department?: string;
}

export interface UserFilters {
  search: string;
  role: string;
  status: string;
  department?: string;
}

export interface CRMUsersState {
  // Estado
  users: CRMUser[];
  selectedUser: CRMUser | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;

  // Filtros y búsqueda
  filters: UserFilters;
  searchQuery: string;

  // Paginación
  page: number;
  pageSize: number;
  totalUsers: number;

  // Acciones - CRUD
  fetchUsers: () => Promise<void>;
  fetchUserById: (id: number) => Promise<void>;
  createUser: (data: Partial<CRMUser>) => Promise<CRMUser>;
  updateUser: (id: number, data: Partial<CRMUser>) => Promise<CRMUser>;
  deleteUser: (id: number) => Promise<void>;

  // Acciones - Filtros y búsqueda
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<UserFilters>) => void;
  clearFilters: () => void;
  getFilteredUsers: () => CRMUser[];

  // Acciones - Paginación
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  // Acciones - Utilidades
  setSelectedUser: (user: CRMUser | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  users: [],
  selectedUser: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  filters: {
    search: '',
    role: 'all',
    status: 'all',
  },
  searchQuery: '',
  page: 1,
  pageSize: 10,
  totalUsers: 0,
};

export const useCRMUsersStore = create<CRMUsersState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Obtener todos los usuarios
      fetchUsers: async () => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Implementar llamada a la API
          // const users = await usersApi.list();
          
          // Mock data temporal
          const mockUsers: CRMUser[] = [
            {
              id: 1,
              name: 'Ana García',
              email: 'ana.garcia@bhealth.com',
              phone: '+34 600 123 456',
              role: 'admin',
              status: 'activo',
              lastLogin: new Date().toISOString(),
              createdAt: '2024-01-15T09:00:00Z',
              department: 'Administración'
            },
            {
              id: 2,
              name: 'Carlos Rodríguez',
              email: 'carlos.rodriguez@bhealth.com',
              phone: '+34 600 234 567',
              role: 'asistente',
              status: 'activo',
              lastLogin: new Date().toISOString(),
              createdAt: '2024-02-20T10:00:00Z',
              department: 'Ventas'
            },
          ];

          set({
            users: mockUsers,
            totalUsers: mockUsers.length,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al cargar usuarios';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      // Obtener un usuario por ID
      fetchUserById: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: const user = await usersApi.get(id);
          const user = get().users.find(u => u.id === id);
          set({
            selectedUser: user || null,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al cargar usuario';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      // Crear nuevo usuario
      createUser: async (data: Partial<CRMUser>) => {
        set({ isCreating: true, error: null });
        try {
          // TODO: const newUser = await usersApi.create(data);
          const newUser: CRMUser = {
            id: Date.now(),
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            role: data.role || 'cliente',
            status: data.status || 'pendiente',
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            ...data,
          };

          set(state => ({
            users: [newUser, ...state.users],
            totalUsers: state.totalUsers + 1,
            isCreating: false,
          }));

          return newUser;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al crear usuario';
          set({
            error: errorMessage,
            isCreating: false,
          });
          throw error;
        }
      },

      // Actualizar usuario
      updateUser: async (id: number, data: Partial<CRMUser>) => {
        set({ isUpdating: true, error: null });
        try {
          // TODO: const updatedUser = await usersApi.patch(id, data);
          const updatedUser = { ...get().users.find(u => u.id === id), ...data } as CRMUser;

          set(state => ({
            users: state.users.map(u => u.id === id ? updatedUser : u),
            selectedUser: state.selectedUser?.id === id ? updatedUser : state.selectedUser,
            isUpdating: false,
          }));

          return updatedUser;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al actualizar usuario';
          set({
            error: errorMessage,
            isUpdating: false,
          });
          throw error;
        }
      },

      // Eliminar usuario
      deleteUser: async (id: number) => {
        set({ isDeleting: true, error: null });
        try {
          // TODO: await usersApi.delete(id);
          set(state => ({
            users: state.users.filter(u => u.id !== id),
            totalUsers: state.totalUsers - 1,
            selectedUser: state.selectedUser?.id === id ? null : state.selectedUser,
            isDeleting: false,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al eliminar usuario';
          set({
            error: errorMessage,
            isDeleting: false,
          });
          throw error;
        }
      },

      // Establecer query de búsqueda
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      // Establecer filtros
      setFilters: (newFilters: Partial<UserFilters>) => {
        set(state => ({
          filters: { ...state.filters, ...newFilters },
          page: 1, // Reset a la primera página al cambiar filtros
        }));
      },

      // Limpiar filtros
      clearFilters: () => {
        set({
          filters: initialState.filters,
          searchQuery: '',
          page: 1,
        });
      },

      // Obtener usuarios filtrados
      getFilteredUsers: () => {
        const { users, filters, searchQuery } = get();
        
        return users.filter(user => {
          // Filtro de búsqueda
          const matchesSearch = !searchQuery || 
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());

          // Filtro de rol
          const matchesRole = filters.role === 'all' || user.role === filters.role;

          // Filtro de estado
          const matchesStatus = filters.status === 'all' || user.status === filters.status;

          // Filtro de departamento
          const matchesDepartment = !filters.department || 
            filters.department === 'all' || 
            user.department === filters.department;

          return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
        });
      },

      // Establecer página
      setPage: (page: number) => set({ page }),

      // Establecer tamaño de página
      setPageSize: (size: number) => set({ pageSize: size, page: 1 }),

      // Establecer usuario seleccionado
      setSelectedUser: (user: CRMUser | null) => set({ selectedUser: user }),

      // Manejo de errores
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      // Reset del store
      reset: () => set(initialState),
    }),
    { name: 'CRMUsersStore' }
  )
);
