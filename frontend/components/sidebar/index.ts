// Componentes especializados 
export { default as SidebarCRM } from './sidebarCRM';
export { default as SidebarClient } from './sidebarClient';

// Re-exportar componentes shadcn/ui para fácil acceso
export {
  Sidebar,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';