import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  agenciasApi, 
  agentesApi, 
  aseguradorasApi, 
  planesApi, 
  estadosPolizaApi 
} from '@/lib/api';
import type { 
  Agencia, 
  Agente, 
  Aseguradora, 
  Plan, 
  EstadoPoliza 
} from '@/types';

export interface CatalogoState {
  // Estado - Catálogos
  agencias: Agencia[];
  agentes: Agente[];
  aseguradoras: Aseguradora[];
  planes: Plan[];
  estadosPoliza: EstadoPoliza[];

  // Estado - Carga
  isLoadingAgencias: boolean;
  isLoadingAgentes: boolean;
  isLoadingAseguradoras: boolean;
  isLoadingPlanes: boolean;
  isLoadingEstados: boolean;
  
  // Estado - Errores
  error: string | null;

  // Indicadores de carga inicial
  catalogosLoaded: {
    agencias: boolean;
    agentes: boolean;
    aseguradoras: boolean;
    planes: boolean;
    estados: boolean;
  };

  // Acciones - Cargar catálogos
  fetchAgencias: () => Promise<void>;
  fetchAgentes: () => Promise<void>;
  fetchAseguradoras: () => Promise<void>;
  fetchPlanes: () => Promise<void>;
  fetchEstadosPoliza: () => Promise<void>;
  fetchAllCatalogos: () => Promise<void>;

  // Acciones - Búsqueda y filtrado
  getAgenciaById: (id: number) => Agencia | undefined;
  getAgenteById: (id: number) => Agente | undefined;
  getAseguradoraById: (id: number) => Aseguradora | undefined;
  getPlanById: (id: number) => Plan | undefined;
  getEstadoPolizaById: (id: number) => EstadoPoliza | undefined;

  getAgenciasActivas: () => Agencia[];
  getAgentesActivos: () => Agente[];
  getAseguradorasActivas: () => Aseguradora[];
  getPlanesActivos: () => Plan[];
  getEstadosPolizaActivos: () => EstadoPoliza[];

  getPlanesByAseguradora: (aseguradoraId: number) => Plan[];

  // Acciones - Limpieza
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
  invalidateCatalogos: () => void;
}

const initialState = {
  agencias: [],
  agentes: [],
  aseguradoras: [],
  planes: [],
  estadosPoliza: [],
  isLoadingAgencias: false,
  isLoadingAgentes: false,
  isLoadingAseguradoras: false,
  isLoadingPlanes: false,
  isLoadingEstados: false,
  error: null,
  catalogosLoaded: {
    agencias: false,
    agentes: false,
    aseguradoras: false,
    planes: false,
    estados: false,
  },
};

export const useCatalogoStore = create<CatalogoState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Fetch Agencias
        fetchAgencias: async () => {
          set({ isLoadingAgencias: true, error: null });
          try {
            const agencias = await agenciasApi.list();
            set({ 
              agencias, 
              isLoadingAgencias: false,
              catalogosLoaded: { ...get().catalogosLoaded, agencias: true }
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al cargar agencias';
            set({ error: errorMessage, isLoadingAgencias: false });
            throw error;
          }
        },

        // Fetch Agentes
        fetchAgentes: async () => {
          set({ isLoadingAgentes: true, error: null });
          try {
            const agentes = await agentesApi.list();
            set({ 
              agentes, 
              isLoadingAgentes: false,
              catalogosLoaded: { ...get().catalogosLoaded, agentes: true }
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al cargar agentes';
            set({ error: errorMessage, isLoadingAgentes: false });
            throw error;
          }
        },

        // Fetch Aseguradoras
        fetchAseguradoras: async () => {
          set({ isLoadingAseguradoras: true, error: null });
          try {
            const aseguradoras = await aseguradorasApi.list();
            set({ 
              aseguradoras, 
              isLoadingAseguradoras: false,
              catalogosLoaded: { ...get().catalogosLoaded, aseguradoras: true }
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al cargar aseguradoras';
            set({ error: errorMessage, isLoadingAseguradoras: false });
            throw error;
          }
        },

        // Fetch Planes
        fetchPlanes: async () => {
          set({ isLoadingPlanes: true, error: null });
          try {
            const planes = await planesApi.list();
            set({ 
              planes, 
              isLoadingPlanes: false,
              catalogosLoaded: { ...get().catalogosLoaded, planes: true }
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al cargar planes';
            set({ error: errorMessage, isLoadingPlanes: false });
            throw error;
          }
        },

        // Fetch Estados de Póliza
        fetchEstadosPoliza: async () => {
          set({ isLoadingEstados: true, error: null });
          try {
            const estadosPoliza = await estadosPolizaApi.list();
            set({ 
              estadosPoliza, 
              isLoadingEstados: false,
              catalogosLoaded: { ...get().catalogosLoaded, estados: true }
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al cargar estados de póliza';
            set({ error: errorMessage, isLoadingEstados: false });
            throw error;
          }
        },

        // Fetch todos los catálogos en paralelo
        fetchAllCatalogos: async () => {
          try {
            await Promise.all([
              get().fetchAgencias(),
              get().fetchAgentes(),
              get().fetchAseguradoras(),
              get().fetchPlanes(),
              get().fetchEstadosPoliza(),
            ]);
          } catch (error) {
            console.error('Error al cargar catálogos:', error);
            throw error;
          }
        },

        // Búsqueda por ID
        getAgenciaById: (id: number) => 
          get().agencias.find(a => a.id === id),
        
        getAgenteById: (id: number) => 
          get().agentes.find(a => a.id === id),
        
        getAseguradoraById: (id: number) => 
          get().aseguradoras.find(a => a.id === id),
        
        getPlanById: (id: number) => 
          get().planes.find(p => p.id === id),
        
        getEstadoPolizaById: (id: number) => 
          get().estadosPoliza.find(e => e.id === id),

        // Filtrado por activos
        getAgenciasActivas: () => 
          get().agencias.filter(a => a.activa),
        
        getAgentesActivos: () =>
          get().agentes.filter((a) => a.activo !== false),
        
        getAseguradorasActivas: () => 
          get().aseguradoras.filter(a => a.activa),
        
        getPlanesActivos: () => 
          get().planes.filter(p => p.activo),
        
        getEstadosPolizaActivos: () => 
          get().estadosPoliza.filter(e => e.activo),

        // Planes por aseguradora
        getPlanesByAseguradora: (aseguradoraId: number) => 
          get().planes.filter(p => p.aseguradora === aseguradoraId),

        // Limpieza
        setError: (error: string | null) => set({ error }),
        
        clearError: () => set({ error: null }),
        
        reset: () => set(initialState),

        // Invalidar catálogos (forzar recarga)
        invalidateCatalogos: () => set({
          catalogosLoaded: {
            agencias: false,
            agentes: false,
            aseguradoras: false,
            planes: false,
            estados: false,
          }
        }),
      }),
      {
        name: 'catalogo-storage',
        partialize: (state) => ({
          // Persistir catálogos para mejor rendimiento
          agencias: state.agencias,
          agentes: state.agentes,
          aseguradoras: state.aseguradoras,
          planes: state.planes,
          estadosPoliza: state.estadosPoliza,
          catalogosLoaded: state.catalogosLoaded,
        }),
      }
    ),
    { name: 'CatalogoStore' }
  )
);
