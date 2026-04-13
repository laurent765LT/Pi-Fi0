'use client';

import { useRouter } from 'next/navigation';
import { Zap, Lock, ArrowRight } from 'lucide-react';

export default function AssureurLoginPage() {
  const router = useRouter();

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    router.push('/assureur/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F4F4F8' }}>
      <div className="w-full max-w-[420px] mx-4">
        {/* Card */}
        <div className="bg-white rounded-[16px] p-8" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: '#3B28CC' }}>
                <Zap size={18} className="text-white" strokeWidth={2.5} />
              </span>
              <span className="font-extrabold text-[22px] leading-none tracking-tight">
                <span style={{ color: '#111827' }}>Strick</span>
                <span style={{ color: '#3B28CC' }}>&lsquo;in</span>
              </span>
            </div>
            <p className="text-[13px] font-medium tracking-wider uppercase" style={{ color: '#9CA3AF' }}>
              Structured Intelligence
            </p>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-[24px] font-bold mb-1" style={{ color: '#111827' }}>Bienvenue</h1>
            <p className="text-[14px]" style={{ color: '#4B5563' }}>Accédez à votre espace assureur</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#4B5563' }}>Email</label>
              <input
                type="email"
                defaultValue="cardif@demo.com"
                className="w-full h-10 rounded-[8px] px-3 text-[14px]"
                style={{ border: '1px solid #E5E7EB', color: '#111827', background: '#FFFFFF' }}
                readOnly
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#4B5563' }}>Mot de passe</label>
              <input
                type="password"
                defaultValue="demo2026"
                className="w-full h-10 rounded-[8px] px-3 text-[14px]"
                style={{ border: '1px solid #E5E7EB', color: '#111827', background: '#FFFFFF' }}
                readOnly
              />
            </div>

            <button
              type="submit"
              className="w-full h-11 rounded-[12px] text-white font-semibold text-[14px] flex items-center justify-center gap-2 mt-2 transition-opacity hover:opacity-90"
              style={{ background: '#3B28CC' }}
            >
              Se connecter
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => router.push('/assureur/dashboard')}
              className="w-full h-11 rounded-[12px] font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors hover:bg-gray-50"
              style={{ border: '1px solid #E5E7EB', color: '#3B28CC' }}
            >
              Utiliser le compte démo
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <Lock size={12} style={{ color: '#9CA3AF' }} />
          <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
            Connexion sécurisée · MIF2/DDA conforme
          </p>
        </div>
      </div>
    </div>
  );
}
