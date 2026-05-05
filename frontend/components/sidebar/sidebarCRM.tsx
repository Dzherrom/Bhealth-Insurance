'use client';

import React from 'react';

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
  Settings
} from 'lucide-react';

interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  onClick?: () => void;
}

interface SidebarCRMProps {
  onItemClick?: (item: SidebarItem) => void;
}

const crmItems: SidebarItem[] = [
    { icon: Home, label: 'Dashboard', href: '/crm/dashboard' },
    { icon: User, label: 'Usuarios', href: '/crm/users' },
    { icon: Calendar, label: 'Calendario', href: '/crm/appointments' },
    { icon: ShieldPlus, label: 'Polizas', href: '/crm/polizas' },
    { icon: FilePen, label: 'Formularios de Firmas', href: '/crm/formularios-de-firmas' },
    { icon: ScrollText, label: 'Contratos', href: '/crm/contracts' },
    { icon: ChartNoAxesCombined, label: 'Comisiones', href: '/crm/analytics' },
    { icon: Mail, label: 'Correo electrónico', href: '/crm/messages' },
    { icon: Settings, label: 'Configuración', href: '/crm/configuraciones' }
];

const SidebarCRM = ({ onItemClick } : SidebarCRMProps) => {
  const { state } = useSidebar();
  const handleItemClick = (item: SidebarItem) => () => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader >
        {state === "expanded" && (<p className="text-lg font-semibold px-2 py-1" >Panel CRM</p>)}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestión</SidebarGroupLabel>
          <SidebarGroupContent>
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
        {state === "expanded" && (<small className="text-xs text-muted-foreground px-2">BHealth Insurance CRM</small>)}
      </SidebarFooter>
    </Sidebar>
  );
};

export default SidebarCRM;