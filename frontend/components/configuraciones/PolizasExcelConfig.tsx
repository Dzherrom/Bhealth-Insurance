'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PagedNumberPagination } from '@/components/ui/paged-number-pagination';
import {
  Download,
  Upload,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  polizasFlatApi,
  type FlatExportFilters,
  type FlatImportedPolicy,
  type FlatPolicyImportSummary,
} from '@/lib/api';
import type { PolizaListResponse } from '@/types';
import { chunkRows, parseFlatPolicySpreadsheet } from '@/lib/flatPolicySpreadsheet';
import { toast } from '@/hooks/use-toast';
import { PolizasFilteredTable } from '@/components/configuraciones/PolizasFilteredTable';
import {
  EMPTY_EXPORT_FILTERS,
  PolizasExportFiltersPanel,
} from '@/components/configuraciones/PolizasExportFiltersPanel';

const IMPORT_BATCH_SIZE = 25;
const TABLE_PAGE_SIZE = 10;
const FILTERED_PAGE_SIZE = 10;

export function PolizasExcelConfig() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState('');
  const [lastSummary, setLastSummary] = useState<FlatPolicyImportSummary | null>(null);
  const [importedPolicies, setImportedPolicies] = useState<FlatImportedPolicy[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<FlatExportFilters>({ ...EMPTY_EXPORT_FILTERS });
  const [importTablePage, setImportTablePage] = useState(1);

  const [filteredPolizas, setFilteredPolizas] = useState<PolizaListResponse[]>([]);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [filteredPage, setFilteredPage] = useState(1);
  const [loadingFiltered, setLoadingFiltered] = useState(false);
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false);
  const appliedFiltersRef = useRef<FlatExportFilters>({ ...EMPTY_EXPORT_FILTERS });

  const appliedFilterCount = useMemo(
    () => Object.values(appliedFilters).filter((value) => String(value ?? '').trim() !== '').length,
    [appliedFilters],
  );

  const totalImportTablePages = Math.max(1, Math.ceil(importedPolicies.length / TABLE_PAGE_SIZE));
  const paginatedImported = useMemo(() => {
    const start = (importTablePage - 1) * TABLE_PAGE_SIZE;
    return importedPolicies.slice(start, start + TABLE_PAGE_SIZE);
  }, [importedPolicies, importTablePage]);

  const fetchFilteredPolizas = useCallback(async (page: number, filters: FlatExportFilters) => {
    setLoadingFiltered(true);
    try {
      const result = await polizasFlatApi.listPreview({
        page,
        page_size: FILTERED_PAGE_SIZE,
        ...filters,
      });
      setFilteredPolizas(result.results);
      setFilteredTotal(result.count);
      setFilteredPage(page);
    } catch (err) {
      setFilteredPolizas([]);
      setFilteredTotal(0);
      toast({
        title: 'Error al buscar pólizas',
        description: err instanceof Error ? err.message : 'No se pudieron cargar las pólizas.',
        variant: 'destructive',
      });
    } finally {
      setLoadingFiltered(false);
    }
  }, []);

  const handleApplyFilters = useCallback(
    (filters: FlatExportFilters) => {
      setAppliedFilters(filters);
      appliedFiltersRef.current = filters;
      setHasAppliedFilters(true);
      setFilteredPage(1);
      fetchFilteredPolizas(1, filters);
    },
    [fetchFilteredPolizas],
  );

  const handleClearFilterResults = useCallback(() => {
    setAppliedFilters({ ...EMPTY_EXPORT_FILTERS });
    appliedFiltersRef.current = { ...EMPTY_EXPORT_FILTERS };
    setFilteredPolizas([]);
    setFilteredTotal(0);
    setFilteredPage(1);
    setHasAppliedFilters(false);
  }, []);

  const handleFilteredPageChange = useCallback(
    (page: number) => {
      fetchFilteredPolizas(page, appliedFiltersRef.current);
    },
    [fetchFilteredPolizas],
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      const filtersToExport = hasAppliedFilters ? appliedFilters : undefined;
      const blob = await polizasFlatApi.exportExcel({ filters: filtersToExport });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `polizas-${stamp}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({
        title: 'Exportación completada',
        description:
          appliedFilterCount > 0 && hasAppliedFilters
            ? `Archivo generado con ${appliedFilterCount} filtro(s) aplicado(s) · ${filteredTotal} póliza(s).`
            : 'El archivo Excel se descargó correctamente.',
      });
    } catch (err) {
      toast({
        title: 'Error al exportar',
        description: err instanceof Error ? err.message : 'No se pudo generar el archivo.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportProgress(0);
    setImportStatus('Leyendo archivo...');
    setLastSummary(null);
    setImportedPolicies([]);
    setImportErrors([]);
    setImportTablePage(1);

    try {
      const { headers, rows, dataRowStartIndex } = await parseFlatPolicySpreadsheet(file);
      if (!rows.length) {
        throw new Error('El archivo no contiene filas de pólizas para importar.');
      }

      const batches = chunkRows(rows, IMPORT_BATCH_SIZE);
      const aggregate: FlatPolicyImportSummary = {
        processed_rows: 0,
        created_policies: 0,
        updated_policies: 0,
        created_dependents: 0,
        updated_dependents: 0,
        errors: [],
        imported_policies: [],
      };

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
        const batch = batches[batchIndex];
        const startRowIndex = dataRowStartIndex + batchIndex * IMPORT_BATCH_SIZE;

        setImportStatus(`Importando lote ${batchIndex + 1} de ${batches.length}...`);

        const result = await polizasFlatApi.importBatch({
          headers,
          rows: batch,
          start_row_index: startRowIndex,
        });

        const summary = result.summary;
        aggregate.processed_rows += summary.processed_rows;
        aggregate.created_policies += summary.created_policies;
        aggregate.updated_policies += summary.updated_policies;
        aggregate.created_dependents += summary.created_dependents;
        aggregate.updated_dependents += summary.updated_dependents;
        aggregate.errors.push(...(summary.errors ?? []));
        aggregate.imported_policies.push(...(summary.imported_policies ?? []));

        setImportProgress(Math.round(((batchIndex + 1) / batches.length) * 100));
        setImportedPolicies([...aggregate.imported_policies]);
        setImportErrors([...aggregate.errors]);
      }

      setLastSummary(aggregate);
      setImportStatus('Importación completada');
      toast({
        title: 'Importación completada',
        description: `${aggregate.created_policies} pólizas creadas, ${aggregate.updated_policies} actualizadas.`,
      });
    } catch (err) {
      setImportStatus('');
      toast({
        title: 'Error al importar',
        description: err instanceof Error ? err.message : 'No se pudo procesar el archivo.',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="flex flex-col xl:flex-row gap-6 w-full">
      <div className="flex-1 min-w-0 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              Importar / Exportar pólizas (Excel)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Formato compatible con <strong>ejemplo polizas.xlsx</strong>: 51 columnas base y bloques de
              16 columnas por dependiente. Configura filtros y pulsa &quot;Aplicar filtros&quot; para
              previsualizar y exportar un subconjunto.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleExport} disabled={exporting || importing}>
                {exporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Exportar pólizas a Excel
              </Button>

              <Button variant="outline" onClick={handleImportClick} disabled={importing || exporting}>
                {importing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Importar pólizas desde Excel
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {importing ? (
              <div className="space-y-2 rounded-lg border bg-slate-50 dark:bg-slate-900/40 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{importStatus || 'Procesando...'}</span>
                  <span className="text-muted-foreground">{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="h-2" />
              </div>
            ) : null}

            {lastSummary ? (
              <div className="rounded-lg border bg-slate-50 dark:bg-slate-900/40 p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 font-medium text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Resultado de la última importación
                </div>
                <ul className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <li>Filas procesadas: {lastSummary.processed_rows}</li>
                  <li>Pólizas creadas: {lastSummary.created_policies}</li>
                  <li>Pólizas actualizadas: {lastSummary.updated_policies}</li>
                  <li>Dependientes creados: {lastSummary.created_dependents}</li>
                  <li>Dependientes actualizados: {lastSummary.updated_dependents}</li>
                </ul>
                {importErrors.length > 0 ? (
                  <div className="mt-2 text-amber-700 dark:text-amber-400">
                    <div className="flex items-center gap-1 font-medium">
                      <AlertCircle className="w-4 h-4" />
                      {importErrors.length} advertencia(s)
                    </div>
                    <ul className="mt-1 max-h-32 overflow-y-auto list-disc pl-5">
                      {importErrors.slice(0, 10).map((err) => (
                        <li key={err}>{err}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Pólizas filtradas
              {hasAppliedFilters ? (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({filteredTotal} resultado{filteredTotal !== 1 ? 's' : ''})
                </span>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PolizasFilteredTable
              polizas={filteredPolizas}
              totalCount={filteredTotal}
              page={filteredPage}
              pageSize={FILTERED_PAGE_SIZE}
              isLoading={loadingFiltered}
              hasSearched={hasAppliedFilters}
              onPageChange={handleFilteredPageChange}
            />
          </CardContent>
        </Card>

        {importedPolicies.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pólizas importadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/60">
                    <tr>
                      <th className="p-3 font-semibold">Cliente</th>
                      <th className="p-3 font-semibold">FFM / Member ID</th>
                      <th className="p-3 font-semibold">Agente</th>
                      <th className="p-3 font-semibold">Estado</th>
                      <th className="p-3 font-semibold">Fecha efectiva</th>
                      <th className="p-3 font-semibold">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedImported.map((poliza) => (
                      <tr
                        key={`${poliza.id}-${poliza.row_index ?? 0}-${poliza.id_mercado}`}
                        className="border-t hover:bg-slate-50/80 dark:hover:bg-slate-900/30"
                      >
                        <td className="p-3">
                          <Link
                            href={`/crm/polizas/${poliza.id}`}
                            className="font-medium text-indigo-600 hover:underline"
                          >
                            {poliza.cliente_principal || 'Sin nombre'}
                          </Link>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          <div>{poliza.id_mercado}</div>
                          <div className="text-xs">{poliza.id_miembro}</div>
                        </td>
                        <td className="p-3">{poliza.agente_nombre || '—'}</td>
                        <td className="p-3">{poliza.estado_nombre || '—'}</td>
                        <td className="p-3">{poliza.fecha_efectiva || '—'}</td>
                        <td className="p-3">
                          <span
                            className={
                              poliza.action === 'created'
                                ? 'text-green-700 dark:text-green-400 font-medium'
                                : 'text-blue-700 dark:text-blue-400 font-medium'
                            }
                          >
                            {poliza.action === 'created' ? 'Creada' : 'Actualizada'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
                <span>
                  Página {importTablePage} de {totalImportTablePages} · {importedPolicies.length} pólizas importadas
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={importTablePage <= 1}
                    onClick={() => setImportTablePage((p) => Math.max(1, p - 1))}
                  >
                    Anterior
                  </Button>
                  <PagedNumberPagination
                    page={importTablePage}
                    totalPages={totalImportTablePages}
                    onPageChange={setImportTablePage}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={importTablePage >= totalImportTablePages}
                    onClick={() => setImportTablePage((p) => Math.min(totalImportTablePages, p + 1))}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <PolizasExportFiltersPanel
        loadingFiltered={loadingFiltered}
        hasAppliedFilters={hasAppliedFilters}
        appliedFilterCount={appliedFilterCount}
        filteredTotal={filteredTotal}
        onApply={handleApplyFilters}
        onClearResults={handleClearFilterResults}
      />
    </div>
  );
}
