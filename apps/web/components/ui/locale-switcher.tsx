'use client';

import { useLocaleStore } from '@/stores/locale-store';

const FLAGS: Record<string, string> = {
  fr: 'FR',
  en: 'EN',
};

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocaleStore();

  const toggle = () => {
    setLocale(locale === 'fr' ? 'en' : 'fr');
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-ink-3 hover:text-ink hover:bg-violet-p/30 transition-all duration-200"
      aria-label={`Switch to ${locale === 'fr' ? 'English' : 'French'}`}
    >
      <span className="text-[12px]">{locale === 'fr' ? '\u{1F1EB}\u{1F1F7}' : '\u{1F1EC}\u{1F1E7}'}</span>
      <span>{FLAGS[locale]}</span>
    </button>
  );
}
