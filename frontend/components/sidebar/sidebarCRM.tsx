'use client';

import React from 'react';
import { useState } from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { 
  Home,
  User, 
  Calendar, 
  ShieldPlus, 
  ClipboardPlus, 
  ReceiptText, 
  CircleCheckBig, 
  ClipboardPenLine, 
  FilePen, 
  ScrollText, 
  ChartNoAxesCombined, 
  Mail, 
  Settings,
  LogOut,
  ChevronDown
} from 'lucide-react';

interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  onClick?: () => void;
}

interface SidebarCRMProps {
  onItemClick?: (item: SidebarItem) => void;
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

const crmItems: SidebarItem[] = [
    { icon: Home, label: 'Dashboard', href: '/crm/dashboard' },
    { icon: User, label: 'Usuarios', href: '/crm/users' },
    { icon: Calendar, label: 'Citas', href: '/crm/citas' },
    { icon: ShieldPlus, label: 'Polizas', href: '/crm/polizas' },
    { icon: FilePen, label: 'Formularios de Firmas', href: '/crm/formularios-de-firmas' },
    { icon: ScrollText, label: 'Contratos', href: '/crm/contracts' },
    { icon: ChartNoAxesCombined, label: 'Comisiones', href: '/crm/analytics' },
    { icon: Mail, label: 'Correo electrónico', href: '/crm/messages' },
    { icon: Settings, label: 'Configuración', href: '/crm/configuraciones' }
];

const SidebarCRM = ({ onItemClick, onLogout, isLoggingOut = false } : SidebarCRMProps) => {
  const { state } = useSidebar();
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(true);

  const handleItemClick = (item: SidebarItem) => () => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader >
        {state === "expanded" && (
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-between px-2 py-1 text-lg font-semibold"
            onClick={() => setIsSubmenuOpen((prev) => !prev)}
          >
            <span>Panel CRM</span>
            <ChevronDown className={cn('h-4 w-4 transition-transform', isSubmenuOpen ? 'rotate-0' : '-rotate-90')} />
          </Button>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {state === "expanded" && <SidebarGroupLabel>Gestión</SidebarGroupLabel>}
          <SidebarGroupContent className={cn(state === 'expanded' && !isSubmenuOpen && 'hidden')}>
            <SidebarMenu>
              {crmItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      onClick={handleItemClick(item)}
                    >
                      <IconComponent />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          title={isLoggingOut ? 'Cerrando sesión' : 'Cerrar sesión'}
          className={cn(
            'mb-2 bg-red-600 text-white hover:bg-red-700 hover:text-white',
            state === 'expanded' ? 'w-full justify-start gap-2' : 'h-8 w-8 p-0'
          )}
        >
          <LogOut className="h-4 w-4" />
          {state === 'expanded' && <span>{isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}</span>}
        </Button>
        {state === "expanded" && (<small className="text-xs text-muted-foreground px-2">BHealth Insurance CRM</small>)}
      </SidebarFooter>
    </Sidebar>
  );
};

export default SidebarCRM;