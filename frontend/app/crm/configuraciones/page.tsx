
'use client';

import React, { useState } from 'react';
import {
  SidebarConfiguraciones,
  StatusList,
  NotificacionesConfig,
  EtiquetasConfig,
  UsuariosFacturadosConfig,
  AgenciaConfig
} from '@/components/configuraciones';

const ConfiguracionesPage = () => {
  const [activeSection, setActiveSection] = useState('agencia');

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  // Renderizar el contenido basado en la sección activa
  const renderContent = () => {
    switch (activeSection) {
      case 'status':
        return <StatusList />;
      case 'notificaciones':
        return <NotificacionesConfig />;
      case 'etiquetas':
        return <EtiquetasConfig />;
      case 'usuarios-facturados':
        return <UsuariosFacturadosConfig />;
      case 'agencia':
      default:
        return <AgenciaConfig />;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex space-x-6">
        {/* Sidebar */}
        <SidebarConfiguraciones
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />

        {/* Contenido principal */}
        <div className="flex-1">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionesPage;