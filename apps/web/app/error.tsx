'use client';

import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, #270F7A 0%, #3B1FA8 40%, #5535C4 70%, #1A3FCC 100%)',
      }}
    >
      {/* Subtle radial texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 30% 40%, rgba(232,51,74,0.08) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.04) 0%, transparent 40%)',
        }}
        aria-hidden="true"
      />

      <div className="relative text-center max-w-md animate-page-enter">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-xl"
            style={{ background: 'rgba(232, 51, 74, 0.2)' }}
          >
            <AlertTriangle size={32} className="text-white" strokeWidth={2} />
          </div>
        </div>

        {/* Title */}
        <h1 className="font-display font-extrabold text-2xl text-white mb-2">
          Erreur inattendue
        </h1>

        <p className="font-body text-sm text-white/50 mb-4 max-w-xs mx-auto leading-relaxed">
          Une erreur est survenue lors du chargement de cette page.
        </p>

        {/* Error message */}
        {error.message && (
          <div
            className="mx-auto max-w-sm rounded-xl px-4 py-3 mb-8 font-mono text-xs text-white/70 leading-relaxed break-words"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            {error.message}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={reset}
            className="flex items-center gap-2 rounded-xl font-body text-sm font-semibold text-white/80 border-white/20 bg-transparent hover:bg-white/10 hover:border-white/30 hover:text-white"
          >
            <RefreshCw size={16} />
            Réessayer
          </Button>

          <Button variant="primary" size="md" asChild>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-xl font-body text-sm font-semibold text-violet bg-white hover:bg-white/90 shadow-lg hover:shadow-xl"
            >
              <Home size={16} />
              Retour au dashboard
            </Link>
          </Button>
        </div>

        {/* Footer */}
        <p className="mt-12 text-white/25 text-[11px] font-body">
          Strick&apos;in — Plateforme B2B de distribution
        </p>
      </div>
    </div>
  );
}
