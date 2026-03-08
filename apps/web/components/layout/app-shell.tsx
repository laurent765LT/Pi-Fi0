'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, selectIsAuthenticated } from '@/stores/auth-store';
import { Sidebar } from './sidebar';
import { ChatWidget } from '@/components/chat/chat-widget';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  // While redirecting, render nothing to avoid layout flash
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />

      {/* Main content — offset by sidebar width */}
      <main className="min-h-screen" style={{ paddingLeft: 248 }}>
        <div className="max-w-[1200px] mx-auto px-8 py-7">{children}</div>
      </main>

      {/* Global chat widget — always available on authenticated pages */}
      <ChatWidget />
    </div>
  );
}
