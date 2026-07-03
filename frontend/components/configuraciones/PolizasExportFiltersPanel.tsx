'use client';

import React, { memo, useEffect, useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Filter, Loader2, RotateCcw, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { etiquetasApi, tiposProductoApi, type FlatExportFilters } from '@/lib/api';
import { useCatalogoStore } from '@/store';
import { toast } from '@/hooks/use-toast';

export const EMPTY_EXPORT_FILTERS: FlatExportFilters = {
  etiqueta: '',
  estado: '',
  zip_code: '',
  aseguradora: '',
  tipo_producto: '',
  fecha_efectiva_desde: '',
  fecha_efectiva_hasta: '',
  fecha_creacion_desde: '',
  fecha_creacion_hasta: '',
  aplicantes_desde: '',
  aplicantes_hasta: '',
  agente: '',
};

type FilterOption = { id: number; label: string };

const SEARCHABLE_MIN_OPTIONS = 25;

const filterExtrasCache: {
  etiquetas: FilterOption[];
  tiposProducto: FilterOption[];
  loaded: boolean;
} = {
  etiquetas: [],
  tiposProducto: [],
  loaded: false,
};

function toOptions<T extends { id?: number }>(
  items: T[],
  labelFn: (item: T) => string,
): FilterOption[] {
  return items
    .filter((item) => item.id != null)
    .map((item) => ({ id: item.id as number, label: labelFn(item) }));
}

export interface PolizasExportFiltersPanelProps {
  loadingFiltered: boolean;
  hasAppliedFilters: boolean;
  appliedFilterCount: number;
  filteredTotal: number;
  onApply: (filters: FlatExportFilters) => void;
  onClearResults: () => void;
}

function PolizasExportFiltersPanelComponent({
  loadingFiltered,
  hasAppliedFilters,
  appliedFilterCount,
  filteredTotal,
  onApply,
  onClearResults,
}: PolizasExportFiltersPanelProps) {
  const [draftFilters, setDraftFilters] = useState<FlatExportFilters>({ ...EMPTY_EXPORT_FILTERS });

  const [etiquetas, setEtiquetas] = useState<FilterOption[]>(() => filterExtrasCache.etiquetas);
  const [tiposProducto, setTiposProducto] = useState<FilterOption[]>(
    () => filterExtrasCache.tiposProducto,
  );

  const storeAgentes = useCatalogoStore((state) => state.agentes);
  const storeAseguradoras = useCatalogoStore((state) => state.aseguradoras);
  const storeEstados = useCatalogoStore((state) => state.estadosPoliza);
  const fetchAgentes = useCatalogoStore((state) => state.fetchAgentes);
  const fetchAseguradoras = useCatalogoStore((state) => state.fetchAseguradoras);
  const fetchEstadosPoliza = useCatalogoStore((state) => state.fetchEstadosPoliza);

  const agentes = useMemo(
    () =>
      toOptions(storeAgentes, (item) =>
        item.nombre_completo || item.npn || `Agente #${item.id}`,
      ),
    [storeAgentes],
  );
  const aseguradoras = useMemo(
    () => toOptions(storeAseguradoras, (item) => item.nombre || `Compañía #${item.id}`),
    [storeAseguradoras],
  );
  const estados = useMemo(
    () => toOptions(storeEstados, (item) => item.nombre || `Estado #${item.id}`),
    [storeEstados],
  );

  useEffect(() => {
    const state = useCatalogoStore.getState();
    if (!state.catalogosLoaded.agentes && !state.isLoadingAgentes) {
      fetchAgentes().catch(() => undefined);
    }
    if (!state.catalogosLoaded.aseguradoras && !state.isLoadingAseguradoras) {
      fetchAseguradoras().catch(() => undefined);
    }
    if (!state.catalogosLoaded.estados && !state.isLoadingEstados) {
      fetchEstadosPoliza().catch(() => undefined);
    }
  }, [fetchAgentes, fetchAseguradoras, fetchEstadosPoliza]);

  useEffect(() => {
    if (filterExtrasCache.loaded) return;

    let cancelled = false;

    async function loadExtras() {
      try {
        const [etiquetasData, tiposData] = await Promise.all([
          etiquetasApi.list(),
          tiposProductoApi.list(),
        ]);
        if (cancelled) return;

        const nextEtiquetas = toOptions(
          etiquetasData,
          (item) => item.nombre || `Etiqueta #${item.id}`,
        );
        const nextTipos = toOptions(tiposData, (item) => item.nombre || `Tipo #${item.id}`);

        filterExtrasCache.etiquetas = nextEtiquetas;
        filterExtrasCache.tiposProducto = nextTipos;
        filterExtrasCache.loaded = true;

        setEtiquetas(nextEtiquetas);
        setTiposProducto(nextTipos);
      } catch {
        if (!cancelled) {
          toast({
            title: 'Filtros',
            description: 'No se pudieron cargar etiquetas o tipos de producto.',
            variant: 'destructive',
          });
        }
      }
    }

    loadExtras();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeFilterCount = useMemo(
    () => Object.values(draftFilters).filter((value) => String(value ?? '').trim() !== '').length,
    [draftFilters],
  );

  const updateDraftFilter = (key: keyof FlatExportFilters, value: string) => {
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply({ ...draftFilters });
  };

  const handleClear = () => {
    setDraftFilters({ ...EMPTY_EXPORT_FILTERS });
    onClearResults();
  };

  return (
    <aside className="w-full xl:w-80 shrink-0">
      <Card className="sticky top-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="w-4 h-4" />
            Filtros de exportación
            {activeFilterCount > 0 ? (
              <span className="ml-auto text-xs font-normal rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5">
                {activeFilterCount} pendiente{activeFilterCount !== 1 ? 's' : ''}
              </span>
            ) : null}
          </CardTitle>
          {hasAppliedFilters ? (
            <p className="text-xs text-muted-foreground pt-1">
              {appliedFilterCount > 0
                ? `${appliedFilterCount} filtro(s) activo(s) · ${filteredTotal} póliza(s)`
                : `Sin filtros · ${filteredTotal} póliza(s)`}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
          <FilterSelect
            label="Etiqueta"
            value={draftFilters.etiqueta ?? ''}
            onChange={(value) => updateDraftFilter('etiqueta', value)}
            options={etiquetas}
            placeholder="Todas"
          />
          <FilterSelect
            label="Estado"
            value={draftFilters.estado ?? ''}
            onChange={(value) => updateDraftFilter('estado', value)}
            options={estados}
            placeholder="Todos"
          />
          <div className="space-y-2">
            <Label>Código postal</Label>
            <Input
              value={draftFilters.zip_code ?? ''}
              onChange={(e) => updateDraftFilter('zip_code', e.target.value)}
              placeholder="Ej. 33101"
            />
          </div>
          <FilterSelect
            label="Compañía"
            value={draftFilters.aseguradora ?? ''}
            onChange={(value) => updateDraftFilter('aseguradora', value)}
            options={aseguradoras}
            placeholder="Todas"
            searchable
          />
          <FilterSelect
            label="Tipo de producto"
            value={draftFilters.tipo_producto ?? ''}
            onChange={(value) => updateDraftFilter('tipo_producto', value)}
            options={tiposProducto}
            placeholder="Todos"
          />
          <DateRangeFields
            label="Fecha de efectividad"
            from={draftFilters.fecha_efectiva_desde ?? ''}
            to={draftFilters.fecha_efectiva_hasta ?? ''}
            onFromChange={(value) => updateDraftFilter('fecha_efectiva_desde', value)}
            onToChange={(value) => updateDraftFilter('fecha_efectiva_hasta', value)}
          />
          <DateRangeFields
            label="Fecha de creación"
            from={draftFilters.fecha_creacion_desde ?? ''}
            to={draftFilters.fecha_creacion_hasta ?? ''}
            onFromChange={(value) => updateDraftFilter('fecha_creacion_desde', value)}
            onToChange={(value) => updateDraftFilter('fecha_creacion_hasta', value)}
          />
          <NumberRangeFields
            label="Cantidad de aplicantes"
            from={draftFilters.aplicantes_desde ?? ''}
            to={draftFilters.aplicantes_hasta ?? ''}
            onFromChange={(value) => updateDraftFilter('aplicantes_desde', value)}
            onToChange={(value) => updateDraftFilter('aplicantes_hasta', value)}
          />
          <FilterSelect
            label="Agente asignado"
            value={draftFilters.agente ?? ''}
            onChange={(value) => updateDraftFilter('agente', value)}
            options={agentes}
            placeholder="Todos"
            searchable
          />

          <Button className="w-full" onClick={handleApply} disabled={loadingFiltered}>
            {loadingFiltered ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            Aplicar filtros
          </Button>

          <Button variant="outline" className="w-full" onClick={handleClear}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Limpiar filtros
          </Button>
        </CardContent>
      </Card>
    </aside>
  );
}

const FilterSelect = memo(function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  searchable = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder: string;
  searchable?: boolean;
}) {
  const useSearchable = searchable || options.length >= SEARCHABLE_MIN_OPTIONS;

  if (useSearchable) {
    return (
      <SearchableFilterSelect
        label={label}
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value || 'all'} onValueChange={(next) => onChange(next === 'all' ? '' : next)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={String(option.id)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

const SearchableFilterSelect = memo(function SearchableFilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => String(option.id) === value);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="truncate text-left">{selected?.label ?? placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
          onWheel={(e) => e.stopPropagation()}
        >
          <Command>
            <CommandInput placeholder={`Buscar ${label.toLowerCase()}...`} />
            <ScrollArea className="h-[240px]">
              <CommandList className="max-h-none overflow-visible">
                <CommandEmpty>Sin resultados</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value={`__all__ ${placeholder}`}
                    onSelect={() => {
                      onChange('');
                      setOpen(false);
                    }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', value === '' ? 'opacity-100' : 'opacity-0')} />
                    {placeholder}
                  </CommandItem>
                  {options.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={option.label}
                      onSelect={() => {
                        onChange(String(option.id));
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === String(option.id) ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </ScrollArea>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
});

const DateRangeFields = memo(function DateRangeFields({
  label,
  from,
  to,
  onFromChange,
  onToChange,
}: {
  label: string;
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          aria-label={`${label} desde`}
        />
        <Input
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          aria-label={`${label} hasta`}
        />
      </div>
    </div>
  );
});

const NumberRangeFields = memo(function NumberRangeFields({
  label,
  from,
  to,
  onFromChange,
  onToChange,
}: {
  label: string;
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          min={0}
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          placeholder="Desde"
        />
        <Input
          type="number"
          min={0}
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          placeholder="Hasta"
        />
      </div>
    </div>
  );
});

export const PolizasExportFiltersPanel = memo(PolizasExportFiltersPanelComponent);
