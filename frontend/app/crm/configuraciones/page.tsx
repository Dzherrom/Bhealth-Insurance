
'use client';

import React, { useState } from 'react';
import {
  InformacionNegocioCard,
  DireccionNegocioCard,
  BrandingPortalCard,
  SidebarConfiguraciones,
  StatusList,
  mockConfiguracionesData,
  ConfiguracionesData
} from '@/components/configuraciones';

const ConfiguracionesPage = () => {
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionesData>(mockConfiguracionesData);
  const [activeSection, setActiveSection] = useState('agencia');

  const handleEditInformacionNegocio = () => {
    console.log('Editar información del negocio');
    // Aquí se abriría un modal o formulario de edición
  };

  const handleEditDireccionNegocio = () => {
    console.log('Editar dirección del negocio');
    // Aquí se abriría un modal o formulario de edición
  };

  const handleEditBrandingPortal = () => {
    console.log('Editar branding del portal');
    // Aquí se abriría un modal o formulario de edición
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    console.log('Cambiar a sección:', section);
  };

  // Renderizar el contenido basado en la sección activa
  const renderContent = () => {
    switch (activeSection) {
      case 'status':
        return <StatusList />;
      case 'agencia':
      default:
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Agencia
              </h1>
            </div>

            {/* Configuraciones Cards */}
            <div className="space-y-6">
              {/* Información del negocio */}
              <InformacionNegocioCard
                data={configuraciones.informacionNegocio}
                onEdit={handleEditInformacionNegocio}
              />

              {/* Dirección del negocio */}
              <DireccionNegocioCard
                data={configuraciones.direccionNegocio}
                onEdit={handleEditDireccionNegocio}
              />

              {/* Branding del Portal */}
              <BrandingPortalCard
                data={configuraciones.brandingPortal}
                onEdit={handleEditBrandingPortal}
              />
            </div>
          </div>
        );
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