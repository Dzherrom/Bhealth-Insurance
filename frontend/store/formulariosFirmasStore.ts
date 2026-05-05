import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type FormularioStatus = 'activo' | 'pendiente' | 'validado' | 'revisión';

export interface FormularioFirma {
  id: number;
  nombre: string;
  status: FormularioStatus;
  creadoPor: string;
  fechaCreacion: string;
  horaCreacion: string;
  total: number;
  descripcion?: string;
  campos?: FormularioCampo[];
  firmantes?: Firmante[];
}

export interface FormularioCampo {
  id: string;
  nombre: string;
  tipo: 'texto' | 'firma' | 'fecha' | 'checkbox' | 'numero';
  requerido: boolean;
  orden: number;
}

export interface Firmante {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  estado: 'pendiente' | 'firmado' | 'rechazado';
  fechaFirma?: string;
}

export interface FormularioFilters {
  search: string;
  status: string;
  creadoPor?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface FormulariosFirmasState {
  // Estado
  formularios: FormularioFirma[];
  formularioSeleccionado: FormularioFirma | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;

  // Filtros y búsqueda
  filters: FormularioFilters;
  searchQuery: string;

  // Paginación
  page: number;
  pageSize: number;
  totalFormularios: number;

  // Acciones - CRUD
  fetchFormularios: () => Promise<void>;
  fetchFormularioById: (id: number) => Promise<void>;
  createFormulario: (data: Partial<FormularioFirma>) => Promise<FormularioFirma>;
  updateFormulario: (id: number, data: Partial<FormularioFirma>) => Promise<FormularioFirma>;
  deleteFormulario: (id: number) => Promise<void>;

  // Acciones - Firmantes
  addFirmante: (formularioId: number, firmante: Omit<Firmante, 'id'>) => Promise<void>;
  updateFirmante: (formularioId: number, firmanteId: number, data: Partial<Firmante>) => Promise<void>;
  removeFirmante: (formularioId: number, firmanteId: number) => Promise<void>;

  // Acciones - Filtros y búsqueda
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<FormularioFilters>) => void;
  clearFilters: () => void;
  getFilteredFormularios: () => FormularioFirma[];

  // Acciones - Estadísticas
  getStats: () => {
    total: number;
    activos: number;
    pendientes: number;
    validados: number;
    enRevision: number;
  };

  // Acciones - Paginación
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  // Acciones - Utilidades
  setSelectedFormulario: (formulario: FormularioFirma | null) => void;
  duplicateFormulario: (id: number) => Promise<FormularioFirma>;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  formularios: [],
  formularioSeleccionado: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  filters: {
    search: '',
    status: 'all',
  },
  searchQuery: '',
  page: 1,
  pageSize: 15,
  totalFormularios: 0,
};

export const useFormulariosFirmasStore = create<FormulariosFirmasState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Obtener todos los formularios
      fetchFormularios: async () => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Implementar llamada a la API
          // const formularios = await formulariosFirmasApi.list();
          
          // Mock data temporal
          const mockFormularios: FormularioFirma[] = [
            {
              id: 1,
              nombre: 'Formulario de Inscripción Médica',
              status: 'activo',
              creadoPor: 'Ana García',
              fechaCreacion: '2024-01-15',
              horaCreacion: '10:30',
              total: 45,
            },
            {
              id: 2,
              nombre: 'Contrato de Póliza Premium',
              status: 'validado',
              creadoPor: 'Carlos Rodríguez',
              fechaCreacion: '2024-01-20',
              horaCreacion: '14:15',
              total: 28,
            },
          ];

          set({
            formularios: mockFormularios,
            totalFormularios: mockFormularios.length,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al cargar formularios';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      // Obtener un formulario por ID
      fetchFormularioById: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: const formulario = await formulariosFirmasApi.get(id);
          const formulario = get().formularios.find(f => f.id === id);
          set({
            formularioSeleccionado: formulario || null,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al cargar formulario';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      // Crear nuevo formulario
      createFormulario: async (data: Partial<FormularioFirma>) => {
        set({ isCreating: true, error: null });
        try {
          // TODO: const newFormulario = await formulariosFirmasApi.create(data);
          const newFormulario: FormularioFirma = {
            id: Date.now(),
            nombre: data.nombre || 'Nuevo Formulario',
            status: data.status || 'pendiente',
            creadoPor: data.creadoPor || 'Usuario',
            fechaCreacion: new Date().toLocaleDateString('es-ES'),
            horaCreacion: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            total: 0,
            ...data,
          };

          set(state => ({
            formularios: [newFormulario, ...state.formularios],
            totalFormularios: state.totalFormularios + 1,
            isCreating: false,
          }));

          return newFormulario;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al crear formulario';
          set({
            error: errorMessage,
            isCreating: false,
          });
          throw error;
        }
      },

      // Actualizar formulario
      updateFormulario: async (id: number, data: Partial<FormularioFirma>) => {
        set({ isUpdating: true, error: null });
        try {
          // TODO: const updatedFormulario = await formulariosFirmasApi.patch(id, data);
          const updatedFormulario = { 
            ...get().formularios.find(f => f.id === id), 
            ...data 
          } as FormularioFirma;

          set(state => ({
            formularios: state.formularios.map(f => f.id === id ? updatedFormulario : f),
            formularioSeleccionado: state.formularioSeleccionado?.id === id ? updatedFormulario : state.formularioSeleccionado,
            isUpdating: false,
          }));

          return updatedFormulario;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al actualizar formulario';
          set({
            error: errorMessage,
            isUpdating: false,
          });
          throw error;
        }
      },

      // Eliminar formulario
      deleteFormulario: async (id: number) => {
        set({ isDeleting: true, error: null });
        try {
          // TODO: await formulariosFirmasApi.delete(id);
          set(state => ({
            formularios: state.formularios.filter(f => f.id !== id),
            totalFormularios: state.totalFormularios - 1,
            formularioSeleccionado: state.formularioSeleccionado?.id === id ? null : state.formularioSeleccionado,
            isDeleting: false,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al eliminar formulario';
          set({
            error: errorMessage,
            isDeleting: false,
          });
          throw error;
        }
      },

      // Agregar firmante
      addFirmante: async (formularioId: number, firmante: Omit<Firmante, 'id'>) => {
        set({ isUpdating: true, error: null });
        try {
          const newFirmante: Firmante = {
            ...firmante,
            id: Date.now(),
          };

          set(state => ({
            formularios: state.formularios.map(f => 
              f.id === formularioId 
                ? { ...f, firmantes: [...(f.firmantes || []), newFirmante] }
                : f
            ),
            isUpdating: false,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al agregar firmante';
          set({
            error: errorMessage,
            isUpdating: false,
          });
          throw error;
        }
      },

      // Actualizar firmante
      updateFirmante: async (formularioId: number, firmanteId: number, data: Partial<Firmante>) => {
        set({ isUpdating: true, error: null });
        try {
          set(state => ({
            formularios: state.formularios.map(f => 
              f.id === formularioId 
                ? {
                    ...f,
                    firmantes: f.firmantes?.map(firmante => 
                      firmante.id === firmanteId ? { ...firmante, ...data } : firmante
                    )
                  }
                : f
            ),
            isUpdating: false,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al actualizar firmante';
          set({
            error: errorMessage,
            isUpdating: false,
          });
          throw error;
        }
      },

      // Eliminar firmante
      removeFirmante: async (formularioId: number, firmanteId: number) => {
        set({ isUpdating: true, error: null });
        try {
          set(state => ({
            formularios: state.formularios.map(f => 
              f.id === formularioId 
                ? {
                    ...f,
                    firmantes: f.firmantes?.filter(firmante => firmante.id !== firmanteId)
                  }
                : f
            ),
            isUpdating: false,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al eliminar firmante';
          set({
            error: errorMessage,
            isUpdating: false,
          });
          throw error;
        }
      },

      // Establecer query de búsqueda
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      // Establecer filtros
      setFilters: (newFilters: Partial<FormularioFilters>) => {
        set(state => ({
          filters: { ...state.filters, ...newFilters },
          page: 1,
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

      // Obtener formularios filtrados
      getFilteredFormularios: () => {
        const { formularios, filters, searchQuery } = get();
        
        return formularios.filter(formulario => {
          // Filtro de búsqueda
          const matchesSearch = !searchQuery || 
            formulario.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            formulario.creadoPor.toLowerCase().includes(searchQuery.toLowerCase());

          // Filtro de estado
          const matchesStatus = filters.status === 'all' || formulario.status === filters.status;

          // Filtro de creador
          const matchesCreador = !filters.creadoPor || 
            filters.creadoPor === 'all' || 
            formulario.creadoPor === filters.creadoPor;

          return matchesSearch && matchesStatus && matchesCreador;
        });
      },

      // Obtener estadísticas
      getStats: () => {
        const { formularios } = get();
        return {
          total: formularios.length,
          activos: formularios.filter(f => f.status === 'activo').length,
          pendientes: formularios.filter(f => f.status === 'pendiente').length,
          validados: formularios.filter(f => f.status === 'validado').length,
          enRevision: formularios.filter(f => f.status === 'revisión').length,
        };
      },

      // Establecer página
      setPage: (page: number) => set({ page }),

      // Establecer tamaño de página
      setPageSize: (size: number) => set({ pageSize: size, page: 1 }),

      // Establecer formulario seleccionado
      setSelectedFormulario: (formulario: FormularioFirma | null) => set({ formularioSeleccionado: formulario }),

      // Duplicar formulario
      duplicateFormulario: async (id: number) => {
        const original = get().formularios.find(f => f.id === id);
        if (!original) throw new Error('Formulario no encontrado');

        const duplicado: FormularioFirma = {
          ...original,
          id: Date.now(),
          nombre: `${original.nombre} (Copia)`,
          fechaCreacion: new Date().toLocaleDateString('es-ES'),
          horaCreacion: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          total: 0,
        };

        set(state => ({
          formularios: [duplicado, ...state.formularios],
          totalFormularios: state.totalFormularios + 1,
        }));

        return duplicado;
      },

      // Manejo de errores
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      // Reset del store
      reset: () => set(initialState),
    }),
    { name: 'FormulariosFirmasStore' }
  )
);
