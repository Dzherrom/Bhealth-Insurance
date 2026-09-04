'use client';

import { useState } from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  PolizasExportFiltersPanel,
  EMPTY_EXPORT_FILTERS,
  type PolizasExportFiltersPanelProps,
} from '@/components/configuraciones/PolizasExportFiltersPanel';
import type { FlatExportFilters } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

type SavedPolicyFilter = {
  id: string;
  name: string;
  filters: FlatExportFilters;
};

export function flatFiltersToQuery(
  filters: FlatExportFilters,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => String(value ?? '').trim() !== ''),
  ) as Record<string, string>;
}

export function countFlatFilters(filters: FlatExportFilters): number {
  return Object.values(filters).filter((value) => String(value ?? '').trim() !== '').length;
}

type DrawerProps = Omit<
  PolizasExportFiltersPanelProps,
  'onApply' | 'onClearResults' | 'loadingFiltered' | 'hasAppliedFilters' | 'appliedFilterCount' | 'filteredTotal'
> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: PolizasExportFiltersPanelProps['onApply'];
  onClear?: () => void;
};

export function PolizasAdvancedFiltersButton({
  activeCount,
  onClick,
}: {
  activeCount?: number;
  onClick: () => void;
}) {
  return (
    <Button type="button" variant="outline" onClick={onClick} className="gap-2">
      <Filter className="h-4 w-4" />
      Filtros avanzados
      {activeCount ? (
        <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
          {activeCount}
        </span>
      ) : null}
    </Button>
  );
}

export function PolizasAdvancedFiltersDrawer({
  open,
  onOpenChange,
  onApply,
  onClear,
}: DrawerProps) {
  const user = useAuthStore((state) => state.user);
  const updateSettings = useAuthStore((state) => state.updateSettings);
  const [draftFilters, setDraftFilters] = useState<FlatExportFilters>({ ...EMPTY_EXPORT_FILTERS });
  const [filterName, setFilterName] = useState('');
  const [selectedSavedId, setSelectedSavedId] = useState('');
  const savedFilters = (
    user?.profile?.settings?.savedPolicyFilters as SavedPolicyFilter[] | undefined
  ) ?? [];

  const handleSave = async () => {
    const name = filterName.trim();
    if (!name || !Object.values(draftFilters).some((value) => String(value ?? '').trim())) return;
    const next = [
      ...savedFilters.filter((item) => item.name.toLowerCase() !== name.toLowerCase()),
      { id: crypto.randomUUID(), name, filters: draftFilters },
    ];
    await updateSettings({
      ...(user?.profile?.settings ?? {}),
      savedPolicyFilters: next,
    });
    setFilterName('');
  };

  const handleDelete = async (id: string) => {
    await updateSettings({
      ...(user?.profile?.settings ?? {}),
      savedPolicyFilters: savedFilters.filter((item) => item.id !== id),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Filtros avanzados</SheetTitle>
          <SheetDescription>
            Filtra pólizas y cotizaciones usando los mismos criterios de importación y exportación.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          <div className="mb-4 space-y-2">
            <p className="text-sm font-medium">Filtros guardados</p>
            <div className="flex gap-2">
              <select
                className="h-9 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm"
                defaultValue=""
                onChange={(event) => {
                  setSelectedSavedId(event.target.value);
                  const selected = savedFilters.find((item) => item.id === event.target.value);
                  if (selected) setDraftFilters({ ...selected.filters });
                }}
              >
                <option value="">Seleccionar filtro...</option>
                {savedFilters.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              {savedFilters.length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedSavedId) void handleDelete(selectedSavedId);
                  }}
                  disabled={!selectedSavedId}
                  aria-label="Eliminar filtro guardado seleccionado"
                >
                  Eliminar
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Input
                value={filterName}
                onChange={(event) => setFilterName(event.target.value)}
                placeholder="Nombre del filtro"
              />
              <Button type="button" size="sm" onClick={() => void handleSave()}>
                Guardar
              </Button>
            </div>
          </div>
          <PolizasExportFiltersPanel
            embedded
            loadingFiltered={false}
            hasAppliedFilters={false}
            appliedFilterCount={0}
            filteredTotal={0}
            value={draftFilters}
            onChange={setDraftFilters}
            onApply={(filters) => {
              onApply(filters);
              onOpenChange(false);
            }}
            onClearResults={() => {
              setDraftFilters({ ...EMPTY_EXPORT_FILTERS });
              onClear?.();
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
