'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Direct store access is OK here because we're in an effect (no render access).
// The feature flag is ignored — demo page is always local fallback.
import { useAuthStore } from '@/stores/auth-store';

export default function DemoPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-login with CGP demo account
    useAuthStore
      .getState()
      .login('cgp@demo.com', 'Strickin2025!')
      .then(() => {
        router.replace('/dashboard?demo=true');
      })
      .catch(() => {
        router.replace('/login');
      });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-violet">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center animate-pulse">
          <span className="font-display font-bold text-2xl text-white">S</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-white mb-2">
          Chargement de la d&eacute;mo...
        </h1>
        <p className="text-white/70 text-sm font-body">
          Pr&eacute;paration de votre environnement de test
        </p>
      </div>
    </div>
  );
}
