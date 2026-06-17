import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { polizasApi } from '@/lib/api';
import type { 
  PolizaResponse, 
  PolizaListResponse, 
  PolizaCreateRequest, 
  PolizaUpdateRequest 
} from '@/types';

export interface PolizaState {
  // Estado
  polizas: PolizaListResponse[];
  polizaSeleccionada: PolizaResponse | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;

  // Filtros y búsqueda
  searchQuery: string;
  filtros: {
    estado?: number;
    plan?: number;
    agente?: number;
    aseguradora?: number;
    fechaDesde?: string;
    fechaHasta?: string;
  };

  // Paginación
  page: number;
  pageSize: number;
  totalPolizas: number;

  // Acciones - CRUD
  fetchPolizas: (filtros?: { cliente_id?: string; page?: number; page_size?: number; [key: string]: any }) => Promise<void>;
  fetchPolizaById: (id: number, options?: { silent?: boolean }) => Promise<void>;
  createPoliza: (data: PolizaCreateRequest) => Promise<PolizaResponse>;
  updatePoliza: (id: number, data: PolizaUpdateRequest) => Promise<PolizaResponse>;
  deletePoliza: (id: number) => Promise<void>;
  
  // Acciones - Especiales
  downloadDocuments: (id: number) => Promise<void>;

  // Acciones - Filtros y búsqueda
  setSearchQuery: (query: string) => void;
  setFiltros: (filtros: PolizaState['filtros']) => void;
  clearFiltros: () => void;

  // Acciones - Paginación
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;

  // Acciones - Selección
  selectPoliza: (poliza: PolizaResponse | null) => void;

  // Acciones - Limpieza
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  polizas: [],
  polizaSeleccionada: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  searchQuery: '',
  filtros: {},
  page: 1,
  pageSize: 10,
  totalPolizas: 0,
};

export const usePolizaStore = create<PolizaState>()(
  devtools(
    (set, get) => ({
      ...initialState,

    // Obtener todas las pólizas
    fetchPolizas: async (filtros = {}) => {
      set({ isLoading: true, error: null });
      try {
          const { page, pageSize } = get();
          const requestedPage = filtros.page ?? (filtros.cliente_id ? 1 : page);
          const requestedPageSize = filtros.page_size ?? (filtros.cliente_id ? 200 : pageSize);
          const response = await polizasApi.listPaginated({
            page: requestedPage,
            page_size: requestedPageSize,
            ...filtros,
          });

          const safeResults = Array.isArray(response.results) ? response.results : [];
          const safeCount = typeof response.count === 'number' ? response.count : safeResults.length;

          set({ 
            polizas: safeResults,
            totalPolizas: safeCount,
            isLoading: false 
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al obtener pólizas';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      // Obtener póliza por ID
      fetchPolizaById: async (id: number, options?: { silent?: boolean }) => {
        if (!options?.silent) {
          set({ isLoading: true, error: null });
        }
        try {
          const poliza = await polizasApi.get(id);
          set({ 
            polizaSeleccionada: poliza,
            isLoading: false 
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al obtener póliza';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      // Crear póliza
      createPoliza: async (data: PolizaCreateRequest) => {
        set({ isCreating: true, error: null });
        try {
          const newPoliza = await polizasApi.create(data);
          
          // Actualizar la lista de pólizas
          await get().fetchPolizas();
          
          set({ 
            polizaSeleccionada: newPoliza,
            isCreating: false 
          });
          
          return newPoliza;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al crear póliza';
          set({ error: errorMessage, isCreating: false });
          throw error;
        }
      },

      // Actualizar póliza
      updatePoliza: async (id: number, data: PolizaUpdateRequest) => {
        set({ isUpdating: true, error: null });
        try {
          const updatedPoliza = await polizasApi.patch(id, data);
          
          // Actualizar la lista de pólizas
          await get().fetchPolizas();
          
          // Si es la póliza seleccionada, actualizarla
          if (get().polizaSeleccionada?.id === id) {
            set({ polizaSeleccionada: updatedPoliza });
          }
          
          set({ isUpdating: false });
          return updatedPoliza;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al actualizar póliza';
          set({ error: errorMessage, isUpdating: false });
          throw error;
        }
      },

      // Eliminar póliza
      deletePoliza: async (id: number) => {
        set({ isDeleting: true, error: null });
        try {
          await polizasApi.delete(id);
          
          // Actualizar la lista de pólizas
          await get().fetchPolizas();
          
          // Si es la póliza seleccionada, limpiarla
          if (get().polizaSeleccionada?.id === id) {
            set({ polizaSeleccionada: null });
          }
          
          set({ isDeleting: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al eliminar póliza';
          set({ error: errorMessage, isDeleting: false });
          throw error;
        }
      },

      // Descargar documentos de póliza
      downloadDocuments: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
          await polizasApi.downloadDocuments(id);
          set({ isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al descargar documentos';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      // Filtros y búsqueda
      setSearchQuery: (query: string) => set({ searchQuery: query }),
      
      setFiltros: (filtros: PolizaState['filtros']) => set({ filtros }),
      
      clearFiltros: () => set({ filtros: {}, searchQuery: '' }),

      // Paginación
      setPage: (page: number) => set({ page }),
      
      setPageSize: (pageSize: number) => set({ pageSize, page: 1 }),

      // Selección
      selectPoliza: (poliza: PolizaResponse | null) => set({ polizaSeleccionada: poliza }),

      // Limpieza
      setError: (error: string | null) => set({ error }),
      
      clearError: () => set({ error: null }),
      
      reset: () => set(initialState),
    }),
    { name: 'PolizaStore' }
  )
);
