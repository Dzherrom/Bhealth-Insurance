import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { tareasApi } from '@/lib/api';
import type { Tarea, TareaCreateRequest, TareaUpdateRequest } from '@/types';

export interface TareaState {
  // Estado
  tareas: Tarea[];
  misTareas: Tarea[];
  tareaSeleccionada: Tarea | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;

  // Filtros
  filtros: {
    completada?: boolean;
    prioridad?: 'Baja' | 'Media' | 'Alta' | 'Urgente';
    tipo?: 'Seguimiento' | 'Documentación' | 'Renovación' | 'Reclamación' | 'Otro';
    polizaId?: number;
    fechaDesde?: string;
    fechaHasta?: string;
  };

  // Vista
  vistaActual: 'todas' | 'mis-tareas' | 'pendientes' | 'completadas';

  // Acciones - CRUD
  fetchTareas: () => Promise<void>;
  fetchMisTareas: () => Promise<void>;
  fetchTareaById: (id: number) => Promise<void>;
  createTarea: (data: TareaCreateRequest) => Promise<Tarea>;
  updateTarea: (id: number, data: TareaUpdateRequest) => Promise<Tarea>;
  deleteTarea: (id: number) => Promise<void>;

  // Acciones - Tareas específicas
  completarTarea: (id: number, notas?: string) => Promise<void>;
  reabrirTarea: (id: number) => Promise<void>;

  // Acciones - Filtros
  setFiltros: (filtros: TareaState['filtros']) => void;
  clearFiltros: () => void;

  // Acciones - Vista
  setVistaActual: (vista: TareaState['vistaActual']) => void;

  // Acciones - Selección
  selectTarea: (tarea: Tarea | null) => void;

  // Acciones - Limpieza
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  tareas: [],
  misTareas: [],
  tareaSeleccionada: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  filtros: {},
  vistaActual: 'mis-tareas' as const,
};

export const useTareaStore = create<TareaState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Obtener todas las tareas
      fetchTareas: async () => {
        set({ isLoading: true, error: null });
        try {
          const tareas = await tareasApi.list();
          set({ tareas, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al obtener tareas';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      // Obtener mis tareas
      fetchMisTareas: async () => {
        set({ isLoading: true, error: null });
        try {
          const misTareas = await tareasApi.misTareas();
          // misTareas devuelve MisTareasResponse[], convertir a Tarea[] o usar as any temporalmente
          set({ misTareas: misTareas as any, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al obtener mis tareas';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      // Obtener tarea por ID
      fetchTareaById: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
          const tarea = await tareasApi.get(id);
          set({ tareaSeleccionada: tarea, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al obtener tarea';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      // Crear tarea
      createTarea: async (data: TareaCreateRequest) => {
        set({ isCreating: true, error: null });
        try {
          const newTarea = await tareasApi.create(data);
          
          // Actualizar la lista según la vista actual
          const vista = get().vistaActual;
          if (vista === 'todas' || vista === 'pendientes') {
            await get().fetchTareas();
          }
          if (vista === 'mis-tareas') {
            await get().fetchMisTareas();
          }
          
          set({ tareaSeleccionada: newTarea, isCreating: false });
          return newTarea;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al crear tarea';
          set({ error: errorMessage, isCreating: false });
          throw error;
        }
      },

      // Actualizar tarea
      updateTarea: async (id: number, data: TareaUpdateRequest) => {
        set({ isUpdating: true, error: null });
        try {
          const updatedTarea = await tareasApi.patch(id, data);
          
          // Actualizar listas
          const vista = get().vistaActual;
          if (vista === 'todas' || vista === 'pendientes' || vista === 'completadas') {
            await get().fetchTareas();
          }
          if (vista === 'mis-tareas') {
            await get().fetchMisTareas();
          }
          
          // Si es la tarea seleccionada, actualizarla
          if (get().tareaSeleccionada?.id === id) {
            set({ tareaSeleccionada: updatedTarea });
          }
          
          set({ isUpdating: false });
          return updatedTarea;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al actualizar tarea';
          set({ error: errorMessage, isUpdating: false });
          throw error;
        }
      },

      // Eliminar tarea
      deleteTarea: async (id: number) => {
        set({ isDeleting: true, error: null });
        try {
          await tareasApi.delete(id);
          
          // Actualizar listas
          const vista = get().vistaActual;
          if (vista === 'todas' || vista === 'pendientes' || vista === 'completadas') {
            await get().fetchTareas();
          }
          if (vista === 'mis-tareas') {
            await get().fetchMisTareas();
          }
          
          // Si es la tarea seleccionada, limpiarla
          if (get().tareaSeleccionada?.id === id) {
            set({ tareaSeleccionada: null });
          }
          
          set({ isDeleting: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al eliminar tarea';
          set({ error: errorMessage, isDeleting: false });
          throw error;
        }
      },

      // Completar tarea
      completarTarea: async (id: number, notas?: string) => {
        const updateData: TareaUpdateRequest = {
          completada: true,
          fecha_completada: new Date().toISOString(),
          notas_completado: notas,
        };
        await get().updateTarea(id, updateData);
      },

      // Reabrir tarea
      reabrirTarea: async (id: number) => {
        const updateData: TareaUpdateRequest = {
          completada: false,
          fecha_completada: undefined,
          notas_completado: undefined,
        };
        await get().updateTarea(id, updateData);
      },

      // Filtros
      setFiltros: (filtros: TareaState['filtros']) => set({ filtros }),
      
      clearFiltros: () => set({ filtros: {} }),

      // Vista
      setVistaActual: (vista: TareaState['vistaActual']) => {
        set({ vistaActual: vista });
        // Auto-cargar datos según la vista
        if (vista === 'mis-tareas') {
          get().fetchMisTareas();
        } else {
          get().fetchTareas();
        }
      },

      // Selección
      selectTarea: (tarea: Tarea | null) => set({ tareaSeleccionada: tarea }),

      // Limpieza
      setError: (error: string | null) => set({ error }),
      
      clearError: () => set({ error: null }),
      
      reset: () => set(initialState),
    }),
    { name: 'TareaStore' }
  )
);
