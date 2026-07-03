'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { polizasApi, type PolizaPresenceState } from '@/lib/api';

const PRESENCE_INTERVAL_MS = 30_000;
const POLL_INTERVAL_MS = 15_000;

export interface UsePolizaPresenceOptions {
  /** Intenta adquirir bloqueo de edición al abrir la póliza */
  acquireEdit?: boolean;
  enabled?: boolean;
}

export interface UsePolizaPresenceResult {
  presence: PolizaPresenceState | null;
  isLoading: boolean;
  canEdit: boolean;
  isReadOnly: boolean;
  isArchived: boolean;
  refresh: () => Promise<void>;
}

export function usePolizaPresence(
  polizaId: number | null | undefined,
  options: UsePolizaPresenceOptions = {},
): UsePolizaPresenceResult {
  const { acquireEdit = true, enabled = true } = options;
  const [presence, setPresence] = useState<PolizaPresenceState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isArchived, setIsArchived] = useState(false);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!polizaId || !enabled) return;
    try {
      const data = await polizasApi.getPresence(polizaId);
      if (mountedRef.current) {
        setPresence(data);
      }
    } catch {
      // silencioso en polling
    }
  }, [polizaId, enabled]);

  const ping = useCallback(
    async (mode: 'view' | 'edit') => {
      if (!polizaId || !enabled) return;
      try {
        const data = await polizasApi.presencePing(polizaId, mode);
        if (mountedRef.current) {
          setPresence(data);
        }
      } catch (err: unknown) {
        const conflict = err as { status?: number; payload?: PolizaPresenceState };
        if (conflict?.status === 409 && conflict.payload && mountedRef.current) {
          setPresence(conflict.payload);
        }
      }
    },
    [polizaId, enabled],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!polizaId || !enabled) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    let archived = false;

    const init = async () => {
      setIsLoading(true);
      try {
        const poliza = await polizasApi.get(polizaId);
        if (cancelled) return;
        archived = Boolean(poliza.archivada);
        setIsArchived(archived);
        if (archived) {
          const data = await polizasApi.getPresence(polizaId);
          if (!cancelled) setPresence(data);
        } else if (acquireEdit) {
          await ping('edit');
        } else {
          await ping('view');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    init();

    const pingTimer = window.setInterval(() => {
      if (archived) {
        void refresh();
      } else {
        void ping(acquireEdit ? 'edit' : 'view');
      }
    }, PRESENCE_INTERVAL_MS);

    const pollTimer = window.setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(pingTimer);
      window.clearInterval(pollTimer);
      void polizasApi.presenceLeave(polizaId).catch(() => undefined);
    };
  }, [polizaId, enabled, acquireEdit, ping, refresh]);

  const canEdit = Boolean(presence?.can_edit) && !isArchived;
  const isReadOnly = !canEdit;

  return {
    presence,
    isLoading,
    canEdit,
    isReadOnly,
    isArchived,
    refresh,
  };
}
