
'use client';

import React, { useState } from 'react';
import {
  SidebarConfiguraciones,
  StatusList,
  NotificacionesConfig,
  UsuariosFacturadosConfig,
  AgenciaConfig,
  ListadoGeneral,
} from '@/components/configuraciones';
import { EtiquetasConfig } from '@/components/configuraciones/EtiquetasConfig';

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
      case 'listado':
        return <ListadoGeneral />;
      case 'etiquetas-documentos':
        return <EtiquetasConfig tipo="DOCUMENTO" title="Etiquetas de documento" description="Configura etiquetas para documentos." />;
      case 'usuarios-facturados':
        return <UsuariosFacturadosConfig />;
      case 'agencia':
      default:
        return <AgenciaConfig />;
    }
  };

  return (
    <div className="app-page min-w-0">
      <div className="flex gap-6 min-w-0">
        <SidebarConfiguraciones
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />

        <div className="flex-1 min-w-0 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionesPage;