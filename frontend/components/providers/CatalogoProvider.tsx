'use client';

import { useEffect } from 'react';
import { useCatalogoStore } from '@/store';

/**
 * Provider que inicializa automáticamente los catálogos del sistema.
 * Debe envolver la aplicación o las secciones que necesiten acceso a catálogos.
 * 
 * Los catálogos se persisten en localStorage, por lo que solo se cargan
 * si no están en cache o si se invalidan explícitamente.
 */
export function CatalogoProvider({ children }: { children: React.ReactNode }) {
  const { fetchAllCatalogos, catalogosLoaded } = useCatalogoStore();

  useEffect(() => {
    // Solo cargar si los catálogos no están en cache
    const needsLoading = Object.values(catalogosLoaded).some(loaded => !loaded);
    
    if (needsLoading) {
      fetchAllCatalogos().catch(error => {
        console.error('Error al cargar catálogos:', error);
      });
    }
  }, [fetchAllCatalogos, catalogosLoaded]);

  return <>{children}</>;
}
