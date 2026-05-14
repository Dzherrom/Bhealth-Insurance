'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Bell, 
  List, 
  Tag, 
  FileText, 
  Users,
  Monitor
} from 'lucide-react';

interface SidebarConfiguracionesProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function SidebarConfiguraciones({ 
  activeSection, 
  onSectionChange 
}: SidebarConfiguracionesProps) {
  const menuItems = [
    {
      id: 'agencia',
      label: 'Agencia',
      icon: Building2,
      isActive: true
    },
    {
        id: 'status',
        label: 'Status',
        icon: Monitor,
        isActive: false
    },
    {
      id: 'notificaciones',
      label: 'Notificaciones',
      icon: Bell,
      isActive: false
    },
    {
      id: 'listado',
      label: 'Listado',
      icon: List,
      isActive: false
    },
    {
      id: 'etiquetas-polizas',
      label: 'Etiquetas de póliza',
      icon: Tag,
      isActive: false
    },
    {
      id: 'etiquetas-documentos',
      label: 'Etiquetas de documento',
      icon: FileText,
      isActive: false
    },
    {
      id: 'usuarios-facturados',
      label: 'Usuarios facturados',
      icon: Users,
      isActive: false
    }
  ];

  return (
    <div className="w-64 space-y-4">
      {/* Logo y informaciÃ³n */}
      <Card className="p-4">
        <div className="space-y-3">
          {/* Logo placeholder */}
          <div className="flex items-center justify-center h-8">
            <div className="text-lg font-bold text-gray-600">
              Logo
            </div>
          </div>
          
          {/* CÃ³digo de portal */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">CÃ³digo de portal</span>
              <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                8252026
              </Badge>
            </div>
          </div>
          
          {/* InformaciÃ³n de fechas */}
          <div className="space-y-1 text-xs text-gray-500">
            <div>
              <span className="font-medium">Cliente desde:</span>
              <br />
              <span>Jun 07, 2024 3:33 PM</span>
            </div>
            <div>
              <span className="font-medium">Ãšltima actualizaciÃ³n:</span>
              <br />
              <span>Dec 05, 2025 9:00 PM</span>
            </div>
          </div>
        </div>
      </Card>

      {/* MenÃº de navegaciÃ³n */}
      <Card className="p-2">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <IconComponent className="w-4 h-4 flex-shrink-0" />
                <span className="text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </Card>
    </div>
  );
}