'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { polizasApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { PolizaListResponse } from '@/types';

function escapeCsvValue(value: unknown) {
  const stringValue = String(value ?? '');
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function buildCsv(polizas: PolizaListResponse[]) {
  const headers = [
    'ID',
    'ID Mercado',
    'ID Miembro',
    'Cliente Principal',
    'Agente',
    'Plan',
    'Estado',
    'Prima Mensual',
    'Costo Poliza',
    'Fecha Efectiva',
    'Fecha Creacion',
  ];

  const rows = polizas.map((poliza) => [
    poliza.id,
    poliza.id_mercado,
    poliza.id_miembro,
    poliza.cliente_principal || '',
    poliza.agente_nombre || '',
    poliza.plan_nombre || '',
    poliza.estado_nombre || '',
    poliza.prima_mensual || '',
    poliza.costo_poliza || '',
    poliza.fecha_efectiva || '',
    poliza.fecha_creacion || '',
  ]);

  return [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\n');
}

export default function PolizasExportPage() {
  const { toast } = useToast();
  const [polizas, setPolizas] = useState<PolizaListResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const csvContent = useMemo(() => buildCsv(polizas), [polizas]);

  const loadPolizas = async () => {
    setIsLoading(true);
    try {
      const data = await polizasApi.list();
      setPolizas(Array.isArray(data) ? data : []);
    } catch (error) {
      const description = error instanceof Error ? error.message : 'No se pudieron cargar las pólizas';
      toast({ title: 'Error', description, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPolizas();
  }, []);

  const handleDownload = () => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `polizas-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: 'CSV generado', description: 'La exportación de pólizas comenzó.' });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-[20px] border border-[#e2e8f0] bg-white p-6 shadow-[0_12px_30px_-12px_rgba(15,23,42,0.18)] md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Link href="/crm/polizas" className="inline-flex items-center gap-2 text-sm font-semibold text-[#475569] hover:text-[#0f172a]">
              <ArrowLeft className="h-4 w-4" /> Volver a pólizas
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dcfce7] text-[#166534]">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-[#0f172a]">Exportar pólizas a CSV</h1>
                <p className="text-sm text-[#64748b]">Genera un archivo con las pólizas visibles en el CRM.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadPolizas}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-[10px] border border-[#cbd5e1] bg-white px-4 py-2 text-sm font-semibold text-[#334155] transition-colors hover:bg-[#f8fafc] disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" /> Recargar
            </button>
            <button
              onClick={handleDownload}
              disabled={isLoading || polizas.length === 0}
              className="inline-flex items-center gap-2 rounded-[10px] bg-[#16a34a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#15803d] disabled:opacity-60"
            >
              <Download className="h-4 w-4" /> Descargar CSV
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[18px] border border-[#e2e8f0] bg-white p-5">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#64748b]">Registros</div>
            <div className="mt-3 text-3xl font-extrabold text-[#0f172a]">{isLoading ? '--' : polizas.length}</div>
          </div>
          <div className="rounded-[18px] border border-[#e2e8f0] bg-white p-5">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#64748b]">Formato</div>
            <div className="mt-3 text-3xl font-extrabold text-[#0f172a]">CSV</div>
          </div>
          <div className="rounded-[18px] border border-[#e2e8f0] bg-white p-5">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#64748b]">Estado</div>
            <div className="mt-3 text-lg font-bold text-[#0f172a]">{isLoading ? 'Cargando datos...' : 'Listo para exportar'}</div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[20px] border border-[#e2e8f0] bg-white">
          <div className="border-b border-[#e2e8f0] px-6 py-4">
            <h2 className="text-lg font-bold text-[#0f172a]">Vista previa del archivo</h2>
            <p className="text-sm text-[#64748b]">Primeras filas que se incluirán en la exportación.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8fafc] text-[#475569]">
                <tr>
                  <th className="px-6 py-3 font-semibold">ID Mercado</th>
                  <th className="px-6 py-3 font-semibold">Cliente</th>
                  <th className="px-6 py-3 font-semibold">Agente</th>
                  <th className="px-6 py-3 font-semibold">Plan</th>
                  <th className="px-6 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-[#64748b]">Cargando pólizas...</td>
                  </tr>
                ) : polizas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-[#64748b]">No hay pólizas para exportar.</td>
                  </tr>
                ) : (
                  polizas.slice(0, 8).map((poliza) => (
                    <tr key={poliza.id} className="border-t border-[#f1f5f9]">
                      <td className="px-6 py-4 font-semibold text-[#0f172a]">{poliza.id_mercado}</td>
                      <td className="px-6 py-4 text-[#334155]">{poliza.cliente_principal || 'Sin nombre'}</td>
                      <td className="px-6 py-4 text-[#334155]">{poliza.agente_nombre || 'No asignado'}</td>
                      <td className="px-6 py-4 text-[#334155]">{poliza.plan_nombre || 'Sin plan'}</td>
                      <td className="px-6 py-4 text-[#334155]">{poliza.estado_nombre || 'Sin estado'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}