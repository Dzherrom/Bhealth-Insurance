'use client';

// Mock simple de use-toast para arreglar la compilación.
// En el futuro puedes integrarlo con sonner u otra libería.
export function useToast() {
  return {
    toast: (props: any) => {
      console.log('Toast:', props);
    },
  };
}

export const toast = (props: any) => {
  console.log('Toast triggered:', props);
};