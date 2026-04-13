'use client';

import Link from 'next/link';
import { Zap, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: 'linear-gradient(135deg, #270F7A 0%, #3B1FA8 40%, #5535C4 70%, #1A3FCC 100%)',
      }}
    >
      {/* Floating orbs */}
      <div
        className="absolute w-[300px] h-[300px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{
          top: '20%',
          left: '10%',
          background: 'radial-gradient(circle, #5535C4 0%, transparent 70%)',
          animation: 'float 15s ease-in-out infinite',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute w-[250px] h-[250px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{
          bottom: '15%',
          right: '15%',
          background: 'radial-gradient(circle, #00B894 0%, transparent 70%)',
          animation: 'float 20s ease-in-out infinite reverse',
        }}
        aria-hidden="true"
      />

      <div className="relative text-center max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)' }}
          >
            <Zap size={32} className="text-white" strokeWidth={2.5} />
          </div>
        </div>

        {/* 404 */}
        <h1
          className="font-display font-extrabold text-[120px] leading-none mb-2 select-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          404
        </h1>

        <h2 className="font-display text-xl font-bold text-white/90 mb-3">
          Page introuvable
        </h2>

        <p className="font-body text-sm text-white/50 mb-8 max-w-xs mx-auto">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
          Vérifiez l&apos;URL ou retournez au tableau de bord.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-body text-sm font-semibold text-white/80 border border-white/20 hover:bg-white/10 transition-all duration-200"
          >
            <ArrowLeft size={16} />
            Retour
          </button>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-body text-sm font-semibold text-violet bg-white hover:bg-white/90 shadow-lg transition-all duration-200"
          >
            <Home size={16} />
            Dashboard
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-12 text-white/25 text-[11px] font-body">
          Strick&apos;in — Plateforme B2B de distribution
        </p>
      </div>
    </div>
  );
}
