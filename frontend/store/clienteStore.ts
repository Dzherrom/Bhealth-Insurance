import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { clientesApi, direccionesApi } from '@/lib/api';
import type { 
  Cliente, 
  ClienteCreateRequest, 
  ClienteUpdateRequest,
  Direccion,
  DireccionCreateRequest,
  DireccionUpdateRequest
} from '@/types';

export interface ClienteState {
  // Estado - Cliente actual
  clienteActual: Cliente | null;
  direcciones: Direccion[];
  direccionPrincipal: Direccion | null;
  
  // Estado - Carga
  isLoading: boolean;
  isUpdating: boolean;
  isCreating: boolean;
  
  // Estado - Errores
  error: string | null;

  // Acciones - Cliente
  fetchClienteById: (id: number) => Promise<void>;
  updateCliente: (id: number, data: ClienteUpdateRequest) => Promise<void>;
  createCliente: (data: ClienteCreateRequest) => Promise<Cliente>;
  setClienteActual: (cliente: Cliente | null) => void;

  // Acciones - Direcciones
  fetchDireccionesCliente: (clienteId: number) => Promise<void>;
  createDireccion: (data: DireccionCreateRequest) => Promise<Direccion>;
  updateDireccion: (id: number, data: DireccionUpdateRequest) => Promise<Direccion>;
  deleteDireccion: (id: number) => Promise<void>;
  setDireccionPrincipal: (direccionId: number) => void;

  // Acciones - Utilidades
  getNombreCompleto: () => string;
  getEdad: () => number | null;
  
  // Acciones - Limpieza
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  clienteActual: null,
  direcciones: [],
  direccionPrincipal: null,
  isLoading: false,
  isUpdating: false,
  isCreating: false,
  error: null,
};

export const useClienteStore = create<ClienteState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Obtener cliente por ID
      fetchClienteById: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
          const cliente = await clientesApi.get(id);
          set({ 
            clienteActual: cliente,
            isLoading: false 
          });

          // Si tiene dirección, cargar todas las direcciones
          if (cliente.direccion) {
            await get().fetchDireccionesCliente(id);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al obtener cliente';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      // Actualizar cliente
      updateCliente: async (id: number, data: ClienteUpdateRequest) => {
        set({ isUpdating: true, error: null });
        try {
          const updatedCliente = await clientesApi.patch(id, data);
          set({ 
            clienteActual: updatedCliente,
            isUpdating: false 
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al actualizar cliente';
          set({ error: errorMessage, isUpdating: false });
          throw error;
        }
      },

      // Crear cliente
      createCliente: async (data: ClienteCreateRequest) => {
        set({ isCreating: true, error: null });
        try {
          const newCliente = await clientesApi.create(data);
          set({ 
            clienteActual: newCliente,
            isCreating: false 
          });
          return newCliente;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al crear cliente';
          set({ error: errorMessage, isCreating: false });
          throw error;
        }
      },

      // Establecer cliente actual
      setClienteActual: (cliente: Cliente | null) => set({ clienteActual: cliente }),

      // Obtener direcciones del cliente
      fetchDireccionesCliente: async (clienteId: number) => {
        try {
          // En el futuro, cuando haya endpoint específico para direcciones de cliente
          // Por ahora, obtenemos la dirección principal del cliente
          const cliente = get().clienteActual;
          if (cliente?.direccion_info) {
            set({ 
              direcciones: [cliente.direccion_info],
              direccionPrincipal: cliente.direccion_info
            });
          }
        } catch (error) {
          console.error('Error al obtener direcciones:', error);
        }
      },

      // Crear dirección
      createDireccion: async (data: DireccionCreateRequest) => {
        set({ isCreating: true, error: null });
        try {
          const newDireccion = await direccionesApi.create(data);
          
          // Agregar a la lista de direcciones
          set(state => ({ 
            direcciones: [...state.direcciones, newDireccion],
            isCreating: false
          }));
          
          return newDireccion;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al crear dirección';
          set({ error: errorMessage, isCreating: false });
          throw error;
        }
      },

      // Actualizar dirección
      updateDireccion: async (id: number, data: DireccionUpdateRequest) => {
        set({ isUpdating: true, error: null });
        try {
          const updatedDireccion = await direccionesApi.patch(id, data);
          
          // Actualizar en la lista
          set(state => ({
            direcciones: state.direcciones.map(d => 
              d.id === id ? updatedDireccion : d
            ),
            direccionPrincipal: state.direccionPrincipal?.id === id 
              ? updatedDireccion 
              : state.direccionPrincipal,
            isUpdating: false
          }));
          
          return updatedDireccion;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al actualizar dirección';
          set({ error: errorMessage, isUpdating: false });
          throw error;
        }
      },

      // Eliminar dirección
      deleteDireccion: async (id: number) => {
        try {
          await direccionesApi.delete(id);
          
          set(state => ({
            direcciones: state.direcciones.filter(d => d.id !== id),
            direccionPrincipal: state.direccionPrincipal?.id === id 
              ? null 
              : state.direccionPrincipal
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al eliminar dirección';
          set({ error: errorMessage });
          throw error;
        }
      },

      // Establecer dirección principal
      setDireccionPrincipal: (direccionId: number) => {
        const direccion = get().direcciones.find(d => d.id === direccionId);
        if (direccion) {
          set({ direccionPrincipal: direccion });
        }
      },

      // Obtener nombre completo
      getNombreCompleto: () => {
        const cliente = get().clienteActual;
        if (!cliente) return '';
        
        return cliente.nombre_completo || 
          `${cliente.primer_nombre} ${cliente.segundo_nombre || ''} ${cliente.apellido_paterno} ${cliente.apellido_materno || ''}`.trim();
      },

      // Obtener edad
      getEdad: () => {
        const cliente = get().clienteActual;
        if (!cliente) return null;
        
        return cliente.edad_calculada || null;
      },

      // Manejo de errores
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      // Reset
      reset: () => set(initialState),
    }),
    { name: 'ClienteStore' }
  )
);
