'use client';

import { Paperclip } from 'lucide-react';
import { isImageUrl, type NotaArchivoItem } from '@/components/polizas/notaUtils';

interface NotaAdjuntosPreviewProps {
  archivos: NotaArchivoItem[];
  size?: 'sm' | 'md';
  className?: string;
}

export function NotaAdjuntosPreview({
  archivos,
  size = 'sm',
  className,
}: NotaAdjuntosPreviewProps) {
  if (!archivos.length) return null;

  const thumbSize = size === 'sm' ? 'w-14 h-14' : 'w-20 h-20';

  return (
    <div className={`flex flex-wrap gap-2 ${className ?? ''}`}>
      {archivos.map((item, index) =>
        isImageUrl(item.url) ? (
          <a
            key={`${item.id ?? item.url}-${index}`}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            title={item.nombre}
            className={`${thumbSize} rounded-md overflow-hidden border border-slate-200 dark:border-slate-600 hover:opacity-90 hover:ring-2 hover:ring-primary/40 transition-all shrink-0`}
          >
            <img
              src={item.url}
              alt={item.nombre}
              className="w-full h-full object-cover"
            />
          </a>
        ) : (
          <a
            key={`${item.id ?? item.url}-${index}`}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            title={item.nombre}
            className="inline-flex items-center gap-1.5 max-w-[160px] text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-2 py-1.5 rounded-md border border-blue-100 dark:border-blue-900/40 transition-colors"
          >
            <Paperclip className="h-3 w-3 shrink-0" />
            <span className="truncate">{item.nombre}</span>
          </a>
        )
      )}
    </div>
  );
}
