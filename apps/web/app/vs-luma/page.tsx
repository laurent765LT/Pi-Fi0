'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Globe, Shield, Brain, FileText } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ComparisonTable } from '@/components/marketing/ComparisonTable';

const REASONS: Array<{
  icon: typeof CheckCircle2;
  title: string;
  description: string;
}> = [
  {
    icon: Globe,
    title: "Conçu pour le marché français et l'EMEA",
    description:
      "Catalogue 100 % PRIIPs, KID automatique en français, conformité MIF II native. Luma reste une plateforme US-centric peu adaptée aux contraintes AMF/ACPR.",
  },
  {
    icon: Shield,
    title: 'DER, KID PRIIPs, SFDR Art. 8 / 9 en un clic',
    description:
      'Strick’in génère automatiquement l’ensemble des documents réglementaires exigés par un CGP français — rapport d’adéquation, devoir de conseil, FAT KID v2.',
  },
  {
    icon: Brain,
    title: 'IA CGP : scoring, commentary, stress tests',
    description:
      "Suite IA en français, entraînée sur les payoffs Euro : Autocall Phoenix, CNO, Capital Protégé. Luma propose une IA bêta limitée, en anglais.",
  },
  {
    icon: FileText,
    title: 'Signature Yousign + archivage eIDAS qualifié',
    description:
      "Processus e-signature natif conforme eIDAS. Luma ne supporte pas la signature électronique qualifiée européenne.",
  },
  {
    icon: CheckCircle2,
    title: 'Overbooking FIFO & marketplace SMA',
    description:
      "Allocation FIFO avec overbooking 20-30 %, pooling SMA inter-CGP pour maximiser les allocations. Luma conserve un modèle RFP + Reserved Marketplace moins agile.",
  },
];

export default function VsLumaPage() {
  return (
    <>
      <head>
        <title>
          Strick&apos;in vs Luma : quelle plateforme choisir en 2026 ?
        </title>
        <meta
          name="description"
          content="Comparatif Strick'in vs Luma : pourquoi choisir une plateforme française native MIF II pour distribuer des produits structurés en 2026 ?"
        />
        <meta
          property="og:title"
          content="Strick'in vs Luma : quelle plateforme choisir en 2026 ?"
        />
        <meta
          property="og:description"
          content="Comparatif Strick'in vs Luma pour distribuer des produits structurés : MIF II, PRIIPs, SFDR, Yousign, IA française."
        />
        <meta property="og:type" content="article" />
        <link rel="canonical" href="/vs-luma" />
      </head>

      <main
        className="min-h-screen bg-surface text-ink dark:bg-ink dark:text-white"
        style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
      >
        {/* Hero */}
        <section className="border-b border-border">
          <div className="max-w-[1080px] mx-auto px-6 md:px-10 py-16 md:py-24">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-violet hover:underline mb-5"
            >
              ← Retour à l&apos;accueil
            </Link>
            <span className="inline-block text-[11px] uppercase tracking-[0.18em] text-violet font-bold border border-violet/30 rounded-full px-3 py-1 mb-5 bg-violet-pale/40">
              Comparatif plateformes structurés
            </span>
            <h1 className="font-display text-[32px] md:text-[48px] leading-[1.05] font-extrabold tracking-tight mb-6">
              Strick&apos;in vs Luma : quelle plateforme choisir pour distribuer
              des produits structurés en 2026 ?
            </h1>
            <div className="space-y-4 text-[15px] md:text-[16px] text-ink-2 dark:text-white/75 max-w-3xl leading-relaxed">
              <p>
                Luma Financial Technologies est aujourd&apos;hui la plateforme
                de référence aux États-Unis pour les annuities et structured
                notes. Sa percée en Europe s&apos;accélère, mais la transition
                culturelle et réglementaire reste un défi : KID PRIIPs v2,
                SFDR, devoir de conseil AMF, DER… autant d&apos;artefacts
                spécifiques au marché européen absents du cœur Luma.
              </p>
              <p>
                Strick&apos;in a été conçu en France, pour les CGP
                francophones. Sa promesse : une plateforme multi-émetteurs
                indépendante, avec IA française, conformité réglementaire
                automatique, et compatibilité passport UE (LU, BE) + Suisse.
              </p>
              <p>
                Ce dossier compare <strong>plus de 25 critères</strong> — du
                catalogue d&apos;émetteurs aux outils ESG, de la signature
                Yousign aux exports AMF. Objectif : vous aider à décider
                objectivement.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                href="/demo"
                className={cn(
                  'inline-flex items-center gap-2 h-11 px-5 rounded-md',
                  'bg-violet text-white font-semibold text-[14px]',
                  'shadow-violet hover:bg-violet-dark transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2',
                )}
              >
                Démarrer gratuitement
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/vs-feefty"
                className={cn(
                  'inline-flex items-center gap-2 h-11 px-5 rounded-md',
                  'border border-violet/30 text-violet font-semibold text-[14px]',
                  'hover:bg-violet-pale transition-colors',
                )}
              >
                Voir aussi : Strick&apos;in vs Feefty
              </Link>
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="py-16 md:py-24">
          <div className="max-w-[1180px] mx-auto px-6 md:px-10">
            <ComparisonTable
              title="Feature par feature"
              subtitle="Plus de 25 fonctionnalités comparées sur six dimensions — distribution, IA, conformité, workflow, émetteurs et onboarding."
            />
          </div>
        </section>

        {/* Reasons */}
        <section className="border-t border-border bg-surface-2/30 dark:bg-white/[0.02] py-16 md:py-24">
          <div className="max-w-[1080px] mx-auto px-6 md:px-10">
            <header className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-[11px] uppercase tracking-[0.18em] text-violet font-bold">
                Synthèse
              </span>
              <h2 className="font-display text-[28px] md:text-[36px] font-extrabold text-ink dark:text-white leading-tight mt-3">
                Les 5 raisons de choisir Strick&apos;in plutôt que Luma
              </h2>
            </header>
            <ol className="grid gap-4 md:grid-cols-2">
              {REASONS.map((r, i) => (
                <li
                  key={r.title}
                  className="rounded-xl border border-border bg-white dark:bg-white/[0.03] p-5 flex gap-4"
                >
                  <div
                    className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background:
                        'linear-gradient(135deg, #3B1FA8 0%, #5535C4 100%)',
                    }}
                  >
                    <r.icon size={18} className="text-white" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-violet font-bold mb-1">
                      Raison {i + 1}
                    </p>
                    <h3 className="font-display font-bold text-[15px] text-ink dark:text-white leading-snug">
                      {r.title}
                    </h3>
                    <p className="text-[13px] text-ink-2 dark:text-white/70 mt-1.5 leading-relaxed">
                      {r.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24">
          <div className="max-w-[720px] mx-auto px-6 md:px-10 text-center">
            <h2 className="font-display text-[24px] md:text-[32px] font-extrabold text-ink dark:text-white leading-tight mb-4">
              Essayez une plateforme pensée pour l&apos;Europe
            </h2>
            <p className="text-[14px] md:text-[15px] text-ink-2 dark:text-white/70 mb-7">
              Activation immédiate, aucune carte requise. Accompagnement humain
              en option pour vos 3 premières souscriptions.
            </p>
            <Link
              href="/demo"
              className={cn(
                'inline-flex items-center gap-2 h-12 px-6 rounded-md',
                'bg-violet text-white font-semibold text-[15px]',
                'shadow-violet hover:bg-violet-dark transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2',
              )}
            >
              Démarrer gratuitement
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* Footer links */}
        <footer className="border-t border-border py-8">
          <div className="max-w-[1080px] mx-auto px-6 md:px-10 flex flex-wrap gap-x-6 gap-y-3 text-[12px] text-ink-3">
            <Link href="/" className="hover:text-violet">
              Accueil
            </Link>
            <Link href="/vs-feefty" className="hover:text-violet">
              Strick&apos;in vs Feefty
            </Link>
            <Link href="/demo" className="hover:text-violet">
              Demander une démo
            </Link>
            <Link href="/mentions-legales" className="hover:text-violet">
              Mentions légales
            </Link>
            <Link href="/confidentialite" className="hover:text-violet">
              Confidentialité
            </Link>
          </div>
        </footer>
      </main>
    </>
  );
}
