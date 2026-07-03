'use client';

import { Archive, ArchiveRestore } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePermission } from '@/hooks/use-permission';
import { polizasApi } from '@/lib/api';
import { usePolizaEditLock } from '@/components/polizas/PolizaEditLockContext';

interface PolizaArchiveActionsProps {
  polizaId: number;
  onChanged: () => void;
}

export function PolizaArchiveActions({ polizaId, onChanged }: PolizaArchiveActionsProps) {
  const { toast } = useToast();
  const { isArchived, isReadOnly } = usePolizaEditLock();
  const { isManagerOrAbove } = usePermission();
  const canManageArchive = isManagerOrAbove;

  if (!canManageArchive) return null;

  const handleArchive = async () => {
    if (!window.confirm('¿Archivar esta póliza? No se eliminará; quedará oculta del listado principal.')) {
      return;
    }
    try {
      await polizasApi.archivar(polizaId);
      toast({ title: 'Póliza archivada' });
      onChanged();
    } catch (err) {
      toast({
        title: 'Error al archivar',
        description: err instanceof Error ? err.message : 'No se pudo archivar',
        variant: 'destructive',
      });
    }
  };

  const handleUnarchive = async () => {
    try {
      await polizasApi.desarchivar(polizaId);
      toast({ title: 'Póliza desarchivada' });
      onChanged();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo desarchivar',
        variant: 'destructive',
      });
    }
  };

  if (isArchived) {
    return (
      <Button variant="outline" size="sm" onClick={handleUnarchive} className="gap-2">
        <ArchiveRestore className="h-4 w-4" />
        Desarchivar
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleArchive}
      disabled={isReadOnly && !canManageArchive}
      className="gap-2 text-red-600 hover:text-red-700"
    >
      <Archive className="h-4 w-4" />
      Archivar
    </Button>
  );
}
