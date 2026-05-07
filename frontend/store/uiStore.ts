import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface UIState {
  // Estado de navegación
  activeTabIndex: number;
  
  // Estado de modales y sidebars
  isSidebarOpen: boolean;
  isModalOpen: boolean;
  modalType: string | null;
  
  // Estado de carga
  isPageLoading: boolean;
  
  // Acciones
  setActiveTabIndex: (index: number) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  openModal: (type: string) => void;
  closeModal: () => void;
  setPageLoading: (isLoading: boolean) => void;
  reset: () => void;
}

const initialState = {
  activeTabIndex: 0,
  isSidebarOpen: true,
  isModalOpen: false,
  modalType: null,
  isPageLoading: false,
};

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      ...initialState,

      // Cambiar tab activo
      setActiveTabIndex: (index: number) => set({ activeTabIndex: index }),

      // Toggle sidebar
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      // Abrir/cerrar sidebar
      setSidebarOpen: (isOpen: boolean) => set({ isSidebarOpen: isOpen }),

      // Abrir modal
      openModal: (type: string) => set({ isModalOpen: true, modalType: type }),

      // Cerrar modal
      closeModal: () => set({ isModalOpen: false, modalType: null }),

      // Estado de carga de página
      setPageLoading: (isLoading: boolean) => set({ isPageLoading: isLoading }),

      // Resetear estado
      reset: () => set(initialState),
    }),
    { name: 'UIStore' }
  )
);
