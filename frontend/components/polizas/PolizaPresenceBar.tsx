'use client';

import { Eye, Lock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePolizaEditLock } from '@/components/polizas/PolizaEditLockContext';

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function PolizaPresenceBar() {
  const { presence, isReadOnly, isArchived } = usePolizaEditLock();
  const viewers = presence?.viewers ?? [];
  const lockHolder = presence?.edit_lock;

  if (isArchived) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
        Esta póliza está <strong>archivada</strong>. Solo lectura. Un coordinador puede desarchivarla.
      </div>
    );
  }

  if (!viewers.length && !isReadOnly) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
      {isReadOnly && lockHolder && (
        <div className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>{lockHolder.display_name}</strong> está editando esta póliza. Tienes acceso de solo lectura.
          </span>
        </div>
      )}

      {viewers.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <Users className="h-4 w-4 shrink-0 text-slate-500" />
          <span className="font-medium">En línea:</span>
          {viewers.map((viewer) => (
            <Badge
              key={viewer.user_id}
              variant={viewer.mode === 'EDIT' ? 'default' : 'secondary'}
              className="gap-1 font-normal"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                {initials(viewer.display_name)}
              </span>
              {viewer.display_name}
              {viewer.mode === 'EDIT' ? (
                <span className="text-[10px] uppercase opacity-80">editando</span>
              ) : (
                <Eye className="h-3 w-3 opacity-60" />
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
