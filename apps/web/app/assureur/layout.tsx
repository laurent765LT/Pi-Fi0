'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ClipboardList, Users, Settings,
  LogOut, Zap, ChevronRight, X, Bell,
} from 'lucide-react';
import { ASSUREUR_DEMO } from '@/lib/mock-data-assureur';

const NAV_ITEMS = [
  { href: '/assureur/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/assureur/produits', label: 'Mes produits', icon: Package },
  { href: '/assureur/enveloppes', label: 'Enveloppes', icon: ClipboardList },
  { href: '/assureur/distributeurs', label: 'Distributeurs', icon: Users },
];

function DemoBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="flex items-center justify-between px-5 py-2.5" style={{ background: '#EEF0FD' }}>
      <p className="text-[13px] font-medium" style={{ color: '#3B28CC' }}>
        <span className="mr-1.5">🎯</span>
        Mode démo · Données {ASSUREUR_DEMO.nom} · Toutes les données sont fictives à des fins de démonstration
      </p>
      <button onClick={() => setVisible(false)} className="p-1 rounded hover:bg-white/50 transition-colors" style={{ color: '#3B28CC' }}>
        <X size={14} />
      </button>
    </div>
  );
}

export default function AssureurLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="min-h-screen" style={{ background: '#F4F4F8' }}>
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen bg-white flex flex-col z-20" style={{ width: 248, borderRight: '1px solid #E5E7EB' }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-[60px] shrink-0" style={{ borderBottom: '1px solid #E5E7EB' }}>
          <span className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: '#3B28CC' }}>
            <Zap size={13} className="text-white" strokeWidth={2.5} />
          </span>
          <span className="font-extrabold text-[17px] leading-none tracking-tight select-none">
            <span style={{ color: '#111827' }}>Strick</span>
            <span style={{ color: '#3B28CC' }}>&lsquo;in</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-5 px-3 flex flex-col gap-1 overflow-y-auto">
          <span className="text-[9px] uppercase tracking-[0.25em] font-bold px-3 mb-2" style={{ color: '#9CA3AF' }}>
            Navigation
          </span>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 px-3 h-[38px] rounded-[8px] text-[13px] font-medium transition-all duration-150"
                style={{
                  background: active ? '#3B28CC' : 'transparent',
                  color: active ? '#FFFFFF' : '#4B5563',
                }}
              >
                <Icon size={16} strokeWidth={active ? 2.2 : 1.8} style={{ color: active ? '#FFFFFF' : '#9CA3AF' }} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={13} style={{ color: 'rgba(255,255,255,0.6)' }} />}
              </Link>
            );
          })}

          <div className="h-px mx-2 my-3" style={{ background: '#E5E7EB' }} />
          <span className="text-[9px] uppercase tracking-[0.25em] font-bold px-3 mb-2" style={{ color: '#9CA3AF' }}>
            Système
          </span>
          <Link
            href="#"
            className="flex items-center gap-3 px-3 h-[38px] rounded-[8px] text-[13px] font-medium transition-all duration-150"
            style={{ color: '#4B5563' }}
            onClick={(e) => { e.preventDefault(); alert('Fonctionnalité disponible en production'); }}
          >
            <Settings size={16} style={{ color: '#9CA3AF' }} />
            <span>Paramètres</span>
          </Link>
        </nav>

        {/* User footer */}
        <div className="px-3 py-3 shrink-0" style={{ borderTop: '1px solid #E5E7EB' }}>
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-[8px] group">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: '#3B28CC' }}>
              <span className="font-bold text-[10px] text-white leading-none">DM</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold truncate leading-tight" style={{ color: '#111827' }}>
                {ASSUREUR_DEMO.contact}
              </p>
              <p className="text-[10px] truncate leading-tight mt-0.5" style={{ color: '#9CA3AF' }}>
                {ASSUREUR_DEMO.nom}
              </p>
            </div>
            <Link
              href="/assureur-login"
              className="p-1.5 rounded-md transition-colors duration-150 opacity-60 hover:opacity-100"
              style={{ color: '#DC2626' }}
              title="Se déconnecter"
            >
              <LogOut size={13} strokeWidth={2} />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-h-screen" style={{ paddingLeft: 248 }}>
        <DemoBanner />

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-4" style={{ borderBottom: '1px solid #E5E7EB', background: '#FFFFFF' }}>
          <div>
            <h2 className="text-[15px] font-bold" style={{ color: '#111827' }}>
              Bonjour, {ASSUREUR_DEMO.contact.split(' ')[0]}
            </h2>
            <p className="text-[12px]" style={{ color: '#9CA3AF' }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button className="relative p-2 rounded-[8px] transition-colors hover:bg-gray-100">
            <Bell size={18} style={{ color: '#4B5563' }} />
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white" style={{ background: '#DC2626' }}>
              3
            </span>
          </button>
        </div>

        <div className="max-w-[1200px] mx-auto px-8 py-7">{children}</div>
      </main>
    </div>
  );
}
