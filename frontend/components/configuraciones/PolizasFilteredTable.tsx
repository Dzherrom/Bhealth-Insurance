'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PagedNumberPagination } from '@/components/ui/paged-number-pagination';
import {
  StatusBadge,
  getEstadoDocumentoLabel,
  getEstadoPagoLabel,
} from '@/components/polizas/polizaStatusUtils';
import type { PolizaListResponse } from '@/types';

interface PolizasFilteredTableProps {
  polizas: PolizaListResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  hasSearched: boolean;
  onPageChange: (page: number) => void;
}

export function PolizasFilteredTable({
  polizas,
  totalCount,
  page,
  pageSize,
  isLoading,
  hasSearched,
  onPageChange,
}: PolizasFilteredTableProps) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const handleViewPoliza = (id: number) => {
    router.push(`/crm/polizas/${id}`);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-[#1e293b] rounded-[16px] border border-[#f1f5f9] dark:border-[#334155] shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[900px]">
            <thead>
              <tr>
                <th className="bg-[#f8fafc] dark:bg-[#0f172a] p-[16px_24px] text-[12px] font-bold text-[#64748b] dark:text-gray-400 uppercase tracking-[0.5px] border-b border-[#f1f5f9] dark:border-[#334155]">
                  Cliente
                </th>
                <th className="bg-[#f8fafc] dark:bg-[#0f172a] p-[16px_24px] text-[12px] font-bold text-[#64748b] dark:text-gray-400 uppercase tracking-[0.5px] border-b border-[#f1f5f9] dark:border-[#334155]">
                  Agente / Asistente
                </th>
                <th className="bg-[#f8fafc] dark:bg-[#0f172a] p-[16px_24px] text-[12px] font-bold text-[#64748b] dark:text-gray-400 uppercase tracking-[0.5px] border-b border-[#f1f5f9] dark:border-[#334155]">
                  Estatus
                </th>
                <th className="bg-[#f8fafc] dark:bg-[#0f172a] p-[16px_24px] text-[12px] font-bold text-[#64748b] dark:text-gray-400 uppercase tracking-[0.5px] border-b border-[#f1f5f9] dark:border-[#334155] text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {!hasSearched ? (
                <tr>
                  <td colSpan={4} className="text-center p-10 text-[#94a3b8] dark:text-gray-500 font-medium">
                    Configura los filtros y pulsa &quot;Aplicar filtros&quot; para ver las pólizas.
                  </td>
                </tr>
              ) : isLoading && polizas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-10 text-[#94a3b8] dark:text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                    Cargando pólizas...
                  </td>
                </tr>
              ) : polizas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-10 text-[#94a3b8] dark:text-gray-500 font-medium">
                    No se encontraron pólizas con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                polizas.map((poliza) => {
                  const statusName = poliza.estado_nombre || 'Desconocido';
                  const documentoName =
                    poliza.estado_documento_display ||
                    getEstadoDocumentoLabel(poliza.estado_documento);
                  const pagoName =
                    poliza.estado_pago_display || getEstadoPagoLabel(poliza.estado_pago);

                  return (
                    <tr
                      key={poliza.id}
                      onClick={() => poliza.id && handleViewPoliza(poliza.id)}
                      className="hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] transition-colors cursor-pointer"
                    >
                      <td className="p-[18px_24px] border-b border-[#f1f5f9] dark:border-[#334155] align-top">
                        <div className="flex gap-[12px] items-start">
                          <div className="w-[32px] h-[32px] bg-[#eff6ff] text-[#4f46e5] font-extrabold text-[13px] flex items-center justify-center rounded-[8px] shrink-0">
                            {poliza.cliente_principal
                              ? poliza.cliente_principal.charAt(0).toUpperCase()
                              : 'C'}
                          </div>
                          <div>
                            <h4 className="text-[14px] font-bold text-[#1e293b] dark:text-gray-100 uppercase leading-[1.4] m-0">
                              {poliza.cliente_principal || 'Sin Nombre'}
                            </h4>
                            <div className="text-[12px] font-semibold text-[#64748b] dark:text-gray-400 uppercase leading-[1.4] mt-[4px]">
                              {poliza.plan_nombre || 'N/A Carrier'}
                            </div>
                            <div className="text-[12px] font-medium text-[#94a3b8] dark:text-gray-500 leading-[1.4] mt-[2px]">
                              FFM: {poliza.id_mercado || '---'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-[18px_24px] border-b border-[#f1f5f9] dark:border-[#334155] align-top">
                        <div>
                          <h5 className="text-[13px] font-bold text-[#334155] dark:text-gray-200 uppercase leading-[1.4] m-0">
                            {poliza.agente_nombre || 'No Asignado'}
                          </h5>
                          <p className="text-[12px] font-medium text-[#94a3b8] dark:text-gray-500 leading-[1.4] mt-[4px] m-0">
                            NPN:{' '}
                            <span className="text-[#64748b] dark:text-gray-400 font-semibold">
                              {poliza.agente_npn || '---'}
                            </span>
                          </p>
                          <p className="text-[12px] font-medium text-[#94a3b8] dark:text-gray-500 leading-[1.4] mt-[4px] m-0">
                            Asistente:{' '}
                            <span className="text-[#64748b] dark:text-gray-400 font-semibold">
                              {poliza.asistente_nombre
                                ? `${poliza.asistente_nombre}${poliza.asistente_npn ? ` (NPN: ${poliza.asistente_npn})` : ''}`
                                : 'Sin Registrar'}
                            </span>
                          </p>
                        </div>
                      </td>
                      <td className="p-[18px_24px] border-b border-[#f1f5f9] dark:border-[#334155] align-top">
                        <div className="flex flex-col items-start gap-[6px]">
                          <StatusBadge label={statusName} />
                          <StatusBadge label={documentoName} />
                          <StatusBadge label={pagoName} />
                        </div>
                      </td>
                      <td
                        className="p-[18px_24px] border-b border-[#f1f5f9] dark:border-[#334155] align-top text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[#4f46e5] font-bold"
                          onClick={() => poliza.id && handleViewPoliza(poliza.id)}
                        >
                          Preview
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {hasSearched && totalCount > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-[13px] font-medium text-[#64748b] dark:text-gray-400 bg-white dark:bg-[#1e293b] p-[16px] rounded-[16px] border border-[#f1f5f9] dark:border-[#334155]">
          <span>
            Página {page} de {totalPages} · {totalCount} póliza(s) encontrada(s)
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => onPageChange(page - 1)}
            >
              Anterior
            </Button>
            <PagedNumberPagination
              page={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
              disabled={isLoading}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => onPageChange(page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
