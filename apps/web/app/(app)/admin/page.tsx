'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Layers, BarChart3, Users, ChevronRight, Calculator, type LucideIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)} Md€`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} M€`;
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
}

function StatCard({ label, value, icon: Icon, accent = '#3B1FA8' }: StatCardProps) {
  return (
    <div className="bg-white border border-border rounded-lg p-5 flex items-start gap-4 shadow-xs">
      <div
        className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${accent}18`, color: accent }}
      >
        <Icon size={18} strokeWidth={2} className="text-current" />
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-ink-3 text-xs uppercase tracking-widest font-body font-semibold">
          {label}
        </span>
        <span className="font-display text-2xl font-bold text-ink leading-none">
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
      className="group bg-white border border-border rounded-lg p-5 flex items-center gap-4 shadow-xs hover:shadow-md hover:border-violet transition-all duration-200"
    >
      <div className="w-10 h-10 rounded-md bg-violet-pale flex items-center justify-center shrink-0">
        <Icon size={18} strokeWidth={2} className="text-violet" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm font-semibold text-ink">{label}</p>
        <p className="font-body text-xs text-ink-3">{description}</p>
      </div>
      <ChevronRight
        size={16}
        className="text-ink-3 group-hover:text-violet transition-colors duration-150 shrink-0"
      />
    </Link>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function StatSkeleton() {
  return (
    <div className="bg-white border border-border rounded-lg p-5 flex items-start gap-4 animate-pulse">
      <div className="w-10 h-10 rounded-md bg-surface-2 shrink-0" />
      <div className="flex flex-col gap-2 flex-1">
        <div className="h-2.5 w-24 bg-surface-2 rounded" />
        <div className="h-7 w-16 bg-surface-2 rounded" />
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
    <main className="max-w-container mx-auto px-6 py-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <h1 className="font-display text-3xl font-bold text-ink mb-3">
        Administration
      </h1>
      <div className="gradient-bar h-1 rounded-full mb-8" />

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <section aria-label="Statistiques générales" className="mb-10">
        <h2 className="font-display text-lg font-bold text-ink mb-4">
          Vue d&apos;ensemble
        </h2>

        {error ? (
          <Card static className="py-8 flex items-center justify-center">
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
            />
            <StatCard
              label="Enveloppes actives"
              value={stats?.activeShelves ?? 0}
              icon={Layers}
              accent="#1A3FCC"
            />
            <StatCard
              label="Volume total"
              value={formatAmount(stats?.totalVolume ?? 0)}
              icon={BarChart3}
              accent="#00B894"
            />
            <StatCard
              label="Utilisateurs actifs"
              value={stats?.activeUsers ?? 0}
              icon={Users}
              accent="#D4A017"
            />
          </div>
        )}
      </section>

      {/* ── Quick links ────────────────────────────────────────────────────── */}
      <section aria-label="Accès rapide">
        <h2 className="font-display text-lg font-bold text-ink mb-4">
          Accès rapide
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickLink
            href="/admin/products"
            label="Gérer les produits"
            description="Créer, modifier et archiver les produits structurés"
            icon={Package}
          />
          <QuickLink
            href="/admin/shelves"
            label="Gérer les enveloppes"
            description="Suivre les enveloppes et leur taux de remplissage"
            icon={Layers}
          />
          <QuickLink
            href="/admin/users"
            label="Gérer les utilisateurs"
            description="Administrer les comptes et les habilitations"
            icon={Users}
          />
          <QuickLink
            href="/pricing"
            label="Pricer un produit"
            description="Configurer et pricer un nouveau produit structuré"
            icon={Calculator}
          />
        </div>
      </section>
    </main>
  );
}
