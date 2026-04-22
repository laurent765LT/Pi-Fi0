'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { WifiOff, RefreshCcw, ArrowRight, Home } from 'lucide-react';
import { cn } from '@/lib/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CachedPage {
  path: string;
  label: string;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_AVAILABLE_PAGES: CachedPage[] = [
  { path: '/', label: 'Page d\'accueil' },
  { path: '/login', label: 'Connexion' },
  { path: '/dashboard', label: 'Tableau de bord' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OfflinePage() {
  const [cachedPages, setCachedPages] = useState<CachedPage[]>(DEFAULT_AVAILABLE_PAGES);
  const [retrying, setRetrying] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    document.title = "Hors ligne | Strick'in";
  }, []);

  // Inventory Cache Storage to show the user actual offline-available pages.
  useEffect(() => {
    if (typeof window === 'undefined' || !('caches' in window)) return;

    let cancelled = false;

    (async () => {
      try {
        const cacheNames = await caches.keys();
        const urls = new Set<string>();
        for (const name of cacheNames) {
          if (!name.startsWith('strickin-')) continue;
          const cache = await caches.open(name);
          const requests = await cache.keys();
          for (const req of requests) {
            try {
              const url = new URL(req.url);
              if (url.origin === window.location.origin) {
                urls.add(url.pathname);
              }
            } catch {
              /* ignore malformed urls */
            }
          }
        }

        const pages: CachedPage[] = [];
        const add = (path: string, label: string) => {
          if (!pages.find((p) => p.path === path)) pages.push({ path, label });
        };

        const labelMap: Record<string, string> = {
          '/': 'Page d\'accueil',
          '/login': 'Connexion',
          '/dashboard': 'Tableau de bord',
          '/products': 'Catalogue produits',
          '/portfolio': 'Portefeuille',
          '/settings': 'Paramètres',
          '/notifications': 'Notifications',
          '/tokenisation': 'Tokenisation',
          '/evenements': 'Événements',
        };

        for (const path of Array.from(urls).sort()) {
          if (
            path.startsWith('/_next/') ||
            path.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff2?|ttf|ico|json)$/)
          ) {
            continue;
          }
          const label =
            labelMap[path] ||
            path
              .split('/')
              .filter(Boolean)
              .map((s) => s.replace(/-/g, ' '))
              .join(' › ') ||
            'Page d\'accueil';
          add(path, label.charAt(0).toUpperCase() + label.slice(1));
        }

        if (!cancelled && pages.length > 0) {
          setCachedPages(pages);
        }
      } catch {
        /* ignore — keep defaults */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    setIsOnline(navigator.onLine);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const handleRetry = useCallback(() => {
    setRetrying(true);
    if (typeof window !== 'undefined') {
      window.setTimeout(() => window.location.reload(), 400);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-b from-surface to-white dark:from-ink dark:to-ink">
      <div className="max-w-md w-full text-center">
        <div
          className={cn(
            'inline-flex items-center justify-center w-20 h-20 rounded-full mb-6',
            'bg-gradient-to-br from-[#3B1FA8]/10 to-[#7B5FE0]/10',
            'border border-[#3B1FA8]/20',
          )}
        >
          <WifiOff size={36} className="text-[#3B1FA8]" />
        </div>

        <h1 className="font-display font-extrabold text-3xl md:text-4xl text-ink mb-3">
          Vous êtes hors ligne
        </h1>
        <p className="text-[14px] text-ink-3 font-body leading-relaxed mb-8">
          Impossible de joindre les serveurs Strick&apos;in. Vérifiez votre connexion
          Internet ou consultez les pages disponibles hors ligne ci-dessous.
        </p>

        {/* Network status pill */}
        <div
          className={cn(
            'inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 text-[11px] font-bold uppercase tracking-wider',
            isOnline
              ? 'bg-[#00B894]/10 text-[#00B894] border border-[#00B894]/20'
              : 'bg-[#E8334A]/10 text-[#E8334A] border border-[#E8334A]/20',
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              isOnline ? 'bg-[#00B894] animate-pulse' : 'bg-[#E8334A]',
            )}
          />
          {isOnline ? 'Connexion détectée' : 'Aucune connexion'}
        </div>

        {/* Retry button */}
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className={cn(
            'inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl',
            'bg-gradient-to-r from-[#3B1FA8] to-[#5535C4] text-white',
            'font-display font-bold text-[13px]',
            'shadow-lg shadow-violet/20 hover:shadow-xl hover:shadow-violet/30',
            'hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1FA8]/40 focus-visible:ring-offset-2',
            retrying && 'opacity-70 cursor-wait',
          )}
        >
          <RefreshCcw size={14} className={retrying ? 'animate-spin' : ''} />
          {retrying ? 'Reconnexion...' : 'Réessayer'}
        </button>

        {/* Cached pages list */}
        {cachedPages.length > 0 && (
          <div className="mt-12 text-left">
            <h2 className="font-display font-bold text-[13px] text-ink mb-4 flex items-center gap-2">
              <Home size={13} className="text-[#3B1FA8]" />
              Pages disponibles hors ligne
            </h2>
            <ul className="space-y-2">
              {cachedPages.map((page) => (
                <li key={page.path}>
                  <Link
                    href={page.path}
                    className={cn(
                      'flex items-center justify-between gap-3 px-4 py-3 rounded-xl',
                      'bg-white/80 dark:bg-white/5 border border-border/40',
                      'hover:border-[#3B1FA8]/30 hover:shadow-sm transition-all duration-200',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1FA8]/30',
                    )}
                  >
                    <div className="min-w-0">
                      <p className="font-body text-[13px] font-semibold text-ink truncate">
                        {page.label}
                      </p>
                      <p className="text-[10px] text-ink-3 font-mono truncate">
                        {page.path}
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-ink-3/60 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
