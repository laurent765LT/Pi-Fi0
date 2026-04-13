'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '@/stores/theme-store';

const modes = ['light', 'dark', 'system'] as const;
const icons = { light: Sun, dark: Moon, system: Monitor };
const labels = { light: 'Clair', dark: 'Sombre', system: 'Systeme' };

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  const cycle = () => {
    const idx = modes.indexOf(theme);
    setTheme(modes[(idx + 1) % modes.length]);
  };

  const Icon = icons[theme];

  return (
    <button
      onClick={cycle}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold
        bg-violet-pale/40 text-ink-2 hover:bg-violet-pale/70
        dark:bg-white/5 dark:text-ink-3 dark:hover:bg-white/10
        transition-all duration-200 select-none"
      title={`Theme: ${labels[theme]}`}
    >
      <Icon size={12} strokeWidth={2} className="transition-transform duration-200" />
      <span className="uppercase tracking-wider">{labels[theme]}</span>
    </button>
  );
}
