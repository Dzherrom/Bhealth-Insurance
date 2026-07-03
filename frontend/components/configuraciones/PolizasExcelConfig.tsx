'use client';

import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { polizasFlatApi, type FlatPolicyImportSummary } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export function PolizasExcelConfig() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [lastSummary, setLastSummary] = useState<FlatPolicyImportSummary | null>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await polizasFlatApi.exportExcel();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `polizas-${stamp}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'Exportación completada', description: 'El archivo Excel se descargó correctamente.' });
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setLastSummary(null);
    try {
      const result = await polizasFlatApi.importFile(file);
      setLastSummary(result.summary);
      toast({
        title: 'Importación completada',
        description: `${result.summary.created_policies} pólizas creadas, ${result.summary.updated_policies} actualizadas.`,
      });
    } catch (err) {
      toast({
        title: 'Error al importar',
        description: err instanceof Error ? err.message : 'No se pudo procesar el archivo.',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Importar / Exportar pólizas (Excel)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Usa el formato compatible con <strong>ejemplo polizas.xlsx</strong>: 51 columnas base
            (agente, titular, direcciones, plan, costos) y bloques de 16 columnas por cada dependiente.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Exportar pólizas a Excel
            </Button>

            <Button variant="outline" onClick={handleImportClick} disabled={importing}>
              {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
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
              {lastSummary.errors.length > 0 ? (
                <div className="mt-2 text-amber-700 dark:text-amber-400">
                  <div className="flex items-center gap-1 font-medium">
                    <AlertCircle className="w-4 h-4" />
                    {lastSummary.errors.length} advertencia(s)
                  </div>
                  <ul className="mt-1 max-h-32 overflow-y-auto list-disc pl-5">
                    {lastSummary.errors.slice(0, 10).map((err) => (
                      <li key={err}>{err}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
