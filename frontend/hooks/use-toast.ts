'use client';

import { useCallback } from 'react';

type ToastProps = Record<string, unknown>;

// Mock simple de use-toast para arreglar la compilación.
// En el futuro puedes integrarlo con sonner u otra libería.
export function useToast() {
  const stableToast = useCallback((props: ToastProps) => {
    console.log('Toast:', props);
  }, []);

  return {
    toast: stableToast,
  };
}

export const toast = (props: ToastProps) => {
  console.log('Toast triggered:', props);
};
