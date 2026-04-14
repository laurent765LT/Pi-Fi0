'use client';

import Link from 'next/link';
import { Zap, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <>
      <style jsx global>{`
        @keyframes float-orb-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(80px, -60px) scale(1.1); }
          50% { transform: translate(-40px, -120px) scale(0.95); }
          75% { transform: translate(-80px, 40px) scale(1.05); }
        }
        @keyframes float-orb-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-100px, 50px) scale(1.08); }
          50% { transform: translate(60px, 100px) scale(0.92); }
          75% { transform: translate(90px, -70px) scale(1.04); }
        }
        @keyframes float-orb-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(70px, 80px) scale(1.06); }
          66% { transform: translate(-90px, -50px) scale(0.97); }
        }
        @keyframes not-found-entrance {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      <div
        className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, #270F7A 0%, #3B1FA8 40%, #5535C4 70%, #1A3FCC 100%)',
        }}
      >
        {/* Floating gradient orbs */}
        <div
          className="absolute w-[420px] h-[420px] rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{
            top: '10%',
            left: '15%',
            background: 'radial-gradient(circle, #5535C4 0%, transparent 70%)',
            animation: 'float-orb-1 18s ease-in-out infinite',
          }}
          aria-hidden="true"
        />
        <div
          className="absolute w-[350px] h-[350px] rounded-full opacity-25 blur-3xl pointer-events-none"
          style={{
            top: '55%',
            right: '10%',
            background: 'radial-gradient(circle, #00B894 0%, transparent 70%)',
            animation: 'float-orb-2 22s ease-in-out infinite',
          }}
          aria-hidden="true"
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{
            bottom: '5%',
            left: '5%',
            background: 'radial-gradient(circle, #3B1FA8 0%, transparent 70%)',
            animation: 'float-orb-3 20s ease-in-out infinite',
          }}
          aria-hidden="true"
        />

        {/* Subtle radial texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%)',
          }}
          aria-hidden="true"
        />

        <div
          className="relative text-center max-w-md"
          style={{
            animation: 'not-found-entrance 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-xl"
              style={{ background: 'rgba(255, 255, 255, 0.15)' }}
            >
              <Zap size={32} className="text-white" strokeWidth={2.5} />
            </div>
          </div>

          {/* 404 */}
          <h1 className="font-display font-extrabold text-[120px] leading-none mb-2 select-none text-gradient-violet"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #c4b5fd 50%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            404
          </h1>

          <h2 className="font-display text-xl font-bold text-white/90 mb-3">
            Page introuvable
          </h2>

          <p className="font-body text-sm text-white/50 mb-8 max-w-xs mx-auto leading-relaxed">
            La page que vous recherchez n&apos;existe pas ou a&nbsp;été déplacée.
          </p>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-body text-sm font-semibold text-white/80 border border-white/20 hover:bg-white/10 hover:border-white/30 transition-all duration-200"
            >
              <ArrowLeft size={16} />
              Retour
            </button>

            <Button variant="primary" size="md" asChild>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-body text-sm font-semibold text-violet bg-white hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-200"
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
    </>
  );
}
