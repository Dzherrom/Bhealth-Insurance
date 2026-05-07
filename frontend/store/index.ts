// Exportar todos los stores desde un único punto
export { useAuthStore } from './authStore';
export { useUIStore } from './uiStore';
export { usePolizaStore } from './polizaStore';
export { useTareaStore } from './tareaStore';
export { useCatalogoStore } from './catalogoStore';
export { useClienteStore } from './clienteStore';
export { useNotificationStore } from './notificationStore';
export { useDocumentoStore } from './documentoStore';

// CRM Stores
export { useCRMUsersStore } from './crmUsersStore';
export { useFormulariosFirmasStore } from './formulariosFirmasStore';
export { useConfiguracionesCRMStore } from './configuracionesCRMStore';
export { useDashboardStore } from './dashboardStore';

// Re-exportar tipos si es necesario
export type { AuthState } from './authStore';
export type { UIState } from './uiStore';
export type { PolizaState } from './polizaStore';
export type { TareaState } from './tareaStore';
export type { CatalogoState } from './catalogoStore';
export type { ClienteState } from './clienteStore';
export type { NotificationState, Notification } from './notificationStore';
export type { DocumentoState, Documento } from './documentoStore';

// CRM Types
export type { CRMUsersState, CRMUser, UserRole, UserStatus } from './crmUsersStore';
export type { FormulariosFirmasState, FormularioFirma, FormularioStatus, Firmante } from './formulariosFirmasStore';
export type { 
  ConfiguracionesCRMState, 
  InformacionNegocio, 
  DireccionNegocio, 
  BrandingPortal,
  EstadoPoliza 
} from './configuracionesCRMStore';
export type { DashboardState, DashboardStats, ActividadReciente } from './dashboardStore';