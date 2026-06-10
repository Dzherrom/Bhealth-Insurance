import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LanguageState {
  language: 'es' | 'en';
  setLanguage: (lang: 'es' | 'en') => void;
  toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'es',
      setLanguage: (lang) => set({ language: lang }),
      toggleLanguage: () => set((state) => ({ language: state.language === 'es' ? 'en' : 'es' })),
    }),
    {
      name: 'language-storage',
    }
  )
);