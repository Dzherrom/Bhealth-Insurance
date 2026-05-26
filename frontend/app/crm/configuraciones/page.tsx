
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
      case 'etiquetas-polizas':
        return <EtiquetasConfig tipo="POLIZA" title="Etiquetas de póliza" description="Configura etiquetas para pólizas." />;
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
    <div className="app-page">
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