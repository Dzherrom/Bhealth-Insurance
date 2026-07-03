'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { usePolizaPresence, type UsePolizaPresenceResult } from '@/hooks/usePolizaPresence';
import type { PolizaPresenceState } from '@/lib/api';

interface PolizaEditLockContextValue extends UsePolizaPresenceResult {
  polizaId: number | null;
}

const PolizaEditLockContext = createContext<PolizaEditLockContextValue | null>(null);

export function PolizaEditLockProvider({
  polizaId,
  children,
}: {
  polizaId: number | null;
  children: ReactNode;
}) {
  const presenceState = usePolizaPresence(polizaId, { acquireEdit: true, enabled: Boolean(polizaId) });

  return (
    <PolizaEditLockContext.Provider value={{ ...presenceState, polizaId }}>
      {children}
    </PolizaEditLockContext.Provider>
  );
}

export function usePolizaEditLock(): PolizaEditLockContextValue {
  const ctx = useContext(PolizaEditLockContext);
  if (!ctx) {
    return {
      polizaId: null,
      presence: null,
      isLoading: false,
      canEdit: true,
      isReadOnly: false,
      isArchived: false,
      refresh: async () => undefined,
    };
  }
  return ctx;
}

export type { PolizaPresenceState };
