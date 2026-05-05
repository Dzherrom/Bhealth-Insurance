import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface InformacionNegocio {
  nombreLegal: string;
  nombreComercial: string;
  telefono: string;
  correoElectronico: string;
  sitioWeb?: string;
  nif?: string;
}

export interface DireccionNegocio {
  lineaDireccion1: string;
  lineaDireccion2?: string;
  ciudad: string;
  estadoProvincia: string;
  codigoPostal: string;
  pais?: string;
}

export interface BrandingPortal {
  logoModoClaro: string;
  logoModoOscuro: string;
  faviconPortal: string;
  tituloPortal: string;
  pieCorreosElectronicos: string;
  colorPrimario?: string;
  colorSecundario?: string;
}

export interface EstadoPoliza {
  id: number;
  nombre: string;
  color: string;
  descripcion?: string;
  activo: boolean;
  orden: number;
}

export interface ConfiguracionGeneral {
  idiomaDefecto: string;
  zonaHoraria: string;
  formatoFecha: string;
  formatoMoneda: string;
  notificacionesEmail: boolean;
  notificacionesSMS: boolean;
}

export interface ConfiguracionesCRMState {
  // Estado
  informacionNegocio: InformacionNegocio | null;
  direccionNegocio: DireccionNegocio | null;
  brandingPortal: BrandingPortal | null;
  estadosPoliza: EstadoPoliza[];
  configuracionGeneral: ConfiguracionGeneral | null;
  
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Sección activa en la UI
  activeSection: string;

  // Acciones - Información del Negocio
  fetchInformacionNegocio: () => Promise<void>;
  updateInformacionNegocio: (data: Partial<InformacionNegocio>) => Promise<void>;

  // Acciones - Dirección del Negocio
  fetchDireccionNegocio: () => Promise<void>;
  updateDireccionNegocio: (data: Partial<DireccionNegocio>) => Promise<void>;

  // Acciones - Branding del Portal
  fetchBrandingPortal: () => Promise<void>;
  updateBrandingPortal: (data: Partial<BrandingPortal>) => Promise<void>;
  uploadLogo: (file: File, tipo: 'claro' | 'oscuro') => Promise<string>;
  uploadFavicon: (file: File) => Promise<string>;

  // Acciones - Estados de Póliza
  fetchEstadosPoliza: () => Promise<void>;
  createEstadoPoliza: (data: Omit<EstadoPoliza, 'id'>) => Promise<EstadoPoliza>;
  updateEstadoPoliza: (id: number, data: Partial<EstadoPoliza>) => Promise<void>;
  deleteEstadoPoliza: (id: number) => Promise<void>;
  reorderEstadosPoliza: (estadoId: number, newOrder: number) => Promise<void>;

  // Acciones - Configuración General
  fetchConfiguracionGeneral: () => Promise<void>;
  updateConfiguracionGeneral: (data: Partial<ConfiguracionGeneral>) => Promise<void>;

  // Acciones - UI
  setActiveSection: (section: string) => void;

  // Acciones - Utilidades
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  informacionNegocio: null,
  direccionNegocio: null,
  brandingPortal: null,
  estadosPoliza: [],
  configuracionGeneral: null,
  isLoading: false,
  isSaving: false,
  error: null,
  activeSection: 'agencia',
};

export const useConfiguracionesCRMStore = create<ConfiguracionesCRMState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Obtener información del negocio
        fetchInformacionNegocio: async () => {
          set({ isLoading: true, error: null });
          try {
            // TODO: const data = await configuracionesApi.getInformacionNegocio();
            
            // Mock data
            const mockData: InformacionNegocio = {
              nombreLegal: 'Bhealth Insurance S.L.',
              nombreComercial: 'Bhealth',
              telefono: '+34 900 123 456',
              correoElectronico: 'info@bhealth.com',
              sitioWeb: 'https://bhealth.com',
              nif: 'B12345678',
            };

            set({
              informacionNegocio: mockData,
              isLoading: false,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al cargar información del negocio';
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        // Actualizar información del negocio
        updateInformacionNegocio: async (data: Partial<InformacionNegocio>) => {
          set({ isSaving: true, error: null });
          try {
            // TODO: await configuracionesApi.updateInformacionNegocio(data);
            set(state => ({
              informacionNegocio: { ...state.informacionNegocio!, ...data },
              isSaving: false,
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al actualizar información';
            set({
              error: errorMessage,
              isSaving: false,
            });
            throw error;
          }
        },

        // Obtener dirección del negocio
        fetchDireccionNegocio: async () => {
          set({ isLoading: true, error: null });
          try {
            // TODO: const data = await configuracionesApi.getDireccionNegocio();
            
            const mockData: DireccionNegocio = {
              lineaDireccion1: 'Calle Principal 123',
              lineaDireccion2: 'Edificio A, Piso 3',
              ciudad: 'Madrid',
              estadoProvincia: 'Madrid',
              codigoPostal: '28001',
              pais: 'España',
            };

            set({
              direccionNegocio: mockData,
              isLoading: false,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al cargar dirección';
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        // Actualizar dirección del negocio
        updateDireccionNegocio: async (data: Partial<DireccionNegocio>) => {
          set({ isSaving: true, error: null });
          try {
            // TODO: await configuracionesApi.updateDireccionNegocio(data);
            set(state => ({
              direccionNegocio: { ...state.direccionNegocio!, ...data },
              isSaving: false,
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al actualizar dirección';
            set({
              error: errorMessage,
              isSaving: false,
            });
            throw error;
          }
        },

        // Obtener branding del portal
        fetchBrandingPortal: async () => {
          set({ isLoading: true, error: null });
          try {
            // TODO: const data = await configuracionesApi.getBrandingPortal();
            
            const mockData: BrandingPortal = {
              logoModoClaro: '/logos/logo-light.png',
              logoModoOscuro: '/logos/logo-dark.png',
              faviconPortal: '/favicon.ico',
              tituloPortal: 'Bhealth Insurance',
              pieCorreosElectronicos: '© 2024 Bhealth Insurance. Todos los derechos reservados.',
              colorPrimario: '#3b82f6',
              colorSecundario: '#10b981',
            };

            set({
              brandingPortal: mockData,
              isLoading: false,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al cargar branding';
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        // Actualizar branding del portal
        updateBrandingPortal: async (data: Partial<BrandingPortal>) => {
          set({ isSaving: true, error: null });
          try {
            // TODO: await configuracionesApi.updateBrandingPortal(data);
            set(state => ({
              brandingPortal: { ...state.brandingPortal!, ...data },
              isSaving: false,
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al actualizar branding';
            set({
              error: errorMessage,
              isSaving: false,
            });
            throw error;
          }
        },

        // Subir logo
        uploadLogo: async (file: File, tipo: 'claro' | 'oscuro') => {
          set({ isSaving: true, error: null });
          try {
            // TODO: const url = await configuracionesApi.uploadLogo(file, tipo);
            const url = URL.createObjectURL(file);
            
            set(state => ({
              brandingPortal: {
                ...state.brandingPortal!,
                [tipo === 'claro' ? 'logoModoClaro' : 'logoModoOscuro']: url,
              },
              isSaving: false,
            }));

            return url;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al subir logo';
            set({
              error: errorMessage,
              isSaving: false,
            });
            throw error;
          }
        },

        // Subir favicon
        uploadFavicon: async (file: File) => {
          set({ isSaving: true, error: null });
          try {
            // TODO: const url = await configuracionesApi.uploadFavicon(file);
            const url = URL.createObjectURL(file);
            
            set(state => ({
              brandingPortal: {
                ...state.brandingPortal!,
                faviconPortal: url,
              },
              isSaving: false,
            }));

            return url;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al subir favicon';
            set({
              error: errorMessage,
              isSaving: false,
            });
            throw error;
          }
        },

        // Obtener estados de póliza
        fetchEstadosPoliza: async () => {
          set({ isLoading: true, error: null });
          try {
            // TODO: const estados = await configuracionesApi.getEstadosPoliza();
            
            const mockEstados: EstadoPoliza[] = [
              { id: 1, nombre: 'Activo', color: '#10b981', activo: true, orden: 1 },
              { id: 2, nombre: 'Pendiente', color: '#f59e0b', activo: true, orden: 2 },
              { id: 3, nombre: 'Inactivo', color: '#6b7280', activo: true, orden: 3 },
              { id: 4, nombre: 'Cancelado', color: '#ef4444', activo: true, orden: 4 },
              { id: 5, nombre: 'Renovación', color: '#3b82f6', activo: true, orden: 5 },
            ];

            set({
              estadosPoliza: mockEstados,
              isLoading: false,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al cargar estados';
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        // Crear estado de póliza
        createEstadoPoliza: async (data: Omit<EstadoPoliza, 'id'>) => {
          set({ isSaving: true, error: null });
          try {
            // TODO: const newEstado = await configuracionesApi.createEstadoPoliza(data);
            const newEstado: EstadoPoliza = {
              ...data,
              id: Date.now(),
            };

            set(state => ({
              estadosPoliza: [...state.estadosPoliza, newEstado],
              isSaving: false,
            }));

            return newEstado;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al crear estado';
            set({
              error: errorMessage,
              isSaving: false,
            });
            throw error;
          }
        },

        // Actualizar estado de póliza
        updateEstadoPoliza: async (id: number, data: Partial<EstadoPoliza>) => {
          set({ isSaving: true, error: null });
          try {
            // TODO: await configuracionesApi.updateEstadoPoliza(id, data);
            set(state => ({
              estadosPoliza: state.estadosPoliza.map(e => e.id === id ? { ...e, ...data } : e),
              isSaving: false,
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al actualizar estado';
            set({
              error: errorMessage,
              isSaving: false,
            });
            throw error;
          }
        },

        // Eliminar estado de póliza
        deleteEstadoPoliza: async (id: number) => {
          set({ isSaving: true, error: null });
          try {
            // TODO: await configuracionesApi.deleteEstadoPoliza(id);
            set(state => ({
              estadosPoliza: state.estadosPoliza.filter(e => e.id !== id),
              isSaving: false,
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al eliminar estado';
            set({
              error: errorMessage,
              isSaving: false,
            });
            throw error;
          }
        },

        // Reordenar estados de póliza
        reorderEstadosPoliza: async (estadoId: number, newOrder: number) => {
          set({ isSaving: true, error: null });
          try {
            // TODO: await configuracionesApi.reorderEstadosPoliza(estadoId, newOrder);
            set(state => {
              const estados = [...state.estadosPoliza];
              const estadoIndex = estados.findIndex(e => e.id === estadoId);
              const [removed] = estados.splice(estadoIndex, 1);
              estados.splice(newOrder - 1, 0, removed);
              
              // Actualizar orden
              return {
                estadosPoliza: estados.map((e, index) => ({ ...e, orden: index + 1 })),
                isSaving: false,
              };
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al reordenar estados';
            set({
              error: errorMessage,
              isSaving: false,
            });
            throw error;
          }
        },

        // Obtener configuración general
        fetchConfiguracionGeneral: async () => {
          set({ isLoading: true, error: null });
          try {
            // TODO: const config = await configuracionesApi.getConfiguracionGeneral();
            
            const mockConfig: ConfiguracionGeneral = {
              idiomaDefecto: 'es',
              zonaHoraria: 'Europe/Madrid',
              formatoFecha: 'DD/MM/YYYY',
              formatoMoneda: 'EUR',
              notificacionesEmail: true,
              notificacionesSMS: false,
            };

            set({
              configuracionGeneral: mockConfig,
              isLoading: false,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al cargar configuración';
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        // Actualizar configuración general
        updateConfiguracionGeneral: async (data: Partial<ConfiguracionGeneral>) => {
          set({ isSaving: true, error: null });
          try {
            // TODO: await configuracionesApi.updateConfiguracionGeneral(data);
            set(state => ({
              configuracionGeneral: { ...state.configuracionGeneral!, ...data },
              isSaving: false,
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al actualizar configuración';
            set({
              error: errorMessage,
              isSaving: false,
            });
            throw error;
          }
        },

        // Establecer sección activa
        setActiveSection: (section: string) => set({ activeSection: section }),

        // Manejo de errores
        setError: (error: string | null) => set({ error }),
        clearError: () => set({ error: null }),

        // Reset del store
        reset: () => set(initialState),
      }),
      {
        name: 'configuraciones-crm-storage',
        partialize: (state) => ({
          informacionNegocio: state.informacionNegocio,
          direccionNegocio: state.direccionNegocio,
          brandingPortal: state.brandingPortal,
          estadosPoliza: state.estadosPoliza,
          configuracionGeneral: state.configuracionGeneral,
        }),
      }
    ),
    { name: 'ConfiguracionesCRMStore' }
  )
);
