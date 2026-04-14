'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, selectIsAuthenticated } from '@/stores/auth-store';
import { Sidebar } from './sidebar';
import { CompareBar, WelcomeSlides, AiChatWidget } from '@/lib/lazy';
import { ErrorBoundary } from '@/components/error-boundary';
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';
import { Menu } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  useRealtimeNotifications();
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

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
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Mobile top bar with hamburger menu */}
      <div className="sticky top-0 z-30 flex items-center gap-3 px-4 h-[56px] border-b border-border/40 bg-white/80 dark:bg-ink/80 backdrop-blur-sm md:hidden">
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
      </div>

      {/* Main content — offset by sidebar width on desktop, full width on mobile */}
      <main className="min-h-screen md:pl-[248px]">
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
    </div>
  );
}
