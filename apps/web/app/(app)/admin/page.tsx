'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package,
  Layers,
  BarChart3,
  Users,
  ChevronRight,
  Calculator,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)} Md\u20AC`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} M\u20AC`;
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  accent?: string;
  accentTo?: string;
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent = '#3B1FA8',
  accentTo,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden',
        'bg-white dark:bg-[#1A0A3E]/40 border border-border/60 rounded-xl p-5',
        'flex items-start gap-4',
        'shadow-sm hover:shadow-md',
        'transition-all duration-200 ease-out',
        'hover:-translate-y-0.5',
      )}
    >
      {/* Subtle gradient accent at top */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity duration-200"
        style={{
          background: `linear-gradient(90deg, ${accent}, ${accentTo ?? accent}88)`,
        }}
      />

      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-black/5 dark:ring-white/10"
        style={{
          background: `linear-gradient(135deg, ${accent}14, ${accent}08)`,
          color: accent,
        }}
      >
        <Icon size={18} strokeWidth={2} className="text-current" />
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-ink-3 dark:text-ink-3 text-[11px] uppercase tracking-widest font-body font-semibold">
          {label}
        </span>
        <span className="font-display text-2xl font-bold text-ink dark:text-white leading-none tracking-tight">
          {value}
        </span>
      </div>
    </div>
  );
}

// ─── Quick Link Card ──────────────────────────────────────────────────────────

function QuickLink({
  href,
  label,
  description,
  icon: Icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative overflow-hidden',
        'bg-white dark:bg-[#1A0A3E]/30 border border-border/60 rounded-xl p-5',
        'flex items-center gap-4',
        'shadow-sm hover:shadow-md',
        'hover:border-[#3B1FA8]/30 dark:hover:border-[#3B1FA8]/50',
        'transition-all duration-200 ease-out',
        'hover:-translate-y-0.5',
      )}
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#3B1FA8]/[0.02] to-[#00B894]/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-[#3B1FA8]/10 to-[#3B1FA8]/5 dark:from-[#3B1FA8]/20 dark:to-[#3B1FA8]/10 flex items-center justify-center shrink-0 ring-1 ring-[#3B1FA8]/10">
        <Icon
          size={18}
          strokeWidth={2}
          className="text-[#3B1FA8] group-hover:scale-110 transition-transform duration-200"
        />
      </div>
      <div className="relative flex-1 min-w-0">
        <p className="font-body text-sm font-semibold text-ink dark:text-white group-hover:text-[#3B1FA8] dark:group-hover:text-[#C9BCFF] transition-colors duration-200">
          {label}
        </p>
        <p className="font-body text-xs text-ink-3 mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
      <ChevronRight
        size={16}
        className="relative text-ink-3/40 group-hover:text-[#3B1FA8] group-hover:translate-x-0.5 transition-all duration-200 shrink-0"
      />
    </Link>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function StatSkeleton() {
  return (
    <div className="bg-white dark:bg-[#1A0A3E]/40 border border-border/60 rounded-xl p-5 flex items-start gap-4 animate-pulse">
      <div className="w-10 h-10 rounded-lg bg-surface-2 dark:bg-white/5 shrink-0" />
      <div className="flex flex-col gap-2 flex-1">
        <div className="h-2.5 w-24 bg-surface-2 dark:bg-white/5 rounded" />
        <div className="h-7 w-16 bg-surface-2 dark:bg-white/5 rounded" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getAdminStats()
      .then((data) => setStats(data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement'),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="w-full animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B1FA8] to-[#1A0A3E] flex items-center justify-center shadow-sm shadow-[#3B1FA8]/20">
          <ShieldCheck size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight bg-gradient-to-r from-[#3B1FA8] via-[#1A0A3E] to-[#3B1FA8] bg-clip-text text-transparent dark:from-white dark:via-[#C9BCFF] dark:to-white">
            Administration
          </h1>
          <p className="font-body text-sm text-ink-3 mt-0.5">
            Vue d&apos;ensemble de la plateforme Strick&apos;in
          </p>
        </div>
      </div>
      <div
        className="h-[2px] rounded-full mb-6"
        style={{
          background: 'linear-gradient(90deg, #3B1FA8, #00B894 40%, #D4A017 70%, transparent)',
        }}
      />

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <section aria-label="Statistiques generales" className="mb-10">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={16} className="text-[#3B1FA8]" />
          <h2 className="font-display text-base font-bold text-ink dark:text-white uppercase tracking-wide">
            Vue d&apos;ensemble
          </h2>
        </div>

        {error ? (
          <Card static className="py-8 flex items-center justify-center rounded-xl border-border/60">
            <p className="font-body text-sm text-red">{error}</p>
          </Card>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total produits"
              value={stats?.totalProducts ?? 0}
              icon={Package}
              accent="#3B1FA8"
              accentTo="#6C4FE0"
            />
            <StatCard
              label="Enveloppes actives"
              value={stats?.activeShelves ?? 0}
              icon={Layers}
              accent="#1A0A3E"
              accentTo="#3B1FA8"
            />
            <StatCard
              label="Volume total"
              value={formatAmount(stats?.totalVolume ?? 0)}
              icon={BarChart3}
              accent="#00B894"
              accentTo="#00D4AA"
            />
            <StatCard
              label="Utilisateurs actifs"
              value={stats?.activeUsers ?? 0}
              icon={Users}
              accent="#D4A017"
              accentTo="#E8B84A"
            />
          </div>
        )}
      </section>

      {/* ── Quick links ────────────────────────────────────────────────────── */}
      <section aria-label="Acces rapide">
        <div className="flex items-center gap-2 mb-5">
          <ChevronRight size={16} className="text-[#00B894]" />
          <h2 className="font-display text-base font-bold text-ink dark:text-white uppercase tracking-wide">
            Acces rapide
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickLink
            href="/admin/products"
            label="Gerer les produits"
            description="Creer, modifier et archiver les produits structures"
            icon={Package}
          />
          <QuickLink
            href="/admin/shelves"
            label="Gerer les enveloppes"
            description="Suivre les enveloppes et leur taux de remplissage"
            icon={Layers}
          />
          <QuickLink
            href="/admin/users"
            label="Gerer les utilisateurs"
            description="Administrer les comptes et les habilitations"
            icon={Users}
          />
          <QuickLink
            href="/pricing"
            label="Pricer un produit"
            description="Configurer et pricer un nouveau produit structure"
            icon={Calculator}
          />
        </div>
      </section>
    </main>
  );
}
