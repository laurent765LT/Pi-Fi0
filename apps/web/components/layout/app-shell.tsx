'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, selectIsAuthenticated } from '@/stores/auth-store';
import { Sidebar } from './sidebar';
import { CompareBar, WelcomeSlides, AiChatWidget, CommandPalette } from '@/lib/lazy';
import { ScrollProgress } from '@/components/ui/scroll-progress';
import { ErrorBoundary } from '@/components/error-boundary';
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';
import { useNotificationsStore } from '@/stores/notifications-store';
import { JurisdictionBadge } from '@/components/ui/JurisdictionBadge';
import { BottomTabNav } from '@/components/mobile/BottomTabNav';
import { Menu, Search, Bell, X, Sparkles } from 'lucide-react';
import Link from 'next/link';

// Known demo account emails — used to detect demo mode on reload
const DEMO_EMAILS = new Set(['cgp@demo.com', 'admin@strickin.com', 'assureur@cardiff.fr']);
const DEMO_BANNER_DISMISSED_KEY = 'strickin-demo-banner-dismissed';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell = React.memo(function AppShell({ children }: AppShellProps) {
  useRealtimeNotifications();
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore((s) => s.user);
  const unreadCount = useNotificationsStore((s) => s.notifications.filter((n) => !n.read).length);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [demoBannerVisible, setDemoBannerVisible] = useState(false);

  // Detect demo mode (URL query param on first mount OR current user is a demo account)
  // and respect the localStorage dismissal flag.
  useEffect(() => {
    if (!hydrated) return;
    const isDemoQuery =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('demo') === 'true';
    const isDemoUser = !!(user?.email && DEMO_EMAILS.has(String(user.email).toLowerCase()));
    if (!isDemoQuery && !isDemoUser) {
      setDemoBannerVisible(false);
      return;
    }
    try {
      if (localStorage.getItem(DEMO_BANNER_DISMISSED_KEY) === 'true') {
        setDemoBannerVisible(false);
        return;
      }
    } catch {
      // ignore storage errors
    }
    setDemoBannerVisible(true);
  }, [hydrated, user, pathname]);

  const dismissDemoBanner = useCallback(() => {
    try {
      localStorage.setItem(DEMO_BANNER_DISMISSED_KEY, 'true');
    } catch {
      // ignore storage errors
    }
    setDemoBannerVisible(false);
  }, []);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const closeCmdPalette = useCallback(() => setCmdPaletteOpen(false), []);

  // Global Cmd+K / Ctrl+K shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Wait one tick for zustand to rehydrate from localStorage
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    // If zustand says not authenticated, double-check the cookie before redirecting
    if (!isAuthenticated) {
      const hasCookie = document.cookie.includes('strickin-auth') && document.cookie.includes('token');
      if (!hasCookie) {
        router.replace('/login');
      }
    }
  }, [hydrated, isAuthenticated, router]);

  // While hydrating, render nothing to avoid layout flash
  if (!hydrated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-ink">
      {/* Skip to content — accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-gradient-to-r focus:from-[#3B1FA8] focus:to-[#5535C4] focus:text-white focus:font-body focus:text-sm focus:font-semibold focus:shadow-lg focus:outline-none"
      >
        Aller au contenu principal
      </a>

      {/* Scroll progress bar at the very top */}
      <ScrollProgress />

      {/* Demo mode banner — only shown when exploring via /demo auto-login */}
      {demoBannerVisible && (
        <div
          role="region"
          aria-label="Mode démo"
          className="sticky top-0 z-40 md:pl-[248px] bg-gradient-to-r from-[#3B1FA8] via-[#5535C4] to-[#7B5FE0] text-white shadow-md"
        >
          <div className="flex items-center gap-3 px-4 md:px-6 py-2.5 text-sm">
            <Sparkles size={16} className="shrink-0 text-white/90" />
            <p className="flex-1 font-body leading-snug">
              <span className="font-semibold">Mode d&eacute;mo</span>
              <span className="text-white/80"> &mdash; Vous explorez Strick&apos;in avec des donn&eacute;es fictives</span>
            </p>
            <Link
              href="/register"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white text-[#3B1FA8] font-display font-semibold text-xs hover:bg-white/95 transition-colors"
            >
              Cr&eacute;er un vrai compte
            </Link>
            <Link
              href="/register"
              className="sm:hidden inline-flex items-center px-2.5 py-1 rounded-md bg-white text-[#3B1FA8] font-display font-semibold text-[11px] hover:bg-white/95 transition-colors"
            >
              S&apos;inscrire
            </Link>
            <button
              onClick={dismissDemoBanner}
              className="p-1 -mr-1 rounded-md hover:bg-white/10 transition-colors shrink-0"
              aria-label="Fermer la banni\u00e8re de mode d\u00e9mo"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Mobile top bar with hamburger menu */}
      <header role="banner" className="sticky top-0 z-30 flex items-center gap-3 px-4 h-[56px] border-b border-border/40 bg-white/80 dark:bg-ink/80 backdrop-blur-sm md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-1 rounded-lg hover:bg-violet-p/50 transition-colors"
          aria-label="Ouvrir le menu"
        >
          <Menu size={20} className="text-ink dark:text-white" />
        </button>
        <span className="font-display font-extrabold text-[15px] leading-none tracking-tight select-none">
          <span className="text-ink">Strick</span>
          <span className="text-violet-mid">&lsquo;in</span>
        </span>
        {/* Jurisdiction badge */}
        <JurisdictionBadge className="hidden sm:inline-flex" />
        {/* Mobile notification bell */}
        <Link
          href="/notifications"
          className="relative ml-auto p-2 rounded-lg hover:bg-violet-p/50 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} className="text-ink-3" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#E8334A] text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        {/* Mobile search shortcut */}
        <button
          onClick={() => setCmdPaletteOpen(true)}
          className="p-2 rounded-lg hover:bg-violet-p/50 transition-colors"
          aria-label="Rechercher"
        >
          <Search size={18} className="text-ink-3" />
        </button>
      </header>

      {/* Main content — offset by sidebar width on desktop, full width on mobile */}
      {/* Bottom padding on mobile reserves space for the BottomTabNav (56px + safe-area) */}
      <main id="main-content" className="min-h-screen md:pl-[248px] pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0" role="main">
        <div className="px-4 py-5 md:px-6 lg:px-8 xl:px-10 md:py-6">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </main>

      {/* Product comparison floating bar */}
      <CompareBar />

      {/* Global AI assistant chat widget — always available */}
      <AiChatWidget />

      {/* Welcome onboarding slides — shown once on first login */}
      <WelcomeSlides />

      {/* Command palette (Cmd+K) — global search overlay */}
      <CommandPalette isOpen={cmdPaletteOpen} onClose={closeCmdPalette} />

      {/* Mobile bottom tab nav — replaces sidebar-style nav on small screens */}
      <BottomTabNav />
    </div>
  );
});

AppShell.displayName = 'AppShell';
