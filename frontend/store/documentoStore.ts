import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { documentosApi } from '@/lib/api';

// Exportar tipo Documento para uso externo
export interface Documento {
  id?: number;
  nombre: string;
  archivo: string;
  tipo?: string;
  cliente?: number;
  poliza?: number;
  usuario?: number;
  fecha_subida?: string;
}

export interface DocumentoCreateRequest {
  nombre: string;
  tipo: string;
  archivo: File | string;
  poliza?: number;
  cliente?: number;
  descripcion?: string;
}

export interface DocumentoState {
  // Estado
  documentos: Documento[];
  documentoSeleccionado: Documento | null;
  isLoading: boolean;
  isUploading: boolean;
  isDownloading: boolean;
  isDeleting: boolean;
  error: string | null;

  // Filtros
  filtros: {
    tipo?: string;
    polizaId?: number;
    clienteId?: number;
  };

  // Acciones - CRUD
  fetchDocumentos: () => Promise<void>;
  fetchDocumentoById: (id: number) => Promise<void>;
  uploadDocumento: (data: DocumentoCreateRequest) => Promise<Documento>;
  deleteDocumento: (id: number) => Promise<void>;

  // Acciones - Filtros
  setFiltros: (filtros: DocumentoState['filtros']) => void;
  clearFiltros: () => void;
  getDocumentosByPoliza: (polizaId: number) => Documento[];
  getDocumentosByCliente: (clienteId: number) => Documento[];
  getDocumentosByTipo: (tipo: string) => Documento[];

  // Acciones - Utilidades
  downloadDocumento: (id: number) => Promise<void>;
  getDocumentoUrl: (id: number) => string | null;
  formatFileSize: (bytes: number) => string;

  // Acciones - Selección
  selectDocumento: (documento: Documento | null) => void;

  // Acciones - Limpieza
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  documentos: [],
  documentoSeleccionado: null,
  isLoading: false,
  isUploading: false,
  isDownloading: false,
  isDeleting: false,
  error: null,
  filtros: {},
};

export const useDocumentoStore = create<DocumentoState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Obtener todos los documentos
      fetchDocumentos: async () => {
        set({ isLoading: true, error: null });
        try {
          const documentos = await documentosApi.list();
          set({ documentos, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al obtener documentos';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      // Obtener documento por ID
      fetchDocumentoById: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
          const documento = await documentosApi.get(id);
          set({ 
            documentoSeleccionado: documento,
            isLoading: false 
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al obtener documento';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      // Subir documento
      uploadDocumento: async (data: DocumentoCreateRequest) => {
        set({ isUploading: true, error: null });
        try {
          // Si archivo es File, crear FormData
          let uploadData: any = data;
          
          if (data.archivo instanceof File) {
            const formData = new FormData();
            formData.append('archivo', data.archivo);
            formData.append('nombre', data.nombre);
            formData.append('tipo', data.tipo);
            if (data.poliza) formData.append('poliza', data.poliza.toString());
            if (data.cliente) formData.append('cliente', data.cliente.toString());
            if (data.descripcion) formData.append('descripcion', data.descripcion);
            uploadData = formData;
          }

          const newDocumento = await documentosApi.create(uploadData);
          
          // Agregar a la lista
          set(state => ({
            documentos: [...state.documentos, newDocumento],
            isUploading: false
          }));
          
          return newDocumento;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al subir documento';
          set({ error: errorMessage, isUploading: false });
          throw error;
        }
      },

      // Eliminar documento
      deleteDocumento: async (id: number) => {
        set({ isDeleting: true, error: null });
        try {
          await documentosApi.delete(id);
          
          set(state => ({
            documentos: state.documentos.filter(d => d.id !== id),
            documentoSeleccionado: state.documentoSeleccionado?.id === id 
              ? null 
              : state.documentoSeleccionado,
            isDeleting: false
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al eliminar documento';
          set({ error: errorMessage, isDeleting: false });
          throw error;
        }
      },

      // Filtros
      setFiltros: (filtros) => set({ filtros }),
      
      clearFiltros: () => set({ filtros: {} }),

      getDocumentosByPoliza: (polizaId: number) => 
        get().documentos.filter(d => d.poliza === polizaId),

      getDocumentosByCliente: (clienteId: number) => 
        get().documentos.filter(d => d.cliente === clienteId),

      getDocumentosByTipo: (tipo: string) => 
        get().documentos.filter(d => d.tipo === tipo),

      // Utilidades
      downloadDocumento: async (id: number) => {
        set({ isDownloading: true, error: null });
        try {
          const documento = get().documentos.find(d => d.id === id);
          if (!documento) {
            throw new Error('Documento no encontrado');
          }

          // Descargar el archivo
          const link = document.createElement('a');
          link.href = documento.archivo;
          link.download = documento.nombre;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          set({ isDownloading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al descargar documento';
          set({ error: errorMessage, isDownloading: false });
          throw error;
        }
      },

      getDocumentoUrl: (id: number) => {
        const documento = get().documentos.find(d => d.id === id);
        return documento?.archivo || null;
      },

      formatFileSize: (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
      },

      // Selección
      selectDocumento: (documento) => set({ documentoSeleccionado: documento }),

      // Limpieza
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      reset: () => set(initialState),
    }),
    { name: 'DocumentoStore' }
  )
);
