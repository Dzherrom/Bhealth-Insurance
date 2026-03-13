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
  User, 
  Settings
} from 'lucide-react';

interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  onClick?: () => void;
}

interface SidebarClientProps {
  onItemClick?: (item: SidebarItem) => void;
  clientId: string;
}

const clientItems = (clientId: string): SidebarItem[] => [
  { icon: User, label: 'Mi Perfil', href: `/client/${clientId}/profile` },
  { icon: Settings, label: 'Configuración', href: `/client/${clientId}/configuraciones` }
];

const SidebarClient = ({ onItemClick, clientId } : SidebarClientProps) => {
  const { state } = useSidebar();
  const handleItemClick = (item: SidebarItem) => () => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader >
        {state === "expanded" && (<p className="text-lg font-semibold px-2 py-1" >Bhealth Insurance</p>)}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Mi Cuenta</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {clientItems(clientId).map((item, index) => {
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
        {state === "expanded" && (<small className="text-xs text-muted-foreground px-2">BHealth Insurance Cliente</small>)}
      </SidebarFooter>
    </Sidebar>
  );
};

export default SidebarClient;