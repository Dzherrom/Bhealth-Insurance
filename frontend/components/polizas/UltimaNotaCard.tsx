'use client';

import { Info } from 'lucide-react';
import { NotaAdjuntosPreview } from '@/components/polizas/NotaAdjuntosPreview';
import {
  formatNotaFecha,
  getLatestNota,
  getNotaArchivos,
  mapNotaUsuario,
  notaHasContent,
  type NotaApi,
} from '@/components/polizas/notaUtils';

interface UltimaNotaCardProps {
  notas?: NotaApi[] | null;
  variant?: 'sidebar' | 'section';
  emptyMessage?: string;
}

export function UltimaNotaCard({
  notas,
  variant = 'sidebar',
  emptyMessage = 'Todavía no se han creado notas para esta póliza.',
}: UltimaNotaCardProps) {
  const ultimaNota = getLatestNota(notas);

  if (!ultimaNota || !notaHasContent(ultimaNota)) {
    return (
      <div
        className={
          variant === 'sidebar'
            ? 'p-3 shadow-sm border-[1px] border-slate-100 rounded-lg dark:bg-slate-800 dark:border-slate-700 !py-2 !px-3 w-full flex gap-3 bg-blue-50 dark:bg-slate-700'
            : 'border border-dashed border-slate-200 dark:border-slate-700 rounded-md py-4 px-3 text-center'
        }
      >
        {variant === 'sidebar' ? (
          <>
            <Info className="w-4 h-4 mt-0.5 text-blue-500 dark:text-blue-400 shrink-0" />
            <p className="text-gray-700 dark:text-gray-300 text-xs font-normal">{emptyMessage}</p>
          </>
        ) : (
          <p className="text-sm dark:text-gray-400">{emptyMessage}</p>
        )}
      </div>
    );
  }

  const autor = mapNotaUsuario(ultimaNota);
  const archivos = getNotaArchivos(ultimaNota);

  if (variant === 'section') {
    return (
      <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-200">{autor.nombre}</span>
          {autor.apellido ? <span>{autor.apellido}</span> : null}
          <span>·</span>
          <span>{formatNotaFecha(ultimaNota.fecha_creacion)}</span>
        </div>
        {ultimaNota.contenido?.trim() ? (
          <p className="text-sm dark:text-gray-300 whitespace-pre-wrap line-clamp-6">{ultimaNota.contenido}</p>
        ) : null}
        <NotaAdjuntosPreview archivos={archivos} size="md" />
      </div>
    );
  }

  return (
    <div className="p-3 shadow-sm border-[1px] border-slate-100 rounded-lg dark:bg-slate-700 dark:border-slate-600 w-full space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{autor.nombre}</p>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 shrink-0">
          {formatNotaFecha(ultimaNota.fecha_creacion)}
        </p>
      </div>
      {ultimaNota.contenido?.trim() ? (
        <p className="text-gray-700 dark:text-gray-300 text-xs font-normal whitespace-pre-wrap line-clamp-4">
          {ultimaNota.contenido}
        </p>
      ) : null}
      <NotaAdjuntosPreview archivos={archivos} size="sm" />
    </div>
  );
}
