import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface DashboardStats {
  usuariosActivos: number;
  usuariosInactivos: number;
  candidatos: number;
  polizasActivas: number;
  polizasPendientes: number;
  polizasVencidas: number;
  ingresosMensuales: number;
  ingresosAnuales: number;
  tareasPendientes: number;
  tareasCompletadas: number;
  formulariosFirmasPendientes: number;
  clientesNuevos: number;
}

export interface ActividadReciente {
  id: string;
  tipo: 'usuario' | 'poliza' | 'tarea' | 'pago' | 'documento' | 'formulario';
  titulo: string;
  descripcion?: string;
  timestamp: Date;
  usuario?: string;
  icono?: string;
}

export interface GraficoData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
  }[];
}

export interface TendenciaMetrica {
  valor: number;
  cambio: number; // Porcentaje de cambio
  periodo: 'dia' | 'semana' | 'mes' | 'año';
}

export interface DashboardState {
  // Estado
  stats: DashboardStats | null;
  actividadesRecientes: ActividadReciente[];
  polizasPorEstado: GraficoData | null;
  ingresosPorMes: GraficoData | null;
  tendencias: {
    polizas: TendenciaMetrica | null;
    ingresos: TendenciaMetrica | null;
    usuarios: TendenciaMetrica | null;
  };
  
  isLoading: boolean;
  error: string | null;

  // Filtros de periodo
  periodoSeleccionado: 'hoy' | 'semana' | 'mes' | 'año' | 'personalizado';
  fechaInicio?: Date;
  fechaFin?: Date;

  // Acciones - Estadísticas
  fetchStats: (periodo?: string) => Promise<void>;
  fetchActividadesRecientes: (limit?: number) => Promise<void>;
  fetchPolizasPorEstado: () => Promise<void>;
  fetchIngresosPorMes: () => Promise<void>;
  fetchTendencias: () => Promise<void>;

  // Acciones - Actividades
  addActividad: (actividad: Omit<ActividadReciente, 'id' | 'timestamp'>) => void;
  clearActividades: () => void;
  markActividadAsRead: (id: string) => void;

  // Acciones - Filtros
  setPeriodo: (periodo: DashboardState['periodoSeleccionado']) => void;
  setFechaPersonalizada: (inicio: Date, fin: Date) => void;

  // Acciones - Refresh
  refreshDashboard: () => Promise<void>;

  // Acciones - Utilidades
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  stats: null,
  actividadesRecientes: [],
  polizasPorEstado: null,
  ingresosPorMes: null,
  tendencias: {
    polizas: null,
    ingresos: null,
    usuarios: null,
  },
  isLoading: false,
  error: null,
  periodoSeleccionado: 'mes' as const,
};

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Obtener estadísticas generales
      fetchStats: async (periodo?: string) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: const stats = await dashboardApi.getStats(periodo);
          
          // Mock data
          const mockStats: DashboardStats = {
            usuariosActivos: 1234,
            usuariosInactivos: 45,
            candidatos: 12,
            polizasActivas: 856,
            polizasPendientes: 23,
            polizasVencidas: 8,
            ingresosMensuales: 125780.50,
            ingresosAnuales: 1450000.00,
            tareasPendientes: 47,
            tareasCompletadas: 342,
            formulariosFirmasPendientes: 15,
            clientesNuevos: 28,
          };

          set({
            stats: mockStats,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al cargar estadísticas';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      // Obtener actividades recientes
      fetchActividadesRecientes: async (limit = 10) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: const actividades = await dashboardApi.getActividadesRecientes(limit);
          
          const mockActividades: ActividadReciente[] = [
            {
              id: '1',
              tipo: 'usuario',
              titulo: 'Nuevo usuario registrado: Juan Pérez',
              timestamp: new Date(Date.now() - 5 * 60 * 1000),
              usuario: 'Sistema',
            },
            {
              id: '2',
              tipo: 'poliza',
              titulo: 'Póliza activada',
              descripcion: 'Póliza #POL-2024-156 activada para María López',
              timestamp: new Date(Date.now() - 15 * 60 * 1000),
              usuario: 'Ana García',
            },
            {
              id: '3',
              tipo: 'pago',
              titulo: 'Pago recibido',
              descripcion: '€89.99 - Póliza Premium',
              timestamp: new Date(Date.now() - 30 * 60 * 1000),
              usuario: 'Sistema',
            },
            {
              id: '4',
              tipo: 'tarea',
              titulo: 'Tarea completada',
              descripcion: 'Revisión de documentos finalizada',
              timestamp: new Date(Date.now() - 45 * 60 * 1000),
              usuario: 'Carlos Rodríguez',
            },
            {
              id: '5',
              tipo: 'formulario',
              titulo: 'Formulario firmado',
              descripcion: 'Contrato de póliza firmado por cliente',
              timestamp: new Date(Date.now() - 60 * 60 * 1000),
              usuario: 'Laura Martínez',
            },
          ];

          set({
            actividadesRecientes: mockActividades,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al cargar actividades';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      // Obtener pólizas por estado
      fetchPolizasPorEstado: async () => {
        set({ isLoading: true, error: null });
        try {
          // TODO: const data = await dashboardApi.getPolizasPorEstado();
          
          const mockData: GraficoData = {
            labels: ['Activas', 'Pendientes', 'Vencidas', 'Canceladas'],
            datasets: [
              {
                label: 'Pólizas',
                data: [856, 23, 8, 45],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#6b7280'],
              },
            ],
          };

          set({
            polizasPorEstado: mockData,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al cargar datos de pólizas';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      // Obtener ingresos por mes
      fetchIngresosPorMes: async () => {
        set({ isLoading: true, error: null });
        try {
          // TODO: const data = await dashboardApi.getIngresosPorMes();
          
          const mockData: GraficoData = {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            datasets: [
              {
                label: 'Ingresos (€)',
                data: [98000, 105000, 112000, 108000, 125000, 118000, 130000, 122000, 128000, 135000, 125780, 0],
                borderColor: '#3b82f6',
              },
            ],
          };

          set({
            ingresosPorMes: mockData,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al cargar ingresos';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      // Obtener tendencias
      fetchTendencias: async () => {
        set({ isLoading: true, error: null });
        try {
          // TODO: const tendencias = await dashboardApi.getTendencias();
          
          const mockTendencias = {
            polizas: {
              valor: 856,
              cambio: 12.5, // +12.5% vs mes anterior
              periodo: 'mes' as const,
            },
            ingresos: {
              valor: 125780.50,
              cambio: 8.3,
              periodo: 'mes' as const,
            },
            usuarios: {
              valor: 1234,
              cambio: -2.1, // -2.1% vs mes anterior
              periodo: 'mes' as const,
            },
          };

          set({
            tendencias: mockTendencias,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al cargar tendencias';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      // Agregar actividad
      addActividad: (actividad: Omit<ActividadReciente, 'id' | 'timestamp'>) => {
        const newActividad: ActividadReciente = {
          ...actividad,
          id: Date.now().toString(),
          timestamp: new Date(),
        };

        set(state => ({
          actividadesRecientes: [newActividad, ...state.actividadesRecientes],
        }));
      },

      // Limpiar actividades
      clearActividades: () => {
        set({ actividadesRecientes: [] });
      },

      // Marcar actividad como leída
      markActividadAsRead: (id: string) => {
        // Esta funcionalidad se puede extender si necesitamos un estado de "leído"
        console.log('Actividad marcada como leída:', id);
      },

      // Establecer periodo
      setPeriodo: (periodo: DashboardState['periodoSeleccionado']) => {
        set({ periodoSeleccionado: periodo });
        // Recargar datos con el nuevo periodo
        get().refreshDashboard();
      },

      // Establecer fecha personalizada
      setFechaPersonalizada: (inicio: Date, fin: Date) => {
        set({
          periodoSeleccionado: 'personalizado',
          fechaInicio: inicio,
          fechaFin: fin,
        });
        get().refreshDashboard();
      },

      // Refrescar todo el dashboard
      refreshDashboard: async () => {
        const periodo = get().periodoSeleccionado;
        try {
          await Promise.all([
            get().fetchStats(periodo),
            get().fetchActividadesRecientes(),
            get().fetchPolizasPorEstado(),
            get().fetchIngresosPorMes(),
            get().fetchTendencias(),
          ]);
        } catch (error) {
          console.error('Error al refrescar dashboard:', error);
        }
      },

      // Manejo de errores
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      // Reset del store
      reset: () => set(initialState),
    }),
    { name: 'DashboardStore' }
  )
);
