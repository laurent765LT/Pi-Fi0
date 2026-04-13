import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Locale = 'fr' | 'en';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'fr',
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'strickin-locale' },
  ),
);
