'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  section: 'pages' | 'actions';
  onSelect: () => void;
}

interface UseCommandPaletteReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.25" />
      <rect x="9.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.25" />
      <rect x="1.5" y="9.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.25" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

function ProductIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 4L8 1L14 4V12L8 15L2 12V4Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M8 7V15" stroke="currentColor" strokeWidth="1.25" />
      <path d="M2 4L8 7L14 4" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

function PortfolioIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 12L5.5 6L9 9L14 3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PricingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1V15M11.5 4H6.25C4.45 4 3 5.12 3 6.5S4.45 9 6.25 9H9.75C11.55 9 13 10.12 13 11.5S11.55 14 9.75 14H4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ResearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 13L5 3L8 10L11 6L14 13" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M8 1V3M8 13V15M1 8H3M13 8H15M3.05 3.05L4.46 4.46M11.54 11.54L12.95 12.95M12.95 3.05L11.54 4.46M4.46 11.54L3.05 12.95" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 10V13C2 13.55 2.45 14 3 14H13C13.55 14 14 13.55 14 13V10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 2V10M5 5L8 2L11 5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 4H14M2 8H14M2 12H14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="5" cy="4" r="1.25" fill="currentColor" />
      <circle cx="11" cy="8" r="1.25" fill="currentColor" />
      <circle cx="7" cy="12" r="1.25" fill="currentColor" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

function useCommandPalette(): UseCommandPaletteReturn {
  const [isOpen, setIsOpen] = React.useState(false);

  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);
  const toggle = React.useCallback(() => setIsOpen((prev) => !prev), []);

  // Register global Cmd+K / Ctrl+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { isOpen, open, close, toggle };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Mount guard for SSR
  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Build items
  const items: CommandItem[] = React.useMemo(
    () => [
      { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, shortcut: 'G D', section: 'pages', onSelect: () => { router.push('/dashboard'); onClose(); } },
      { id: 'produits', label: 'Produits', icon: <ProductIcon />, shortcut: 'G P', section: 'pages', onSelect: () => { router.push('/products'); onClose(); } },
      { id: 'portfolio', label: 'Portfolio', icon: <PortfolioIcon />, shortcut: 'G O', section: 'pages', onSelect: () => { router.push('/portfolio'); onClose(); } },
      { id: 'pricing', label: 'Pricing', icon: <PricingIcon />, shortcut: 'G R', section: 'pages', onSelect: () => { router.push('/pricing'); onClose(); } },
      { id: 'research', label: 'Research', icon: <ResearchIcon />, shortcut: 'G E', section: 'pages', onSelect: () => { router.push('/research'); onClose(); } },
      { id: 'admin', label: 'Admin', icon: <AdminIcon />, shortcut: 'G A', section: 'pages', onSelect: () => { router.push('/admin'); onClose(); } },
      { id: 'new-pricing', label: 'Nouveau pricing', icon: <PlusIcon />, shortcut: 'N', section: 'actions', onSelect: () => { router.push('/pricing/new'); onClose(); } },
      { id: 'export', label: 'Exporter', icon: <ExportIcon />, shortcut: 'E', section: 'actions', onSelect: () => { router.push('/export'); onClose(); } },
      { id: 'settings', label: 'Parametres', icon: <SettingsIcon />, shortcut: 'S', section: 'actions', onSelect: () => { router.push('/settings'); onClose(); } },
    ],
    [router, onClose],
  );

  // Filter items based on query
  const filteredItems = React.useMemo(() => {
    if (!query.trim()) return items;
    const lowerQuery = query.toLowerCase();
    return items.filter((item) => item.label.toLowerCase().includes(lowerQuery));
  }, [items, query]);

  const pages = filteredItems.filter((i) => i.section === 'pages');
  const actions = filteredItems.filter((i) => i.section === 'actions');

  // Reset active index when filtered list changes
  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Reset query when opening
  React.useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      // Focus input on next tick
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Lock body scroll while open
  React.useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          setActiveIndex((prev) => (prev + 1) % filteredItems.length);
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          setActiveIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
          break;
        }
        case 'Enter': {
          e.preventDefault();
          filteredItems[activeIndex]?.onSelect();
          break;
        }
        case 'Escape': {
          e.preventDefault();
          onClose();
          break;
        }
      }
    },
    [filteredItems, activeIndex, onClose],
  );

  // Scroll active item into view
  React.useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector('[data-active="true"]');
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!mounted || !isOpen) return null;

  let runningIndex = 0;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className={cn(
        'fixed inset-0 z-50 flex items-start justify-center pt-[20vh]',
        'bg-ink/40 backdrop-blur-[3px]',
        'animate-fade-in',
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          'w-full max-w-[520px] bg-white rounded-xl shadow-xl overflow-hidden',
          'border border-border animate-scale-in',
        )}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <span className="text-ink-3 shrink-0">
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une page ou action..."
            className={cn(
              'flex-1 bg-transparent text-sm text-ink font-body',
              'placeholder:text-ink-4 outline-none',
            )}
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-ink-4 bg-surface-2 rounded border border-border">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[320px] overflow-y-auto py-2">
          {filteredItems.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-ink-3 font-body">
              Aucun resultat pour &ldquo;{query}&rdquo;
            </p>
          )}

          {pages.length > 0 && (
            <div>
              <p className="px-4 py-1.5 text-[10px] font-body font-semibold uppercase tracking-wider text-ink-4">
                Pages
              </p>
              {pages.map((item) => {
                const index = runningIndex++;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-active={index === activeIndex}
                    onClick={item.onSelect}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      'flex items-center gap-3 w-full px-4 py-2 text-left text-sm font-body transition-colors duration-75',
                      index === activeIndex
                        ? 'bg-violet-pale text-violet'
                        : 'text-ink hover:bg-surface-2',
                    )}
                  >
                    <span className="shrink-0 text-ink-3">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {item.shortcut && (
                      <kbd className="text-[10px] font-mono text-ink-4 bg-surface-2 px-1.5 py-0.5 rounded border border-border">
                        {item.shortcut}
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {actions.length > 0 && (
            <div className={pages.length > 0 ? 'mt-1' : undefined}>
              <p className="px-4 py-1.5 text-[10px] font-body font-semibold uppercase tracking-wider text-ink-4">
                Actions
              </p>
              {actions.map((item) => {
                const index = runningIndex++;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-active={index === activeIndex}
                    onClick={item.onSelect}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      'flex items-center gap-3 w-full px-4 py-2 text-left text-sm font-body transition-colors duration-75',
                      index === activeIndex
                        ? 'bg-violet-pale text-violet'
                        : 'text-ink hover:bg-surface-2',
                    )}
                  >
                    <span className="shrink-0 text-ink-3">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {item.shortcut && (
                      <kbd className="text-[10px] font-mono text-ink-4 bg-surface-2 px-1.5 py-0.5 rounded border border-border">
                        {item.shortcut}
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border bg-surface">
          <span className="flex items-center gap-1.5 text-[10px] text-ink-4 font-mono">
            <kbd className="px-1 py-0.5 bg-surface-2 rounded border border-border">&uarr;&darr;</kbd>
            naviguer
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-ink-4 font-mono">
            <kbd className="px-1 py-0.5 bg-surface-2 rounded border border-border">&crarr;</kbd>
            ouvrir
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-ink-4 font-mono">
            <kbd className="px-1 py-0.5 bg-surface-2 rounded border border-border">esc</kbd>
            fermer
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export { CommandPalette, useCommandPalette };
export type { CommandPaletteProps, CommandItem, UseCommandPaletteReturn };
