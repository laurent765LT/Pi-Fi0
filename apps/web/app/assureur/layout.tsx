'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ClipboardList, ClipboardCheck, Users, Settings,
  LogOut, Zap, ChevronRight, X, Bell, Building2, BarChart3, MessageSquare, Shield,
} from 'lucide-react';
import { ASSUREUR_DEMO } from '@/lib/mock-data-assureur';
import { cn } from '@/lib/cn';

const NAV_ITEMS = [
  { href: '/assureur/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/assureur/produits', label: 'Mes produits', icon: Package },
  { href: '/assureur/enveloppes', label: 'Enveloppes', icon: ClipboardList },
  { href: '/assureur/engagements', label: 'Engagements', icon: ClipboardCheck },
  { href: '/assureur/rfq', label: 'Cotations', icon: MessageSquare },
  { href: '/assureur/regles', label: 'Regles', icon: Shield },
  { href: '/assureur/distributeurs', label: 'Distributeurs', icon: Users },
  { href: '/assureur/analytics', label: 'Analytics', icon: BarChart3 },
];

function DemoBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="flex items-center justify-between px-6 py-2.5 bg-violet/[0.06] border-b border-violet/10">
      <p className="text-[13px] font-medium text-violet font-body">
        <span className="mr-1.5">🎯</span>
        Mode demo · Donnees {ASSUREUR_DEMO.nom} · Toutes les donnees sont fictives
      </p>
      <button onClick={() => setVisible(false)} className="p-1 rounded-md hover:bg-violet/10 transition-colors text-violet">
        <X size={14} />
      </button>
    </div>
  );
}

export default function AssureurLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="min-h-screen bg-surface dark:bg-ink">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-[248px] bg-white/90 dark:bg-white/5 backdrop-blur-xl flex flex-col z-20 border-r border-border/60">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-[60px] shrink-0 border-b border-border/60">
          <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-violet to-cobalt shadow-lg shadow-violet/25">
            <Zap size={14} className="text-white" strokeWidth={2.5} />
          </span>
          <span className="font-display font-extrabold text-[17px] leading-none tracking-tight select-none">
            <span className="text-ink dark:text-white">Strick</span>
            <span className="text-violet">&lsquo;in</span>
          </span>
        </div>

        {/* Role badge */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet/[0.06] border border-violet/10">
            <Building2 size={12} className="text-violet" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-violet font-body">
              Espace Assureur
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-3 flex flex-col gap-0.5 overflow-y-auto">
          <span className="text-[9px] uppercase tracking-[0.25em] font-bold px-3 mb-2 text-ink-3 font-body">
            Navigation
          </span>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'group flex items-center gap-3 px-3 h-[38px] rounded-xl text-[13px] font-medium font-body transition-all duration-200',
                  active
                    ? 'bg-gradient-to-r from-violet to-cobalt text-white shadow-md shadow-violet/20'
                    : 'text-ink-2 dark:text-white/60 hover:bg-violet/[0.06] hover:text-violet',
                )}
              >
                <Icon size={16} strokeWidth={active ? 2.2 : 1.8} className={active ? 'text-white' : 'text-ink-3 group-hover:text-violet'} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={13} className="text-white/60" />}
              </Link>
            );
          })}

          <div className="h-px mx-2 my-3 bg-border/60" />
          <span className="text-[9px] uppercase tracking-[0.25em] font-bold px-3 mb-2 text-ink-3 font-body">
            Systeme
          </span>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 h-[38px] rounded-xl text-[13px] font-medium font-body text-ink-2 dark:text-white/60 hover:bg-violet/[0.06] hover:text-violet transition-all duration-200"
          >
            <Settings size={16} className="text-ink-3" />
            <span>Parametres</span>
          </Link>
        </nav>

        {/* User footer */}
        <div className="px-3 py-3 shrink-0 border-t border-border/60">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl group hover:bg-surface/80 transition-colors">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-violet to-cobalt shadow-sm">
              <span className="font-display font-bold text-[10px] text-white leading-none">DM</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold truncate leading-tight text-ink dark:text-white font-body">
                {ASSUREUR_DEMO.contact}
              </p>
              <p className="text-[10px] truncate leading-tight mt-0.5 text-ink-3 font-body">
                {ASSUREUR_DEMO.nom}
              </p>
            </div>
            <Link
              href="/assureur-login"
              className="p-1.5 rounded-lg transition-all duration-200 text-ink-3 hover:text-red-500 hover:bg-red-50"
              title="Se deconnecter"
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
        <div className="flex items-center justify-between px-8 py-4 border-b border-border/60 bg-white/80 dark:bg-white/5 backdrop-blur-md">
          <div>
            <h2 className="text-[15px] font-display font-bold text-ink dark:text-white">
              Bonjour, {ASSUREUR_DEMO.contact.split(' ')[0]}
            </h2>
            <p className="text-[12px] text-ink-3 font-body">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Link href="/notifications" className="relative p-2.5 rounded-xl transition-all duration-200 hover:bg-violet/[0.06] group">
            <Bell size={18} className="text-ink-2 group-hover:text-violet transition-colors" />
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white bg-red-500 shadow-sm">
              3
            </span>
          </Link>
        </div>

        <div className="max-w-[1200px] mx-auto px-8 py-7">{children}</div>
      </main>
    </div>
  );
}
