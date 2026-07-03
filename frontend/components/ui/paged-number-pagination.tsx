'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_WINDOW = 10;

interface PagedNumberPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  windowSize?: number;
  className?: string;
}

export function PagedNumberPagination({
  page,
  totalPages,
  onPageChange,
  disabled = false,
  windowSize = DEFAULT_WINDOW,
  className,
}: PagedNumberPaginationProps) {
  const safeTotal = Math.max(1, totalPages);
  const windowStart = Math.floor((page - 1) / windowSize) * windowSize + 1;
  const windowEnd = Math.min(windowStart + windowSize - 1, safeTotal);

  const pages: number[] = [];
  for (let i = windowStart; i <= windowEnd; i += 1) {
    pages.push(i);
  }

  const canGoPrevWindow = windowStart > 1;
  const canGoNextWindow = windowEnd < safeTotal;

  return (
    <div className={cn('flex flex-wrap items-center gap-[6px]', className)}>
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, windowStart - windowSize))}
        disabled={disabled || !canGoPrevWindow}
        className="inline-flex items-center justify-center rounded-[8px] border border-[#e2e8f0] dark:border-[#334155] px-[8px] py-[6px] text-[#475569] dark:text-gray-300 bg-white dark:bg-[#1e293b] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] disabled:opacity-50 transition-colors"
        aria-label="Páginas anteriores"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          onClick={() => onPageChange(pageNumber)}
          disabled={disabled}
          className={cn(
            'min-w-[36px] rounded-[8px] border px-[10px] py-[6px] text-[13px] font-semibold transition-colors',
            pageNumber === page
              ? 'border-[#4f46e5] bg-[#4f46e5] text-white'
              : 'border-[#e2e8f0] dark:border-[#334155] text-[#475569] dark:text-gray-300 bg-white dark:bg-[#1e293b] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a]',
            disabled && 'opacity-50',
          )}
        >
          {pageNumber}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(safeTotal, windowStart + windowSize))}
        disabled={disabled || !canGoNextWindow}
        className="inline-flex items-center justify-center rounded-[8px] border border-[#e2e8f0] dark:border-[#334155] px-[8px] py-[6px] text-[#475569] dark:text-gray-300 bg-white dark:bg-[#1e293b] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] disabled:opacity-50 transition-colors"
        aria-label="Páginas siguientes"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
