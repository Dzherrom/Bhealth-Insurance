'use client';

import { useEffect } from 'react';
import { useCatalogoStore } from '@/store';

/**
 * Provider que inicializa automáticamente los catálogos del sistema.
 * Los catálogos se persisten en localStorage; solo se cargan si no están en caché.
 */
export function CatalogoProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const state = useCatalogoStore.getState();
    const needsLoading = Object.values(state.catalogosLoaded).some((loaded) => !loaded);
    if (!needsLoading) return;

    state.fetchAllCatalogos().catch((error) => {
      console.error('Error al cargar catálogos:', error);
    });
  }, []);

  return <>{children}</>;
}
